-- 포털에서 클라이언트가 본인 일정만 수정 가능 (드래그 이동 등)
CREATE POLICY "Client can update own calendar_events"
  ON public.calendar_events
  FOR UPDATE
  USING (client_id = public.current_client_id())
  WITH CHECK (client_id = public.current_client_id());
