-- 클라이언트별 알림톡 발송 스케줄
CREATE TABLE IF NOT EXISTS client_report_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  template_type text NOT NULL CHECK (template_type IN ('PERFORMANCE', 'BUDGET', 'PROPOSAL')),
  -- PERFORMANCE = 성과 리포트 (기존 MON_REVIEW)
  -- BUDGET = 예산 현황 (기존 WED_BUDGET)
  -- PROPOSAL = 제안 승인 (기존 THU_PROPOSAL)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, day_of_week)
);

-- RLS 활성화
ALTER TABLE client_report_schedules ENABLE ROW LEVEL SECURITY;

-- 어드민(role='admin')만 CRUD 가능
CREATE POLICY "admin_all" ON client_report_schedules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_report_schedules_updated_at
  BEFORE UPDATE ON client_report_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_client_report_schedules_client_id ON client_report_schedules(client_id);
CREATE INDEX idx_client_report_schedules_day_active ON client_report_schedules(day_of_week, is_active);
