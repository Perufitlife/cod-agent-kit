-- Associate the existing user with the demo tenant
-- First, let's check what we have
INSERT INTO user_tenants (user_id, tenant_id, role)
SELECT 
  p.id as user_id,
  t.id as tenant_id,
  'admin' as role
FROM profiles p
CROSS JOIN tenants t
WHERE p.email = 'renzom13@hotmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_tenants ut 
    WHERE ut.user_id = p.id AND ut.tenant_id = t.id
  );