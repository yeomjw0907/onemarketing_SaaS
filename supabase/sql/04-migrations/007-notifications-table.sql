-- ============================================================
-- Migration 007: notifications 테이블 (알림톡 발송 건 + 토큰)
-- 월/수/목 알림톡 한 건마다 한 행. 보기/승인용 토큰 보관.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('MON_REVIEW', 'WED_BUDGET', 'THU_PROPOSAL')),
  metrics_snapshot JSONB NOT NULL DEFAULT '{}',
  ai_message TEXT,
  view_token TEXT NOT NULL UNIQUE,
  view_token_expires_at TIMESTAMPTZ NOT NULL,
  approval_token TEXT UNIQUE,
  approval_token_expires_at TIMESTAMPTZ,
  approval_used_at TIMESTAMPTZ,
  approval_status TEXT CHECK (approval_status IS NULL OR approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_view_token
  ON public.notifications(view_token);

CREATE INDEX IF NOT EXISTS idx_notifications_approval_token
  ON public.notifications(approval_token)
  WHERE approval_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_client_sent
  ON public.notifications(client_id, sent_at DESC);

-- ============================================================
-- RLS (admin만 접근; 토큰 조회는 서버 service role로 수행)
-- ============================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_notifications" ON public.notifications;
CREATE POLICY "admin_all_notifications"
  ON public.notifications
  FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 스키마 캐시 갱신
-- ============================================================
NOTIFY pgrst, 'reload schema';
