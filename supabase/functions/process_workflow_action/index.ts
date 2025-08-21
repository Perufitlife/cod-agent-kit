import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { workflow_run_id, action_id, context } = await req.json();

    console.log(`Processing workflow action: ${action_id} for run: ${workflow_run_id}`);

    // Get workflow run and current action
    const { data: workflowRun, error: runError } = await supabase
      .from('workflow_runs')
      .select(`
        *,
        workflow_definitions!inner (
          *,
          workflow_versions!inner (
            definition
          )
        ),
        orders (*)
      `)
      .eq('id', workflow_run_id)
      .single();

    if (runError) throw runError;

    const definition = workflowRun.workflow_definitions.workflow_versions[0].definition as any;
    const action = definition.actions.find((a: any) => a.id === action_id);
    
    if (!action) {
      throw new Error(`Action ${action_id} not found in workflow definition`);
    }

    let nextAction = null;
    let shouldContinue = true;
    let updatedContext = { ...context };

    // Process the action based on its type
    switch (action.action_type) {
      case 'wait':
        console.log(`Waiting for ${action.config.duration} minutes`);
        
        // Create a timer for the next action
        const nextActionIndex = definition.actions.findIndex((a: any) => a.id === action_id) + 1;
        if (nextActionIndex < definition.actions.length) {
          const delay = action.config.duration * 60 * 1000; // Convert to milliseconds
          const fireAt = new Date(Date.now() + delay);
          
          await supabase.from('timers').insert({
            tenant_id: workflowRun.tenant_id,
            workflow_run_id: workflow_run_id,
            fire_at: fireAt.toISOString(),
            purpose: 'workflow_continue',
            status: 'scheduled'
          });
        }
        shouldContinue = false; // Wait for timer
        break;

      case 'check_condition':
        const conditionResult = await evaluateCondition(action.config, workflowRun.orders, supabase);
        updatedContext.last_condition_result = conditionResult;
        
        console.log(`Condition check result: ${conditionResult}`);
        
        // Find next action based on condition result
        const currentIndex = definition.actions.findIndex((a: any) => a.id === action_id);
        if (conditionResult) {
          // Continue to next action (YES path)
          nextAction = definition.actions[currentIndex + 1];
        } else {
          // Skip to end or alternative path (NO path)
          // For now, we'll end the workflow if condition fails
          shouldContinue = false;
          await supabase
            .from('workflow_runs')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString(),
              context: updatedContext 
            })
            .eq('id', workflow_run_id);
        }
        break;

      case 'ai_agent_decision':
        const aiDecision = await makeAIDecision(action.config, workflowRun.orders, supabase);
        updatedContext.ai_decision = aiDecision;
        
        console.log(`AI Decision: ${aiDecision}`);
        
        // Continue to next action
        const aiCurrentIndex = definition.actions.findIndex((a: any) => a.id === action_id);
        nextAction = definition.actions[aiCurrentIndex + 1];
        break;

      case 'send_message':
        await sendMessage(action.config, workflowRun.orders, updatedContext);
        
        // Continue to next action
        const msgCurrentIndex = definition.actions.findIndex((a: any) => a.id === action_id);
        nextAction = definition.actions[msgCurrentIndex + 1];
        break;

      case 'update_order':
        await supabase
          .from('orders')
          .update({ status: action.config.status })
          .eq('id', workflowRun.order_id);
        
        console.log(`Updated order ${workflowRun.order_id} status to ${action.config.status}`);
        
        // Continue to next action
        const updateCurrentIndex = definition.actions.findIndex((a: any) => a.id === action_id);
        nextAction = definition.actions[updateCurrentIndex + 1];
        break;

      case 'end_workflow':
        console.log(`Ending workflow: ${action.config.reason}`);
        shouldContinue = false;
        await supabase
          .from('workflow_runs')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString(),
            context: updatedContext 
          })
          .eq('id', workflow_run_id);
        break;

      default:
        console.log(`Unknown action type: ${action.action_type}`);
        // Continue to next action by default
        const defaultCurrentIndex = definition.actions.findIndex((a: any) => a.id === action_id);
        nextAction = definition.actions[defaultCurrentIndex + 1];
    }

    // Update workflow run state and continue if needed
    if (shouldContinue && nextAction) {
      await supabase
        .from('workflow_runs')
        .update({ 
          current_state: nextAction.id,
          context: updatedContext 
        })
        .eq('id', workflow_run_id);

      // Recursively process next action
      return await fetch(`${supabaseUrl}/functions/v1/process_workflow_action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_run_id,
          action_id: nextAction.id,
          context: updatedContext
        })
      });
    }

    return new Response(JSON.stringify({ success: true, context: updatedContext }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing workflow action:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function evaluateCondition(config: any, order: any, supabase: any): Promise<boolean> {
  switch (config.condition_type) {
    case 'has_tag':
      // Check if order has specific tag
      const tags = order?.data?.tags || [];
      return tags.includes(config.tag_name);
      
    case 'order_status':
      return order?.status === config.expected_status;
      
    default:
      return false;
  }
}

async function makeAIDecision(config: any, order: any, supabase: any): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.log('No OpenAI API key, using fallback decision logic');
    // Simple fallback logic
    if (order?.customer_phone_e164 && order?.data?.total) {
      return config.option_1; // confirm_order
    }
    return config.option_2; // reject_order
  }

  try {
    // Replace template variables in prompt with actual order data
    let prompt = config.prompt || '';
    const replacements = {
      '{{customer_phone}}': order?.customer_phone_e164 || 'N/A',
      '{{customer_name}}': order?.data?.customer_name || 'N/A',
      '{{order_id}}': order?.system_order_id || 'N/A',
      '{{address}}': order?.data?.address || 'N/A',
      '{{reference}}': order?.data?.reference || 'N/A',
      '{{district}}': order?.data?.district || 'N/A',
      '{{city}}': order?.data?.city || 'N/A',
      '{{province}}': order?.data?.province || 'N/A',
      '{{country}}': order?.data?.country || 'N/A',
      '{{products}}': JSON.stringify(order?.data?.products || []),
      '{{quantity}}': order?.data?.quantity || 'N/A',
      '{{total}}': order?.data?.total || 'N/A',
    };

    for (const [key, value] of Object.entries(replacements)) {
      prompt = prompt.replace(new RegExp(key, 'g'), String(value));
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping with order processing. Respond with ONLY one of these options: "${config.option_1}" or "${config.option_2}". Do not include any other text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      }),
    });

    const data = await response.json();
    const decision = data.choices?.[0]?.message?.content?.trim() || config.option_2;
    
    // Ensure the response matches one of our options
    if (decision.includes(config.option_1)) {
      return config.option_1;
    } else {
      return config.option_2;
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return config.option_2; // Default to reject on error
  }
}

async function sendMessage(config: any, order: any, context: any) {
  // This would integrate with your messaging system
  console.log(`Sending message: ${config.message} to ${order?.customer_phone_e164}`);
  
  // For now, just log the message
  // In a real implementation, you'd call your SMS/WhatsApp API here
}