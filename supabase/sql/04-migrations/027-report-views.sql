-- Migration 027: report_views 테이블 생성
-- 리포트 열람 추적용 (열람 횟수, 체류 시간)

CREATE TABLE IF NOT EXISTS public.report_views (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id        UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  viewer_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  opened_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT report_views_unique_viewer UNIQUE (report_id, viewer_user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS report_views_report_id_idx ON public.report_views (report_id);
CREATE INDEX IF NOT EXISTS report_views_client_id_idx ON public.report_views (client_id);

-- RLS 활성화
ALTER TABLE public.report_views ENABLE ROW LEVEL SECURITY;

-- 관리자는 전체 조회 가능
CREATE POLICY "admin_select_report_views"
  ON public.report_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 클라이언트는 자신의 열람 기록만 조회
CREATE POLICY "client_select_own_report_views"
  ON public.report_views FOR SELECT
  USING (viewer_user_id = auth.uid());

-- INSERT/UPDATE는 service role만 (API Route에서 createServiceClient() 사용)
