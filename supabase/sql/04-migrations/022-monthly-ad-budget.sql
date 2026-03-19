-- 022: 클라이언트 월 광고 예산 컬럼 추가
-- { "meta_ads": 500000, "naver_ads": 300000, "google_ads": 200000 }
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS monthly_ad_budget JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.clients.monthly_ad_budget IS
  '플랫폼별 월 광고 예산 (원). 예: {"meta_ads": 500000, "naver_ads": 300000}';
