import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OpenAIRequest {
  message_text: string;
  tenant_id?: string;
  conversation_context?: any;
}

interface OpenAIResponse {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  reasoning?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message_text, tenant_id = "00000000-0000-0000-0000-000000000001", conversation_context } = await req.json() as OpenAIRequest;
    
    if (!message_text) {
      throw new Error("message_text is required");
    }

    // Get tenant's OpenAI API key
    const { data: tenantSettings, error: settingsError } = await supabase
      .from("tenant_settings")
      .select("openai_api_key_encrypted, ai_mode")
      .eq("tenant_id", tenant_id)
      .single();

    if (settingsError || !tenantSettings?.openai_api_key_encrypted) {
      throw new Error("OpenAI API key not configured for this tenant");
    }

    const apiKey = tenantSettings.openai_api_key_encrypted;
    const startTime = Date.now();

    // Prepare the system prompt for intent classification
    const systemPrompt = `You are an AI assistant that classifies customer messages in a COD (Cash on Delivery) order management system.

Analyze the message and classify it into one of these intents:
- "confirm": Customer confirms/accepts an order
- "cancel": Customer wants to cancel an order  
- "reschedule": Customer wants to change delivery date/time
- "update_address": Customer wants to change delivery address
- "order_inquiry": Customer asks about order status or details
- "payment_inquiry": Customer asks about payment or pricing
- "complaint": Customer has an issue or complaint
- "general_inquiry": General questions not order-specific
- "greeting": Simple greetings or conversation starters
- "unknown": Cannot determine clear intent

Extract relevant entities:
- order_id: Any order reference (SIS-XXXX format or numbers)
- address: Full addresses mentioned
- date: Dates mentioned for delivery
- time: Times mentioned for delivery
- amount: Money amounts mentioned
- product_name: Specific products mentioned

Respond with JSON only:
{
  "intent": "intent_name",
  "confidence": 0.0-1.0,
  "entities": {
    "order_id": "extracted_id",
    "address": "extracted_address",
    "date": "extracted_date",
    "time": "extracted_time",
    "amount": "extracted_amount",
    "product_name": "extracted_product"
  },
  "reasoning": "brief explanation of classification"
}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this customer message: "${message_text}"` }
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0].message.content;
    
    let result: OpenAIResponse;
    try {
      result = JSON.parse(aiContent);
    } catch {
      // Fallback if JSON parsing fails
      result = {
        intent: "unknown",
        confidence: 0.5,
        entities: {},
        reasoning: "Failed to parse AI response"
      };
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Log the OpenAI call for monitoring
    await supabase.from("events").insert({
      tenant_id,
      kind: "openai_call",
      payload: {
        message_text,
        intent: result.intent,
        confidence: result.confidence,
        entities: result.entities,
        latency_ms: latency,
        model: "gpt-4o-mini",
        tokens_used: aiResponse.usage?.total_tokens || 0,
        cost_estimate: (aiResponse.usage?.total_tokens || 0) * 0.00015 / 1000 // Rough estimate for gpt-4o-mini
      }
    });

    console.log(`OpenAI classification: ${result.intent} (${result.confidence}) in ${latency}ms`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("call_openai error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      intent: "unknown",
      confidence: 0,
      entities: {}
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});