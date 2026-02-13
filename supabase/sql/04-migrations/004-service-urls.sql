-- 서비스별 바로가기 URL 저장 (관리자가 클라이언트별로 채널 링크 입력)
-- Supabase SQL Editor에서 실행 후: NOTIFY pgrst, 'reload schema';

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS service_urls JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.clients.service_urls IS '서비스 키별 바로가기 URL. 예: {"meta_ads":"https://...","google_analytics":"https://..."}';
