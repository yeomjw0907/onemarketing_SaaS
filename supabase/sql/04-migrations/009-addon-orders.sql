-- ============================================================
-- Migration 009: addon_orders 테이블 (부가 서비스 주문)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.addon_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  addon_key TEXT NOT NULL,
  addon_label TEXT NOT NULL,
  price_won INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled')),
  memo TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addon_orders_client_id
  ON public.addon_orders(client_id);

CREATE INDEX IF NOT EXISTS idx_addon_orders_created_at
  ON public.addon_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_addon_orders_status
  ON public.addon_orders(status);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.addon_orders ENABLE ROW LEVEL SECURITY;

-- 클라이언트: 본인 client_id로 INSERT만 허용
DROP POLICY IF EXISTS "client_insert_own_addon_orders" ON public.addon_orders;
CREATE POLICY "client_insert_own_addon_orders"
  ON public.addon_orders
  FOR INSERT
  WITH CHECK (client_id = public.current_client_id());

-- 관리자: SELECT, UPDATE
DROP POLICY IF EXISTS "admin_all_addon_orders" ON public.addon_orders;
CREATE POLICY "admin_all_addon_orders"
  ON public.addon_orders
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- updated_at 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_addon_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS addon_orders_updated_at ON public.addon_orders;
CREATE TRIGGER addon_orders_updated_at
  BEFORE UPDATE ON public.addon_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_addon_orders_updated_at();

-- ============================================================
-- 스키마 캐시 갱신
-- ============================================================
NOTIFY pgrst, 'reload schema';
