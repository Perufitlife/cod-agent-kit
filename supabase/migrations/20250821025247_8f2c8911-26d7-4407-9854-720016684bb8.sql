-- Insert seed data for demo

-- Demo tenant and user
INSERT INTO tenants (id, name, subdomain) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Tenant', 'demo');

INSERT INTO users (id, email, role) 
VALUES ('00000000-0000-0000-0000-0000000000AA', 'admin@demo.com', 'admin');

INSERT INTO user_tenants (user_id, tenant_id, role) 
VALUES ('00000000-0000-0000-0000-0000000000AA', '00000000-0000-0000-0000-000000000001', 'admin');

INSERT INTO tenant_settings (tenant_id, ai_mode, sis_counter) 
VALUES ('00000000-0000-0000-0000-000000000001', 'permissive', 2003);

-- Field definitions (v1 schema)
INSERT INTO field_definitions (tenant_id, key, label, type, required, visible, display_order, version)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'name', 'Customer Name', 'text', true, true, 10, 1),
  ('00000000-0000-0000-0000-000000000001', 'document_number', 'Document Number', 'text', false, true, 20, 1),
  ('00000000-0000-0000-0000-000000000001', 'address', 'Delivery Address', 'text', true, true, 30, 1),
  ('00000000-0000-0000-0000-000000000001', 'reference', 'Address Reference', 'text', false, true, 40, 1),
  ('00000000-0000-0000-0000-000000000001', 'city', 'City', 'text', true, true, 50, 1),
  ('00000000-0000-0000-0000-000000000001', 'province', 'Province/State', 'text', true, true, 60, 1),
  ('00000000-0000-0000-0000-000000000001', 'country', 'Country', 'text', true, true, 70, 1),
  ('00000000-0000-0000-0000-000000000001', 'products', 'Products', 'array', true, true, 80, 1),
  ('00000000-0000-0000-0000-000000000001', 'delivery_date', 'Delivery Date', 'date', false, true, 90, 1);

-- Sample orders
INSERT INTO orders (tenant_id, system_order_id, external_order_id, status, schema_version, data, notes, needs_attention)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'SIS-2001', 'EXT-1001', 'pending', 1, 
   '{"name": "Maria Rodriguez", "address": "123 Main St, Apt 4B", "city": "Miami", "province": "FL", "country": "USA", "products": ["Wireless Headphones", "Phone Case"], "delivery_date": "2024-01-22"}',
   ARRAY['Order created via API'], false),
  
  ('00000000-0000-0000-0000-000000000001', 'SIS-2002', 'EXT-1002', 'confirmed', 1,
   '{"name": "John Smith", "address": "456 Oak Ave", "city": "Orlando", "province": "FL", "country": "USA", "products": ["Bluetooth Speaker", "Charging Cable"], "delivery_date": "2024-01-23"}',
   ARRAY['Order created via API', 'Confirmed by customer via WhatsApp'], false),
   
  ('00000000-0000-0000-0000-000000000001', 'SIS-2003', NULL, 'awaiting_customer_contact', 1,
   '{"name": "Ana García", "address": "789 Pine St", "city": "Tampa", "province": "FL", "country": "USA", "products": ["Smart Watch", "Screen Protector"], "delivery_date": "2024-01-24"}',
   ARRAY['Order created via API', 'No customer response after 1 minute'], true);

-- Create a demo workflow definition
INSERT INTO workflow_definitions (id, tenant_id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-111111111111', '00000000-0000-0000-0000-000000000001', 
        'Await Customer Confirmation', 
        'Standard COD order confirmation workflow with AI agent', 
        true);

-- Create workflow version with the DSL
INSERT INTO workflow_versions (id, workflow_id, version, definition, is_published)
VALUES ('00000000-0000-0000-0000-222222222222', '00000000-0000-0000-0000-111111111111', 1, 
        '{"states": [{"id": "start", "type": "trigger", "actions": [{"tool": "schedule_timer", "args": {"minutes_from_now": 1, "purpose": "customer_confirmation_timeout"}}], "transitions": [{"on": "timer_fired", "to": "no_message_path"}, {"on": "inbound_message", "to": "process_message"}]}, {"id": "process_message", "type": "action", "actions": [{"tool": "cancel_timer", "args": {"timer_id": "{{timer_id}}"}}, {"tool": "classify_intent", "args": {"message_text": "{{inbound.text}}"}}], "transitions": [{"on": "intent.confirm", "to": "confirm_order"}, {"on": "else", "to": "handoff"}]}, {"id": "confirm_order", "type": "action", "actions": [{"tool": "set_status", "args": {"order_id": "{{order_id}}", "status": "confirmed"}}], "transitions": [{"on": "next", "to": "end"}]}, {"id": "end", "type": "end"}]}', 
        true);

-- Sample conversations
INSERT INTO conversations (id, tenant_id, customer_phone, status) 
VALUES 
  ('00000000-0000-0000-0000-333333333333', '00000000-0000-0000-0000-000000000001', '+1234567890', 'active'),
  ('00000000-0000-0000-0000-444444444444', '00000000-0000-0000-0000-000000000001', '+1234567891', 'closed');

-- Sample messages
INSERT INTO messages_inbox (tenant_id, conversation_id, message_text, customer_phone)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-333333333333', 
   'Hi, I want to confirm my order SIS-2001', '+1234567890'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-333333333333', 
   'Yes, confirm the order please', '+1234567890');

INSERT INTO messages_outbox (tenant_id, conversation_id, message_text, status, sent_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-333333333333', 
   'Hello Maria! I found your order SIS-2001 for delivery to 123 Main St. Reply YES to confirm.', 
   'sent', NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-333333333333', 
   'Perfect! Your order SIS-2001 has been confirmed. Thank you!', 
   'sent', NOW());

-- Intent catalog
INSERT INTO intent_catalog (tenant_id, version, intents)
VALUES ('00000000-0000-0000-0000-000000000001', 1, 
        '{"intents": [{"name": "confirm", "description": "Customer confirms order", "examples": ["confirm my order", "yes go ahead", "looks good"]}, {"name": "update_address", "description": "Customer provides new address", "examples": ["new address is...", "deliver to..."], "required_slots": ["address"]}, {"name": "reschedule_delivery", "description": "Customer requests new delivery date", "examples": ["deliver tomorrow", "deliver on Jan 25"], "required_slots": ["date"]}, {"name": "cancel_order", "description": "Customer wants to cancel", "examples": ["cancel my order", "dont ship"]}, {"name": "ask_question", "description": "General question about order", "examples": ["when will it arrive?", "how do I pay?"]}]}');

-- Events for observability
INSERT INTO events (tenant_id, kind, payload)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'order_created', 
   '{"order_id": "SIS-2001", "customer_phone": "+1234567890", "source": "api"}'),
  ('00000000-0000-0000-0000-000000000001', 'workflow_started', 
   '{"workflow_name": "Await Customer Confirmation", "order_id": "SIS-2001"}'),
  ('00000000-0000-0000-0000-000000000001', 'message_received', 
   '{"customer_phone": "+1234567890", "message_text": "Hi, I want to confirm my order SIS-2001"}'),
  ('00000000-0000-0000-0000-000000000001', 'order_confirmed', 
   '{"order_id": "SIS-2001", "confirmed_via": "whatsapp"}')