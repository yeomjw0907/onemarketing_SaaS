-- GA4 페이지별 일별 지표
CREATE TABLE ga4_page_metrics (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  integration_id        uuid NOT NULL REFERENCES data_integrations(id) ON DELETE CASCADE,
  metric_date           date NOT NULL,
  page_path             text NOT NULL,
  sessions              int DEFAULT 0,
  users                 int DEFAULT 0,
  pageviews             int DEFAULT 0,
  bounce_rate           numeric(6,4) DEFAULT 0,
  avg_session_duration  numeric(10,2) DEFAULT 0,
  scroll_depth_90       numeric(6,4) DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  UNIQUE(integration_id, metric_date, page_path)
);

-- 추적할 랜딩페이지 URL 설정 (data_integrations의 credentials에 target_paths 배열로 저장)
-- 별도 테이블 불필요, credentials JSONB 확장으로 처리

CREATE INDEX idx_ga4_page_metrics_client_date ON ga4_page_metrics(client_id, metric_date DESC);
CREATE INDEX idx_ga4_page_metrics_integration ON ga4_page_metrics(integration_id, metric_date DESC);

ALTER TABLE ga4_page_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_ga4_page_metrics" ON ga4_page_metrics FOR ALL USING (is_admin());
CREATE POLICY "client_own_ga4_page_metrics" ON ga4_page_metrics FOR SELECT USING (client_id = current_client_id());
