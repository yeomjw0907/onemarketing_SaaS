-- ============================================================
-- Migration 001: 통합 마이그레이션 (멱등성 보장 — 여러 번 실행 가능)
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────
-- 1) clients 테이블 - 담당자 정보 + 서비스 항목
-- ──────────────────────────────────────────
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS enabled_services JSONB NOT NULL DEFAULT '{}';

-- ──────────────────────────────────────────
-- 2) profiles 테이블 - 비밀번호 변경 플래그
-- ──────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- ──────────────────────────────────────────
-- 3) data_integrations 테이블
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.data_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  display_name TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'inactive',
  last_synced_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_integrations ENABLE ROW LEVEL SECURITY;

-- 기존 policy 제거 후 재생성 (멱등성)
DROP POLICY IF EXISTS "admin_all_integrations" ON public.data_integrations;
CREATE POLICY "admin_all_integrations" ON public.data_integrations
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "client_read_own_integrations" ON public.data_integrations;
CREATE POLICY "client_read_own_integrations" ON public.data_integrations
  FOR SELECT USING (client_id = public.current_client_id());

-- updated_at 트리거
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_data_integrations_updated_at ON public.data_integrations;
CREATE TRIGGER trg_data_integrations_updated_at
  BEFORE UPDATE ON public.data_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ──────────────────────────────────────────
-- 4) integration_sync_logs 테이블
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.data_integrations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'running',
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_sync_logs" ON public.integration_sync_logs;
CREATE POLICY "admin_all_sync_logs" ON public.integration_sync_logs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "client_read_own_sync_logs" ON public.integration_sync_logs;
CREATE POLICY "client_read_own_sync_logs" ON public.integration_sync_logs
  FOR SELECT USING (client_id = public.current_client_id());

-- ──────────────────────────────────────────
-- 5) platform_metrics 테이블
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.data_integrations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metric_date DATE NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  dimensions JSONB DEFAULT '{}',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_client_date
  ON public.platform_metrics(client_id, platform, metric_date);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_key
  ON public.platform_metrics(client_id, metric_key, metric_date);

ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_platform_metrics" ON public.platform_metrics;
CREATE POLICY "admin_all_platform_metrics" ON public.platform_metrics
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "client_read_own_platform_metrics" ON public.platform_metrics;
CREATE POLICY "client_read_own_platform_metrics" ON public.platform_metrics
  FOR SELECT USING (client_id = public.current_client_id());
