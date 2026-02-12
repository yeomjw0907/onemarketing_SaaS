-- ============================================================
-- 03-seed: 데모 시드 데이터
-- 01-schema, 02-storage 실행 후, Auth 사용자 생성 후 실행
-- 실행 순서: 3번 (Auth 사용자 UUID 확인 후 placeholder 교체)
-- ============================================================

-- STEP 1: 데모 클라이언트
INSERT INTO public.clients (id, name, client_code, kakao_chat_url, enabled_modules, is_active)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Demo Company',
  'democlient',
  'https://open.kakao.com/o/example',
  '{
    "overview": true,
    "execution": true,
    "calendar": true,
    "projects": true,
    "reports": true,
    "assets": true,
    "support": true
  }'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- STEP 2: 프로필 등록 → Auth 사용자 생성 후 같은 폴더의 profiles.sql 실행

-- STEP 3: KPI 정의 (데모 클라이언트)
INSERT INTO public.kpi_definitions (client_id, metric_key, metric_label, unit, show_on_overview, overview_order, chart_enabled, description, validation_rule)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'visitors', '방문자 수', '명', true, 1, true, '주간 웹사이트 방문자 수', '{"required": true, "integer": true, "min": 0}'::jsonb),
  ('c0000000-0000-0000-0000-000000000001', 'leads', '리드 수', '건', true, 2, true, '주간 리드 생성 수', '{"required": true, "integer": true, "min": 0}'::jsonb),
  ('c0000000-0000-0000-0000-000000000001', 'conversion_rate', '전환율', '%', true, 3, true, '주간 전환율', '{"required": true, "min": 0, "max": 100}'::jsonb),
  ('c0000000-0000-0000-0000-000000000001', 'ad_spend', '광고비', '만원', true, 4, false, '월간 광고 집행비', '{"required": true, "min": 0}'::jsonb)
ON CONFLICT (client_id, metric_key) DO NOTHING;

-- STEP 4~7: Actions, Projects, Calendar, Metrics 샘플은
-- Admin 로그인 후 앱에서 입력하거나, UUID 확정 후 주석 해제하여 실행
