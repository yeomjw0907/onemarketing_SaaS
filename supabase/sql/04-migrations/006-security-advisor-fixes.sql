-- ============================================================
-- Migration 006: Security Advisor 권장 사항 반영
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================
-- 1) Function Search Path Mutable
--    함수에 search_path를 고정해, 악의적 스키마가 끼어들지 못하게 합니다.
-- 2) RLS Policy Always True (notification_logs)
--    WITH CHECK (true) 정책 제거. 알림 로그 INSERT는 admin 또는 service_role로만 수행합니다.
-- ============================================================

-- ──────────────────────────────────────────
-- 1) 함수 search_path 고정
-- ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT client_id FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ──────────────────────────────────────────
-- 2) notification_logs 과도한 INSERT 정책 제거
-- ──────────────────────────────────────────
-- service_role 은 RLS를 우회하므로, 백엔드(API)에서 service_role 로 INSERT 하면
-- 이 정책 없이도 동작합니다. WITH CHECK (true) 는 누구나 INSERT 가능하게 하므로 제거합니다.

DROP POLICY IF EXISTS "service_insert_notification_logs" ON public.notification_logs;
