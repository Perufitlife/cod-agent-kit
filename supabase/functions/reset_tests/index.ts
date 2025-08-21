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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resetType } = await req.json();
    const tenant_id = "00000000-0000-0000-0000-000000000001";

    let results = {};

    if (resetType === 'all' || resetType === 'messages') {
      // Delete test conversations and messages
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', tenant_id)
        .like('customer_phone', '%1234567890%');

      if (conversations) {
        const conversationIds = conversations.map(c => c.id);
        
        // Delete messages
        await supabase
          .from('messages_inbox')
          .delete()
          .in('conversation_id', conversationIds);
          
        await supabase
          .from('messages_outbox')
          .delete()
          .in('conversation_id', conversationIds);
          
        // Delete conversations
        await supabase
          .from('conversations')
          .delete()
          .in('id', conversationIds);
      }
      
      results.messages = 'cleared';
    }

    if (resetType === 'all' || resetType === 'orders') {
      // Delete ALL test orders (including manual ones for testing)
      const { error: ordersError, count } = await supabase
        .from('orders')
        .delete({ count: 'exact' })
        .eq('tenant_id', tenant_id)
        .or('source.eq.demo_test,source.eq.manual,customer_phone_e164.eq.+1234567890');
        
      if (ordersError) throw ordersError;
      results.orders = `cleared ${count || 0} orders`;
    }

    if (resetType === 'all' || resetType === 'events') {
      // Delete test events (keep recent ones for monitoring)
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { error: eventsError } = await supabase
        .from('events')
        .delete()
        .eq('tenant_id', tenant_id)
        .lt('created_at', cutoffDate);
        
      if (eventsError) throw eventsError;
      results.events = 'cleared';
    }

    if (resetType === 'all' || resetType === 'timers') {
      // Delete test timers
      const { error: timersError } = await supabase
        .from('timers')
        .delete()
        .eq('tenant_id', tenant_id)
        .eq('status', 'scheduled');
        
      if (timersError) throw timersError;
      results.timers = 'cleared';
    }

    console.log(`🧹 Reset completed for ${resetType}:`, results);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      message: `Successfully reset ${resetType} test data` 
    }), { 
      headers: { ...corsHeaders, "content-type": "application/json" } 
    });

  } catch (e) {
    console.error("reset_tests error:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "content-type": "application/json" } 
    });
  }
});
