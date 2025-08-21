// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(url, service);

type CreateOrderBody = {
  data: any;                 // {name,address,city,province,country,products:[{product_name,quantity,unit_price}], customer_phone?}
  source?: "manual" | "webhook";
  external_order_id?: string | null;
};

Deno.serve(async (req) => {
  try {
    const body = (await req.json()) as CreateOrderBody;
    const tenant_id = "00000000-0000-0000-0000-000000000001"; // DEV: fijo. Luego lo sacas del JWT/host.

    // 1) leer schema_version (máximo version en field_definitions)
    const { data: fd, error: fdErr } = await supabase
      .from("field_definitions")
      .select("version")
      .eq("tenant_id", tenant_id);
    if (fdErr) throw fdErr;
    const schema_version =
      (fd?.length ? Math.max(...fd.map((r: any) => r.version)) : 1) || 1;

    // 2) atomizar SIS counter
    const { data: nextCounter, error: ctrErr } = await supabase.rpc(
      "increment_sis_counter",
      { p_tenant_id: tenant_id },
    );
    if (ctrErr) throw ctrErr;
    const system_order_id = `SIS-${nextCounter}`;

    // 3) preparar payload
    const customer_phone_e164 = body?.data?.customer_phone ?? null;

    // 4) insertar orden
    const { data: order, error: insErr } = await supabase
      .from("orders")
      .insert({
        tenant_id,
        system_order_id,
        external_order_id: body.external_order_id ?? null,
        source: body.source ?? "manual",
        status: "pending",
        schema_version,
        customer_phone_e164,
        data: body.data ?? {},
      })
      .select("*")
      .single();
    if (insErr) throw insErr;

    // 5) vincular workflow publicado
    const { data: wv, error: wErr } = await supabase
      .from("workflow_versions")
      .select("id, workflow_id")
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();
    if (wErr) throw wErr;
    if (wv) {
      const { data: run, error: runErr } = await supabase
        .from("workflow_runs")
        .insert({
          tenant_id,
          workflow_version_id: wv.id,
          order_id: order.id,
          current_state: "await_message",
          status: "running",
          context: {},
        })
        .select("*")
        .single();
      if (runErr) throw runErr;

      // 6) crear timer +1 minuto
      const fire_at = new Date(Date.now() + 60_000).toISOString();
      const { error: tErr } = await supabase.from("timers").insert({
        tenant_id,
        workflow_run_id: run.id,
        fire_at,
        purpose: "await_confirmation",
        status: "scheduled",
      });
      if (tErr) throw tErr;
    }

    return new Response(JSON.stringify({ ok: true, order }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});