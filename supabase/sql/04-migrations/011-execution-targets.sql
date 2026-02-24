-- 실행 현황 카테고리별 목표 (진척도용)
-- clients.execution_targets: { "category_key": { "period": "monthly"|"weekly", "target": number } }
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS execution_targets JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.clients.execution_targets IS '카테고리(서비스 키)별 기간당 목표 건수. 예: {"landing_page":{"period":"monthly","target":25}}';
