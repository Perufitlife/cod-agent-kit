-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create workflow_actions table for storing individual workflow steps
CREATE TABLE IF NOT EXISTS workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  workflow_version_id UUID NOT NULL,
  sequence_order INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'wait', 'send_message', 'update_order', 'create_timer'
  config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for workflow_actions
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for workflow actions" ON workflow_actions FOR ALL USING (true);

-- Add indexes for performance
CREATE INDEX idx_workflow_actions_version ON workflow_actions(workflow_version_id, sequence_order);

-- Create workflow_triggers table for event-based triggers
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  trigger_type TEXT NOT NULL, -- 'order_created', 'message_received', 'timer_fired'
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for workflow_triggers
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for workflow triggers" ON workflow_triggers FOR ALL USING (true);

-- Create cron job for processing scheduled timers
SELECT cron.schedule(
  'process-scheduled-timers',
  '* * * * *', -- every minute
  $$
  SELECT net.http_post(
    url := 'https://ghsxvotykfhnfqyymdvh.supabase.co/functions/v1/process_timers',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoc3h2b3R5a2ZobmZxeXltZHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzY1MjgsImV4cCI6MjA3MTMxMjUyOH0.NcFJ51O2Sssw-Y3aX1OKk9oWV7aVN69qUVLlAClaB-Q"}'::jsonb
  ) as request_id;
  $$
);