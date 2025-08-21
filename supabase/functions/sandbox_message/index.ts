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

type Body = { customer_phone: string; message_text: string; conversation_id?: string };

// Función para iniciar workflows
async function initiateWorkflow(tenant_id: string, order_id: string, conversation_id: string, trigger: string) {
  try {
    // Buscar workflow definition para el trigger
    const { data: workflow } = await supabase
      .from("workflow_definitions")
      .select("id, name")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true)
      .ilike("name", "%confirmation%") // Buscar workflow de confirmación
      .limit(1)
      .maybeSingle();

    if (workflow) {
      // Crear workflow run
      const { data: run } = await supabase
        .from("workflow_runs")
        .insert({
          tenant_id,
          workflow_version_id: workflow.id, // Simplificado para el demo
          order_id,
          conversation_id,
          current_state: "confirmed",
          context: { trigger, customer_confirmed_at: new Date().toISOString() }
        })
        .select("id")
        .single();

      console.log("Workflow initiated:", workflow.name, "run ID:", run?.id);
    }
  } catch (error) {
    console.error("Failed to initiate workflow:", error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    const tenant_id = "00000000-0000-0000-0000-000000000001";

    // 1) asegurar conversacion
    let conversation_id = body.conversation_id;
    if (!conversation_id) {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("customer_phone", body.customer_phone)
        .maybeSingle();
      if (conv) conversation_id = conv.id;
      else {
        const { data: newConv, error: cErr } = await supabase
          .from("conversations")
          .insert({
            tenant_id,
            customer_phone: body.customer_phone,
            status: "active",
          })
          .select("id")
          .single();
        if (cErr) throw cErr;
        conversation_id = newConv.id;
      }
    }

    // 2) guardar inbound
    const { error: inErr } = await supabase.from("messages_inbox").insert({
      tenant_id,
      conversation_id,
      message_text: body.message_text,
      customer_phone: body.customer_phone,
    });
    if (inErr) throw inErr;

    // 3) determinar intención usando AI si disponible, fallback a agent_intent
    let intent = "ask_question";
    let confidence = 0.5;
    let entities = {};
    
    try {
      // Primero intentar con OpenAI si está configurado
      const { data: tenantSettings } = await supabase
        .from("tenant_settings")
        .select("openai_api_key_encrypted, ai_mode")
        .eq("tenant_id", tenant_id)
        .single();

      if (tenantSettings?.openai_api_key_encrypted) {
        console.log("Using OpenAI for intent detection");
        const openaiRes = await supabase.functions.invoke("call_openai", {
          body: { 
            message_text: body.message_text, 
            tenant_id,
            conversation_context: { customer_phone: body.customer_phone } 
          }
        });
        
        if (openaiRes.data && !openaiRes.error) {
          intent = openaiRes.data.intent || "ask_question";
          confidence = openaiRes.data.confidence || 0.5;
          entities = openaiRes.data.entities || {};
          console.log("OpenAI classification:", { intent, confidence, entities });
        } else {
          throw new Error("OpenAI classification failed");
        }
      } else {
        throw new Error("No OpenAI key configured");
      }
    } catch (aiError) {
      console.log("OpenAI failed, falling back to rule-based classification:", aiError.message);
      
      // Fallback to existing rule-based agent_intent
      try {
        const intentRes = await supabase.functions.invoke("agent_intent", {
          body: { message_text: body.message_text, tenant_id }
        });
        
        if (intentRes.data?.intent) {
          intent = intentRes.data.intent;
          confidence = intentRes.data.confidence || 0.7;
          console.log("Rule-based classification:", intent, "confidence:", confidence);
        } else {
          throw new Error("agent_intent failed");
        }
      } catch (ruleError) {
        console.error("Both AI and rule-based classification failed:", ruleError);
        // Ultimate fallback
        intent = body.message_text.toLowerCase().includes("confirm") ||
            body.message_text.toLowerCase().includes("yes")
          ? "confirm"
          : "ask_question";
        confidence = 0.3;
      }
    }

    // 4) Procesar intención y actualizar orden si es necesario
    if (intent === "confirm") {
      // Buscar orden por teléfono o por ID extraído por AI
      let orderQuery = supabase
        .from("orders")
        .select("id, system_order_id, status, data")
        .eq("tenant_id", tenant_id)
        .order("created_at", { ascending: false });

      // Si el AI extrajo un order_id, buscarlo específicamente
      if (entities.order_id) {
        console.log("Looking for order with ID:", entities.order_id);
        const { data: specificOrder } = await supabase
          .from("orders")
          .select("id, system_order_id, status, data")
          .eq("tenant_id", tenant_id)
          .or(`system_order_id.eq.${entities.order_id},external_order_id.eq.${entities.order_id}`)
          .maybeSingle();
        
        if (specificOrder) {
          // Confirmar orden específica
          await supabase
            .from("orders")
            .update({ 
              status: "confirmed",
              updated_at: new Date().toISOString(),
              notes: supabase.rpc('array_append', { arr: specificOrder.data?.notes || [], elem: `Customer confirmed via message: "${body.message_text}"` })
            })
            .eq("id", specificOrder.id);

          await supabase.from("messages_outbox").insert({
            tenant_id,
            conversation_id,
            message_text: `✅ Perfect! Your order ${specificOrder.system_order_id} has been confirmed. We'll prepare it for delivery.`,
            status: "queued",
          });

          // Iniciar workflow de confirmación si existe
          await initiateWorkflow(tenant_id, specificOrder.id, conversation_id, "order_confirmed");
          
          return new Response(JSON.stringify({ ok: true, conversation_id, action: "order_confirmed", order_id: specificOrder.id }), {
            headers: { ...corsHeaders, "content-type": "application/json" },
          });
        }
      }

      // Fallback: buscar última orden por teléfono
      const { data: order } = await orderQuery
        .eq("customer_phone_e164", body.customer_phone)
        .limit(1)
        .maybeSingle();

      if (order) {
        await supabase
          .from("orders")
          .update({ 
            status: "confirmed",
            updated_at: new Date().toISOString(),
            notes: supabase.rpc('array_append', { arr: order.data?.notes || [], elem: `Customer confirmed via message: "${body.message_text}"` })
          })
          .eq("id", order.id);

        await supabase.from("messages_outbox").insert({
          tenant_id,
          conversation_id,
          message_text: `✅ Great! Your order ${order.system_order_id} has been confirmed. Expected delivery soon!`,
          status: "queued",
        });

        await initiateWorkflow(tenant_id, order.id, conversation_id, "order_confirmed");
      } else {
        await supabase.from("messages_outbox").insert({
          tenant_id,
          conversation_id,
          message_text: "Thanks for confirming! I couldn't find a matching order for this phone number. Could you please share your order ID (e.g., SIS-1234)?",
          status: "queued",
        });
      }
    } else if (intent === "cancel") {
      // Manejar cancelación
      const { data: order } = await supabase
        .from("orders")
        .select("id, system_order_id")
        .eq("tenant_id", tenant_id)
        .eq("customer_phone_e164", body.customer_phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (order) {
        await supabase
          .from("orders")
          .update({ 
            status: "cancelled",
            updated_at: new Date().toISOString(),
            notes: supabase.rpc('array_append', { arr: order.data?.notes || [], elem: `Customer requested cancellation: "${body.message_text}"` })
          })
          .eq("id", order.id);

        await supabase.from("messages_outbox").insert({
          tenant_id,
          conversation_id,
          message_text: `Your order ${order.system_order_id} has been cancelled as requested. If you change your mind, please contact us!`,
          status: "queued",
        });
      } else {
        await supabase.from("messages_outbox").insert({
          tenant_id,
          conversation_id,
          message_text: "I understand you want to cancel an order. Could you please share your order ID so I can help you?",
          status: "queued",
        });
      }
    } else if (intent === "update_address" && entities.address) {
      // Actualizar dirección si se proporciona
      const { data: order } = await supabase
        .from("orders")
        .select("id, system_order_id, data")
        .eq("tenant_id", tenant_id)
        .eq("customer_phone_e164", body.customer_phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (order) {
        const updatedData = { ...order.data, address: entities.address };
        await supabase
          .from("orders")
          .update({ 
            data: updatedData,
            updated_at: new Date().toISOString(),
            notes: supabase.rpc('array_append', { arr: order.data?.notes || [], elem: `Address updated to: ${entities.address}` })
          })
          .eq("id", order.id);

        await supabase.from("messages_outbox").insert({
          tenant_id,
          conversation_id,
          message_text: `✅ Address updated for order ${order.system_order_id}. New address: ${entities.address}`,
          status: "queued",
        });
      }
    } else {
      // Respuesta genérica para otros casos
      const responses = {
        "greeting": "Hello! How can I help you with your order today?",
        "order_inquiry": "I can help you check your order status. Please share your order ID or I'll look it up by your phone number.",
        "payment_inquiry": "For payment questions, please contact our support team. Your order details will be preserved.",
        "ask_question": "I received your message. A team member will get back to you shortly. Is there anything urgent about your order I can help with right now?"
      };
      
      const responseText = responses[intent] || "Got it! A human will follow up shortly.";
      
      await supabase.from("messages_outbox").insert({
        tenant_id,
        conversation_id,
        message_text: responseText,
        status: "queued",
      });
    }

    // Log del evento de procesamiento de mensaje
    await supabase.from("events").insert({
      tenant_id,
      kind: "message_processed",
      payload: {
        conversation_id,
        message_text: body.message_text,
        intent,
        confidence,
        entities,
        customer_phone: body.customer_phone
      }
    });

    return new Response(JSON.stringify({ ok: true, conversation_id }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("sandbox_message error:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});