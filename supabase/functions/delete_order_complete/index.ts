import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId } = await req.json()
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Starting complete deletion of order: ${orderId}`)

    // 1. Get conversations related to this order
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('order_id', orderId)
    
    console.log(`Found ${conversations?.length || 0} conversations to delete`)

    // 2. Delete messages from inbox and outbox for these conversations
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id)
      
      // Delete inbox messages
      const { error: inboxError } = await supabase
        .from('messages_inbox')
        .delete()
        .in('conversation_id', conversationIds)
      
      if (inboxError) throw inboxError

      // Delete outbox messages
      const { error: outboxError } = await supabase
        .from('messages_outbox')
        .delete()
        .in('conversation_id', conversationIds)
      
      if (outboxError) throw outboxError
      
      console.log('Deleted messages from inbox and outbox')
    }

    // 3. Delete workflow runs related to the order
    const { error: workflowRunsError } = await supabase
      .from('workflow_runs')
      .delete()
      .eq('order_id', orderId)
    
    if (workflowRunsError) throw workflowRunsError
    console.log('Deleted workflow runs')

    // 4. Delete timers related to workflow runs of this order
    const { data: workflowRuns } = await supabase
      .from('workflow_runs')
      .select('id')
      .eq('order_id', orderId)

    if (workflowRuns && workflowRuns.length > 0) {
      const workflowRunIds = workflowRuns.map(wr => wr.id)
      
      const { error: timersError } = await supabase
        .from('timers')
        .delete()
        .in('workflow_run_id', workflowRunIds)
      
      if (timersError) throw timersError
      console.log('Deleted related timers')
    }

    // 5. Delete conversations
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('order_id', orderId)
    
    if (conversationsError) throw conversationsError
    console.log('Deleted conversations')

    // 6. Delete events related to the order (if any)
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .eq('payload->order_id', orderId)
    
    if (eventsError) console.log('Events deletion error (may not exist):', eventsError)

    // 7. Finally, delete the order itself
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
    
    if (orderError) throw orderError
    console.log('Deleted order')

    return new Response(
      JSON.stringify({ success: true, message: 'Order and all related data deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error deleting order:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})