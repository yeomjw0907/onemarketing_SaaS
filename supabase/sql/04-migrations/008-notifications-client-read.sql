-- ============================================================
-- Migration 008: 클라이언트 본인 알림 히스토리 조회 허용
-- ============================================================

DROP POLICY IF EXISTS "client_select_own_notifications" ON public.notifications;
CREATE POLICY "client_select_own_notifications"
  ON public.notifications
  FOR SELECT
  USING (client_id = public.current_client_id());

NOTIFY pgrst, 'reload schema';
