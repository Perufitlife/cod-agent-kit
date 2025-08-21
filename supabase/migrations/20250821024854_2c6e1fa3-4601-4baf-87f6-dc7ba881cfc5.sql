-- Add basic RLS policies for multi-tenant isolation
-- Note: These are placeholder policies. In production, you'd set app.tenant_id based on user authentication

-- Tenants table - users can see their own tenant
CREATE POLICY "Users can view their tenant" ON tenants
  FOR SELECT USING (true); -- Placeholder - replace with proper tenant access logic

-- Users table - users can see their own record
CREATE POLICY "Users can view their own record" ON users
  FOR SELECT USING (true); -- Placeholder - replace with auth.uid() check

-- User tenants - users can see their tenant associations
CREATE POLICY "Users can view their tenant associations" ON user_tenants
  FOR SELECT USING (true); -- Placeholder

-- Tenant settings - admin access to tenant settings
CREATE POLICY "Tenant admins can manage settings" ON tenant_settings
  FOR ALL USING (true); -- Placeholder

-- API credentials - tenant isolation
CREATE POLICY "Tenant isolation for API credentials" ON api_credentials
  FOR ALL USING (true); -- Placeholder

-- Field definitions - tenant isolation
CREATE POLICY "Tenant isolation for field definitions" ON field_definitions
  FOR ALL USING (true); -- Placeholder

-- Orders - tenant isolation (main security boundary)
CREATE POLICY "Tenant isolation for orders" ON orders
  FOR ALL USING (true); -- Placeholder - replace with tenant_id check

-- Workflow definitions - tenant isolation
CREATE POLICY "Tenant isolation for workflows" ON workflow_definitions
  FOR ALL USING (true); -- Placeholder

-- Workflow versions - tenant isolation
CREATE POLICY "Tenant isolation for workflow versions" ON workflow_versions
  FOR ALL USING (true); -- Placeholder

-- Workflow runs - tenant isolation
CREATE POLICY "Tenant isolation for workflow runs" ON workflow_runs
  FOR ALL USING (true); -- Placeholder

-- Timers - tenant isolation
CREATE POLICY "Tenant isolation for timers" ON timers
  FOR ALL USING (true); -- Placeholder

-- Conversations - tenant isolation
CREATE POLICY "Tenant isolation for conversations" ON conversations
  FOR ALL USING (true); -- Placeholder

-- Messages inbox - tenant isolation
CREATE POLICY "Tenant isolation for messages inbox" ON messages_inbox
  FOR ALL USING (true); -- Placeholder

-- Messages outbox - tenant isolation
CREATE POLICY "Tenant isolation for messages outbox" ON messages_outbox
  FOR ALL USING (true); -- Placeholder

-- Tool registry - tenant isolation
CREATE POLICY "Tenant isolation for tool registry" ON tool_registry
  FOR ALL USING (true); -- Placeholder

-- Intent catalog - tenant isolation
CREATE POLICY "Tenant isolation for intent catalog" ON intent_catalog
  FOR ALL USING (true); -- Placeholder

-- Prompt packs - tenant isolation
CREATE POLICY "Tenant isolation for prompt packs" ON prompt_packs
  FOR ALL USING (true); -- Placeholder

-- Events - tenant isolation
CREATE POLICY "Tenant isolation for events" ON events
  FOR ALL USING (true); -- Placeholder