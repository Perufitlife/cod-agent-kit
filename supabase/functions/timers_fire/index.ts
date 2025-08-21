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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timer_id } = await req.json();
    const tenant_id = "00000000-0000-0000-0000-000000000001";

    const { data: t, error: tErr } = await supabase
      .from("timers")
      .select("id, workflow_run_id")
      .eq("id", timer_id)
      .eq("tenant_id", tenant_id)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!t) return new Response(JSON.stringify({ ok: true }));

    // marcar timer
    await supabase.from("timers").update({ status: "fired", fired_at: new Date().toISOString() }).eq("id", timer_id);

    // obtener run + order
    const { data: run } = await supabase
      .from("workflow_runs")
      .select("id, order_id")
      .eq("id", t.workflow_run_id)
      .maybeSingle();

    if (run?.order_id) {
      await supabase.from("orders").update({ status: "awaiting_customer_contact" }).eq("id", run.order_id);
    }

    return new Response(JSON.stringify({ ok: true }), { 
      headers: { ...corsHeaders, "content-type": "application/json" } 
    });
  } catch (e) {
    console.error("timers_fire error:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: errorMessage }), { 
      status: 500, 
      headers: { ...corsHeaders, "content-type": "application/json" } 
    });
  }
});