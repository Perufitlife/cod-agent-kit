-- Fix the user-tenant association by creating the user record first
INSERT INTO users (id, email, role)
SELECT id, email, role 
FROM profiles 
WHERE email = 'renzom13@hotmail.com'
  AND NOT EXISTS (SELECT 1 FROM users WHERE id = profiles.id);

-- Now associate with the tenant
INSERT INTO user_tenants (user_id, tenant_id, role)
SELECT 
  u.id as user_id,
  t.id as tenant_id,
  'admin' as role
FROM users u
CROSS JOIN tenants t
WHERE u.email = 'renzom13@hotmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_tenants ut 
    WHERE ut.user_id = u.id AND ut.tenant_id = t.id
  );