-- ============================================================
-- 알림 발송 로그 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,         -- alimtalk_report_published, alimtalk_action_status 등
  recipient_phone TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  message_id TEXT,
  error_message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_client
  ON public.notification_logs(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created
  ON public.notification_logs(created_at DESC);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_notification_logs" ON public.notification_logs;
CREATE POLICY "admin_all_notification_logs"
  ON public.notification_logs
  FOR ALL
  USING (public.is_admin());

-- 서비스 역할(service_role)에서도 접근 가능하도록 (API 발송용)
DROP POLICY IF EXISTS "service_insert_notification_logs" ON public.notification_logs;
CREATE POLICY "service_insert_notification_logs"
  ON public.notification_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 참고: 스키마 캐시 갱신
-- ============================================================
NOTIFY pgrst, 'reload schema';
