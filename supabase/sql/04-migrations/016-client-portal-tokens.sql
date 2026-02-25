-- ============================================================
-- Migration 016: 알림톡 매직링크용 포털 토큰 테이블
-- welcome, action_status, event_reminder, addon_order_client 등
-- 고객용 링크를 토큰 URL로 발급·만료 관리
-- ============================================================

CREATE TABLE IF NOT EXISTS public.client_portal_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token      text NOT NULL,
  client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  path       text NOT NULL CHECK (path IN ('overview', 'execution', 'timeline')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_portal_tokens_token_unique
  ON public.client_portal_tokens (token);

CREATE INDEX IF NOT EXISTS client_portal_tokens_expires_at
  ON public.client_portal_tokens (expires_at);

COMMENT ON TABLE public.client_portal_tokens IS '알림톡 매직링크용 단회성 포털 토큰. /portal/v/{token} 접근 시 path에 따라 리다이렉트.';
