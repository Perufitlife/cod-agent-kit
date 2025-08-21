-- Fix security warnings from linter

-- Fix 1 & 2: Function Search Path Mutable - Set search_path for functions that don't have it
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = now() 
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_daily_stats()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_stats;
$$;

-- Fix 3: Remove materialized view from public API access
-- Revoke access from public APIs
REVOKE ALL ON public.daily_stats FROM anon;
REVOKE ALL ON public.daily_stats FROM authenticated;

-- Create a function to access analytics data safely instead
CREATE OR REPLACE FUNCTION public.get_daily_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  tenant_id UUID,
  total_orders BIGINT,
  confirmed_orders BIGINT,
  pending_orders BIGINT,
  cancelled_orders BIGINT,
  total_revenue NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(o.created_at) as date,
    o.tenant_id,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE o.status = 'confirmed') as confirmed_orders,
    COUNT(*) FILTER (WHERE o.status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE o.status = 'cancelled') as cancelled_orders,
    COALESCE(SUM((o.data->>'total')::NUMERIC), 0) as total_revenue
  FROM public.orders o
  WHERE DATE(o.created_at) BETWEEN start_date AND end_date
    AND o.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  GROUP BY DATE(o.created_at), o.tenant_id
  ORDER BY DATE(o.created_at) DESC;
$$;

-- Grant access to the function instead of the materialized view
GRANT EXECUTE ON FUNCTION public.get_daily_analytics TO authenticated;

-- Create a security definer function to avoid recursive RLS issues in policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE sql
SECURITY DEFINER 
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Update policies to use the security definer function to avoid recursion
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Admins can manage permissions" 
ON public.permissions 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'super_admin'));

-- Create additional security functions for better role management
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS TABLE (permission_name TEXT, resource TEXT, action TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.name as permission_name, p.resource, p.action
  FROM public.permissions p
  JOIN public.role_permissions rp ON rp.permission_id = p.id
  JOIN public.profiles pr ON pr.role = rp.role
  WHERE pr.id = user_uuid;
$$;

-- Grant appropriate permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission TO authenticated;