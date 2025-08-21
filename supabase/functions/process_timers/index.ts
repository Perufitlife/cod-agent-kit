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
    console.log("Processing scheduled timers...");
    
    // Get all overdue timers
    const { data: overdueTimers, error: timersError } = await supabase
      .from("timers")
      .select("id, workflow_run_id, purpose, fire_at")
      .eq("status", "scheduled")
      .lte("fire_at", new Date().toISOString());

    if (timersError) {
      console.error("Error fetching overdue timers:", timersError);
      throw timersError;
    }

    console.log(`Found ${overdueTimers?.length || 0} overdue timers`);

    let processedCount = 0;
    
    for (const timer of overdueTimers || []) {
      try {
        console.log(`Processing timer ${timer.id}, purpose: ${timer.purpose}`);

        // Mark timer as fired
        await supabase
          .from("timers")
          .update({ 
            status: "fired", 
            fired_at: new Date().toISOString() 
          })
          .eq("id", timer.id);

        // Get the workflow run
        const { data: workflowRun } = await supabase
          .from("workflow_runs")
          .select("id, order_id, current_state, workflow_version_id")
          .eq("id", timer.workflow_run_id)
          .single();

        if (workflowRun) {
          // Process based on timer purpose
          if (timer.purpose === "await_confirmation") {
            // Update order status to awaiting customer contact
            if (workflowRun.order_id) {
              await supabase
                .from("orders")
                .update({ 
                  status: "awaiting_customer_contact",
                  needs_attention: true 
                })
                .eq("id", workflowRun.order_id);

              console.log(`Updated order ${workflowRun.order_id} to awaiting_customer_contact`);
            }

            // Update workflow run state
            await supabase
              .from("workflow_runs")
              .update({ 
                current_state: "customer_contact_required",
                status: "paused"
              })
              .eq("id", timer.workflow_run_id);

          } else if (timer.purpose === "follow_up") {
            // Create follow-up message or action
            console.log(`Processing follow-up timer for run ${timer.workflow_run_id}`);
            
            // Update workflow run to next state
            await supabase
              .from("workflow_runs")
              .update({ 
                current_state: "follow_up_sent",
                status: "running"
              })
              .eq("id", timer.workflow_run_id);
          }
        }

        processedCount++;

      } catch (error) {
        console.error(`Error processing timer ${timer.id}:`, error);
        // Continue processing other timers even if one fails
      }
    }

    // Log event for analytics
    await supabase.from("events").insert({
      tenant_id: "00000000-0000-0000-0000-000000000001",
      kind: "timers_processed",
      payload: {
        processed_count: processedCount,
        total_found: overdueTimers?.length || 0,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Successfully processed ${processedCount} timers`);

    return new Response(JSON.stringify({ 
      ok: true, 
      processed: processedCount,
      found: overdueTimers?.length || 0
    }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });

  } catch (e) {
    console.error("process_timers error:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});