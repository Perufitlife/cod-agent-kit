-- Clean up test data and fix RLS policies

-- Delete test data
DELETE FROM workflow_runs WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM conversations WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM messages_inbox WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM messages_outbox WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM orders WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM events WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Fix RLS policies for proper tenant isolation
DROP POLICY IF EXISTS "orders_select_dev" ON orders;

-- Create proper RLS policies for orders
CREATE POLICY "Users can view orders from their tenant" 
ON orders FOR SELECT 
USING (
  tenant_id IN (
    SELECT ut.tenant_id 
    FROM user_tenants ut 
    WHERE ut.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create orders for their tenant" 
ON orders FOR INSERT 
WITH CHECK (
  tenant_id IN (
    SELECT ut.tenant_id 
    FROM user_tenants ut 
    WHERE ut.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update orders from their tenant" 
ON orders FOR UPDATE 
USING (
  tenant_id IN (
    SELECT ut.tenant_id 
    FROM user_tenants ut 
    WHERE ut.user_id = auth.uid()
  )
);

-- Fix other tables that have overly permissive policies
DROP POLICY IF EXISTS "Tenant isolation for conversations" ON conversations;
CREATE POLICY "Users can access conversations from their tenant" 
ON conversations FOR ALL 
USING (
  tenant_id IN (
    SELECT ut.tenant_id 
    FROM user_tenants ut 
    WHERE ut.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tenant isolation for messages inbox" ON messages_inbox;
CREATE POLICY "Users can access inbox messages from their tenant" 
ON messages_inbox FOR ALL 
USING (
  tenant_id IN (
    SELECT ut.tenant_id 
    FROM user_tenants ut 
    WHERE ut.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tenant isolation for messages outbox" ON messages_outbox;  
CREATE POLICY "Users can access outbox messages from their tenant" 
ON messages_outbox FOR ALL 
USING (
  tenant_id IN (
    SELECT ut.tenant_id 
    FROM user_tenants ut 
    WHERE ut.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tenant isolation for events" ON events;
CREATE POLICY "Users can access events from their tenant" 
ON events FOR ALL 
USING (
  tenant_id IN (
    SELECT ut.tenant_id 
    FROM user_tenants ut 
    WHERE ut.user_id = auth.uid()
  )
);