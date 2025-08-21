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

    // 3) determinar intención usando agent_intent función
    let intent = "ask_question";
    try {
      const intentRes = await supabase.functions.invoke("agent_intent", {
        body: { message_text: body.message_text, tenant_id }
      });
      
      if (intentRes.data?.intent) {
        intent = intentRes.data.intent;
        console.log("Intent classified as:", intent, "confidence:", intentRes.data.confidence);
      } else {
        console.warn("agent_intent failed, using fallback classification");
        // Fallback to simple classification
        intent = body.message_text.toLowerCase().includes("confirm") ||
            body.message_text.toLowerCase().includes("yes")
          ? "confirm"
          : "ask_question";
      }
    } catch (intentError) {
      console.error("Error calling agent_intent:", intentError);
      // Fallback to simple classification
      intent = body.message_text.toLowerCase().includes("confirm") ||
          body.message_text.toLowerCase().includes("yes")
        ? "confirm"
        : "ask_question";
    }

    // 4) si confirm -> buscar la última orden del teléfono y confirmar
    if (intent === "confirm") {
      const { data: order } = await supabase
        .from("orders")
        .select("id, system_order_id")
        .eq("tenant_id", tenant_id)
        .eq("customer_phone_e164", body.customer_phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (order) {
        await supabase.from("orders").update({ status: "confirmed" }).eq("id", order.id);

        await supabase.from("messages_outbox").insert({
          tenant_id,
          conversation_id,
          message_text: `Great! Order ${order.system_order_id} is confirmed.`,
          status: "queued",
        });
      } else {
        await supabase.from("messages_outbox").insert({
          tenant_id,
          conversation_id,
          message_text: "Thanks! I couldn't find a matching order for this phone. Send your order id (e.g., SIS-1234).",
          status: "queued",
        });
      }
    } else {
      await supabase.from("messages_outbox").insert({
        tenant_id,
        conversation_id,
        message_text: "Got it! A human will follow up shortly.",
        status: "queued",
      });
    }

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