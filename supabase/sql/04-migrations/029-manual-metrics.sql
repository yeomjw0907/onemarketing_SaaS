-- 수기 입력 채널 성과 (체험단, 상위노출 등)
CREATE TABLE IF NOT EXISTS manual_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel_type text NOT NULL CHECK (channel_type IN ('EXPERIENTIAL', 'SEO', 'BLOG', 'INFLUENCER', 'OTHER')),
  -- EXPERIENTIAL = 체험단
  -- SEO = 상위노출
  -- BLOG = 블로그 기자단
  -- INFLUENCER = 인플루언서
  -- OTHER = 기타
  channel_name text,            -- 플랫폼명 (레뷰, 마담잇수다 등)
  period_start date NOT NULL,
  period_end date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}',
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE manual_metrics ENABLE ROW LEVEL SECURITY;

-- 어드민만 CRUD
CREATE POLICY "admin_all" ON manual_metrics
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_manual_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER trg_manual_metrics_updated_at
  BEFORE UPDATE ON manual_metrics
  FOR EACH ROW EXECUTE FUNCTION update_manual_metrics_updated_at();

CREATE INDEX IF NOT EXISTS idx_manual_metrics_client_id ON manual_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_manual_metrics_client_period ON manual_metrics(client_id, period_start, period_end);
