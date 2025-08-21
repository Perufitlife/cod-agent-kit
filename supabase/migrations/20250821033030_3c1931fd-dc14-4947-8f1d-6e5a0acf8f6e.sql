-- Schema corrections for orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone_e164 TEXT;

-- Idempotency index for external orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uniq_orders_external_source'
  ) THEN
    CREATE UNIQUE INDEX uniq_orders_external_source 
    ON orders(tenant_id, external_order_id, source) 
    WHERE external_order_id IS NOT NULL AND source IS NOT NULL;
  END IF;
END $$;

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(tenant_id, customer_phone_e164);

-- Status constraint
ALTER TABLE orders
  ADD CONSTRAINT orders_status_chk
  CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled','awaiting_customer_contact')) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_status_chk;

-- RLS dev setup: allow SELECT but restrict mutations to edge functions
DROP POLICY IF EXISTS "Tenant isolation for orders" ON orders;
CREATE POLICY "orders_select_dev"
  ON orders FOR SELECT
  USING (true);  -- DEV ONLY

REVOKE INSERT, UPDATE, DELETE ON orders FROM anon, authenticated;

-- RPC function to atomically increment SIS counter
CREATE OR REPLACE FUNCTION increment_sis_counter(p_tenant_id UUID)
RETURNS INT LANGUAGE plpgsql AS $$
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
RETURNS VOID LANGUAGE sql AS $$ SELECT 1 $$;