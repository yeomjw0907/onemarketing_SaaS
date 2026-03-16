-- Migration 020: kpi_definitions computation 컬럼 추가
-- 플랫폼 연동 데이터를 KPI로 자동 집계하기 위한 computation 규칙 저장

ALTER TABLE public.kpi_definitions
  ADD COLUMN IF NOT EXISTS computation JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'number'
    CHECK (format IN ('number', 'currency', 'percentage', 'duration', 'decimal')),
  ADD COLUMN IF NOT EXISTS higher_is_better BOOLEAN NOT NULL DEFAULT true;

-- computation 스키마 예시:
-- sum:   { "type": "sum",   "sources": [{ "platform": "meta_ads", "metric": "cost" }] }
-- avg:   { "type": "avg",   "sources": [{ "platform": "google_analytics", "metric": "bounce_rate" }] }
-- ratio: { "type": "ratio",
--          "numerator":   [{ "platform": "*", "metric": "clicks" }],
--          "denominator": [{ "platform": "*", "metric": "impressions" }] }
-- platform: "*" = 모든 플랫폼 합산, 또는 특정 플랫폼명

COMMENT ON COLUMN public.kpi_definitions.computation IS
  'JSONB: { type: sum|avg|ratio, sources: [{platform, metric}], numerator?, denominator? }. NULL이면 수동 입력';
COMMENT ON COLUMN public.kpi_definitions.format IS
  'number|currency|percentage|duration|decimal — 표시 포맷';
COMMENT ON COLUMN public.kpi_definitions.higher_is_better IS
  'true=높을수록 좋음(클릭수 등), false=낮을수록 좋음(이탈률, CPC 등)';
