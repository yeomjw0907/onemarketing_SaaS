-- ============================================================
-- Migration 010: 관리자 연동 기본 설정 (한 번만 세팅하는 키값)
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_settings IS '관리자(원케이션) 1세트 연동 키. META_APP_ID, GOOGLE_CLIENT_ID 등. RLS로 admin만 접근';

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- admin만 조회/수정 가능 (service role은 RLS 무시하므로 API에서 service client로 읽기 가능)
DROP POLICY IF EXISTS "admin_only_select_admin_settings" ON public.admin_settings;
CREATE POLICY "admin_only_select_admin_settings" ON public.admin_settings
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin_only_insert_admin_settings" ON public.admin_settings;
CREATE POLICY "admin_only_insert_admin_settings" ON public.admin_settings
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_only_update_admin_settings" ON public.admin_settings;
CREATE POLICY "admin_only_update_admin_settings" ON public.admin_settings
  FOR UPDATE USING (public.is_admin());
