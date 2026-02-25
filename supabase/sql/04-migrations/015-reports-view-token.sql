-- ============================================================
-- Migration 015: reports 테이블에 매직링크용 view_token 추가
-- 보고서 발행 알림톡에서 로그인 없이 보고서를 열 수 있도록
-- view_token(hex 64자) + 만료 시각을 저장한다.
-- ============================================================

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS view_token       text,
  ADD COLUMN IF NOT EXISTS view_token_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS reports_view_token_unique
  ON public.reports (view_token)
  WHERE view_token IS NOT NULL;
