// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(url, service);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type IntentRequest = {
  message_text: string;
  tenant_id?: string;
};

type IntentResponse = {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message_text, tenant_id = "00000000-0000-0000-0000-000000000001" }: IntentRequest = await req.json();

    if (!message_text?.trim()) {
      throw new Error("message_text is required");
    }

    console.log("Classifying intent for message:", message_text);

    // Simple rule-based intent classification
    const text = message_text.toLowerCase().trim();
    let intent = "unknown";
    let confidence = 0.5;
    const entities: Record<string, any> = {};

    // Confirmation intents
    if (/(yes|confirm|ok|si|sí|correct|approve|accept)/i.test(text)) {
      intent = "confirm";
      confidence = 0.9;
    }
    // Order-related intents
    else if (/(order|pedido|compra|purchase)/i.test(text)) {
      intent = "order_inquiry";
      confidence = 0.8;
      
      // Extract order ID if present
      const orderMatch = text.match(/sis-(\d+)/i);
      if (orderMatch) {
        entities.order_id = `SIS-${orderMatch[1]}`;
        confidence = 0.95;
      }
    }
    // Cancellation intents
    else if (/(cancel|cancelar|no|stop|abort)/i.test(text)) {
      intent = "cancel";
      confidence = 0.85;
    }
    // Help/support intents
    else if (/(help|ayuda|support|problema|issue|question|pregunta)/i.test(text)) {
      intent = "help";
      confidence = 0.8;
    }
    // Greeting intents
    else if (/(hello|hi|hola|hey|buenos|good)/i.test(text)) {
      intent = "greeting";
      confidence = 0.9;
    }
    // Status inquiry
    else if (/(status|estado|when|cuando|tracking|rastreo)/i.test(text)) {
      intent = "status_inquiry";
      confidence = 0.8;
    }

    // Store intent classification for analytics
    await supabase.from("events").insert({
      tenant_id,
      kind: "intent_classified",
      payload: {
        message_text,
        intent,
        confidence,
        entities,
        timestamp: new Date().toISOString()
      }
    });

    const response: IntentResponse = {
      intent,
      confidence,
      entities: Object.keys(entities).length > 0 ? entities : undefined
    };

    console.log("Intent classification result:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });

  } catch (e) {
    console.error("agent_intent error:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: errorMessage,
      intent: "unknown",
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});