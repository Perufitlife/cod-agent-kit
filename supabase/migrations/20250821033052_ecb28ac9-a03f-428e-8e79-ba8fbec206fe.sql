-- Fix search path security warnings for functions created in previous migration
CREATE OR REPLACE FUNCTION increment_sis_counter(p_tenant_id UUID)
RETURNS INT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v INT;
BEGIN
  UPDATE tenant_settings
     SET sis_counter = COALESCE(sis_counter, 0) + 1,
         updated_at = NOW()
   WHERE tenant_id = p_tenant_id
   RETURNING sis_counter INTO v;
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION ensure_increment_function() 
RETURNS VOID 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
AS $$ SELECT 1 $$;