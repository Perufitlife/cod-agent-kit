-- Create initial workflow for order confirmation
INSERT INTO public.workflow_definitions (
  id,
  tenant_id,
  name,
  description,
  is_active,
  trigger_conditions
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Order Confirmation Workflow',
  'Manages order confirmation process with customer communication and timeouts',
  true,
  '{"triggers": ["order_created"], "conditions": {"status": "pending"}}'::jsonb
) ON CONFLICT DO NOTHING;

-- Create workflow version with the confirmation flow
WITH workflow_def AS (
  SELECT id FROM public.workflow_definitions 
  WHERE name = 'Order Confirmation Workflow' 
  AND tenant_id = '00000000-0000-0000-0000-000000000001'
  LIMIT 1
)
INSERT INTO public.workflow_versions (
  id,
  workflow_id,
  version,
  is_published,
  definition
) 
SELECT 
  gen_random_uuid(),
  workflow_def.id,
  1,
  true,
  '{
    "states": {
      "start": {
        "type": "action",
        "action": "schedule_timer",
        "config": {"delay_minutes": 1, "purpose": "await_customer_confirmation"},
        "next": "awaiting_confirmation"
      },
      "awaiting_confirmation": {
        "type": "wait",
        "triggers": ["customer_message", "timer_expired"],
        "transitions": {
          "confirm": "confirmed",
          "timeout": "needs_attention"
        }
      },
      "confirmed": {
        "type": "action",
        "action": "update_order_status",
        "config": {"status": "confirmed"},
        "next": "completed"
      },
      "needs_attention": {
        "type": "action", 
        "action": "flag_for_attention",
        "config": {"reason": "customer_timeout"},
        "next": "completed"
      },
      "completed": {
        "type": "end"
      }
    }
  }'::jsonb
FROM workflow_def
ON CONFLICT DO NOTHING;

-- Create basic intent catalog for AI
INSERT INTO public.intent_catalog (
  id,
  tenant_id,
  version,
  intents
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  1,
  '{
    "intents": [
      {
        "name": "confirm",
        "description": "Customer confirms or accepts an order",
        "examples": ["yes", "confirm", "ok", "confirmed", "I confirm", "please proceed"],
        "entities": ["order_id"]
      },
      {
        "name": "cancel", 
        "description": "Customer wants to cancel an order",
        "examples": ["cancel", "cancel order", "I want to cancel", "please cancel"],
        "entities": ["order_id", "reason"]
      },
      {
        "name": "update_address",
        "description": "Customer wants to change delivery address", 
        "examples": ["change address", "update address", "new address is"],
        "entities": ["address", "order_id"]
      },
      {
        "name": "reschedule",
        "description": "Customer wants to change delivery date/time",
        "examples": ["reschedule", "change date", "different time"],
        "entities": ["date", "time", "order_id"]
      },
      {
        "name": "order_inquiry",
        "description": "Customer asks about order status",
        "examples": ["order status", "where is my order", "when will it arrive"],
        "entities": ["order_id"]
      },
      {
        "name": "greeting",
        "description": "Simple greetings",
        "examples": ["hello", "hi", "good morning", "hey"],
        "entities": []
      }
    ]
  }'::jsonb
) ON CONFLICT DO NOTHING;