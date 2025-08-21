import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log(`cleanup_all_data function called with method: ${req.method}`)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Parse request body to get tenant_id
    const { tenant_id } = await req.json()

    if (!tenant_id) {
      console.error('Missing tenant_id in request body')
      return new Response(
        JSON.stringify({ error: 'tenant_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Starting complete cleanup for tenant: ${tenant_id}`)

    // Delete all messages (inbox and outbox) for this tenant
    console.log('Deleting messages_inbox...')
    const { error: inboxError } = await supabase
      .from('messages_inbox')
      .delete()
      .eq('tenant_id', tenant_id)
    
    if (inboxError) {
      console.error('Error deleting messages_inbox:', inboxError)
    }

    console.log('Deleting messages_outbox...')
    const { error: outboxError } = await supabase
      .from('messages_outbox')
      .delete()
      .eq('tenant_id', tenant_id)
    
    if (outboxError) {
      console.error('Error deleting messages_outbox:', outboxError)
    }

    // Delete all timers for this tenant
    console.log('Deleting timers...')
    const { error: timersError } = await supabase
      .from('timers')
      .delete()
      .eq('tenant_id', tenant_id)
    
    if (timersError) {
      console.error('Error deleting timers:', timersError)
    }

    // Delete all workflow_runs for this tenant
    console.log('Deleting workflow_runs...')
    const { error: workflowRunsError } = await supabase
      .from('workflow_runs')
      .delete()
      .eq('tenant_id', tenant_id)
    
    if (workflowRunsError) {
      console.error('Error deleting workflow_runs:', workflowRunsError)
    }

    // Delete all conversations for this tenant
    console.log('Deleting conversations...')
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('tenant_id', tenant_id)
    
    if (conversationsError) {
      console.error('Error deleting conversations:', conversationsError)
    }

    // Delete all events for this tenant
    console.log('Deleting events...')
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .eq('tenant_id', tenant_id)
    
    if (eventsError) {
      console.error('Error deleting events:', eventsError)
    }

    // Delete all orders for this tenant
    console.log('Deleting orders...')
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .eq('tenant_id', tenant_id)
    
    if (ordersError) {
      console.error('Error deleting orders:', ordersError)
    }

    console.log('Complete cleanup finished successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'All data cleaned up successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in cleanup_all_data function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})