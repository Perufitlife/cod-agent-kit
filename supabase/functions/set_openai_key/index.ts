// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const url = Deno.env.get("SUPABASE_URL")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(url, service);

Deno.serve(async (req) => {
  try {
    const { apiKey } = await req.json();
    const tenant_id = "00000000-0000-0000-0000-000000000001";
    const masked = apiKey.replace(/.(?=.{4})/g, "*");

    // almacén simple: tenant_settings.openai_api_key_encrypted
    const { error } = await supabase
      .from("tenant_settings")
      .update({ openai_api_key_encrypted: apiKey, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenant_id);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, masked }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
});