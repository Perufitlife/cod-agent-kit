-- Clean up test data and fix RLS policies properly

-- Delete test data first
DELETE FROM workflow_runs WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM conversations WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM messages_inbox WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM messages_outbox WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM orders WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM events WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Drop ALL existing policies on orders
DROP POLICY IF EXISTS "orders_select_dev" ON orders;
DROP POLICY IF EXISTS "Users can view orders from their tenant" ON orders;
DROP POLICY IF EXISTS "Users can create orders for their tenant" ON orders;
DROP POLICY IF EXISTS "Users can update orders from their tenant" ON orders;

-- Create proper RLS policies for orders with tenant isolation
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