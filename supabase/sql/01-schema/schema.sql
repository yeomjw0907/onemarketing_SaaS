-- ============================================================
-- 01-schema: Onecation Client Portal - Database Schema
-- Supabase Postgres + RLS (테이블, 인덱스, RLS, 트리거)
-- 실행 순서: 1번 (가장 먼저 실행)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES (헬퍼 함수보다 먼저 생성)
-- ============================================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  kakao_chat_url TEXT,
  enabled_modules JSONB NOT NULL DEFAULT '{
    "overview": true,
    "execution": true,
    "calendar": true,
    "projects": true,
    "reports": true,
    "assets": true,
    "support": true
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.kpi_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  show_on_overview BOOLEAN NOT NULL DEFAULT false,
  overview_order INT NOT NULL DEFAULT 0,
  chart_enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  validation_rule JSONB DEFAULT '{"required": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, metric_key)
);

CREATE TABLE public.metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metric_key TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'done', 'hold')),
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  links JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL DEFAULT 'website' CHECK (project_type IN ('website', 'landing', 'promotion')),
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'planning' CHECK (stage IN ('planning', 'design', 'dev', 'qa', 'done')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  due_date DATE,
  memo TEXT,
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  event_type TEXT NOT NULL DEFAULT 'task',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'hold')),
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  related_action_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'monthly')),
  title TEXT NOT NULL,
  summary TEXT,
  file_path TEXT NOT NULL,
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL DEFAULT 'other' CHECK (asset_type IN ('logo', 'guideline', 'font', 'photo', 'video', 'other')),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  diff JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- HELPER FUNCTIONS (profiles 테이블 생성 후)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT client_id FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_kpi_definitions_client_id ON public.kpi_definitions(client_id);
CREATE INDEX idx_kpi_definitions_overview ON public.kpi_definitions(client_id, show_on_overview, overview_order);
CREATE INDEX idx_metrics_client_id ON public.metrics(client_id);
CREATE INDEX idx_metrics_period ON public.metrics(client_id, period_type, period_start);
CREATE INDEX idx_actions_client_id ON public.actions(client_id);
CREATE INDEX idx_actions_status ON public.actions(client_id, status);
CREATE INDEX idx_actions_date ON public.actions(client_id, action_date DESC);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_calendar_events_client_id ON public.calendar_events(client_id);
CREATE INDEX idx_calendar_events_dates ON public.calendar_events(client_id, start_at);
CREATE INDEX idx_reports_client_id ON public.reports(client_id);
CREATE INDEX idx_reports_published ON public.reports(client_id, published_at DESC);
CREATE INDEX idx_assets_client_id ON public.assets(client_id);
CREATE INDEX idx_audit_logs_client ON public.audit_logs(client_id, created_at DESC);

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

CREATE POLICY "Admin can do all on clients" ON public.clients FOR ALL USING (public.is_admin());
CREATE POLICY "Client can view own client" ON public.clients FOR SELECT USING (id = public.current_client_id());
CREATE POLICY "Admin can do all on profiles" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin can do all on kpi_definitions" ON public.kpi_definitions FOR ALL USING (public.is_admin());
CREATE POLICY "Client can view own kpi_definitions" ON public.kpi_definitions FOR SELECT USING (client_id = public.current_client_id());
CREATE POLICY "Admin can do all on metrics" ON public.metrics FOR ALL USING (public.is_admin());
CREATE POLICY "Client can view own metrics" ON public.metrics FOR SELECT USING (client_id = public.current_client_id() AND visibility = 'visible');
CREATE POLICY "Admin can do all on actions" ON public.actions FOR ALL USING (public.is_admin());
CREATE POLICY "Client can view own actions" ON public.actions FOR SELECT USING (client_id = public.current_client_id() AND visibility = 'visible');
CREATE POLICY "Admin can do all on projects" ON public.projects FOR ALL USING (public.is_admin());
CREATE POLICY "Client can view own projects" ON public.projects FOR SELECT USING (client_id = public.current_client_id() AND visibility = 'visible');
CREATE POLICY "Admin can do all on calendar_events" ON public.calendar_events FOR ALL USING (public.is_admin());
CREATE POLICY "Client can view own calendar_events" ON public.calendar_events FOR SELECT USING (client_id = public.current_client_id() AND visibility = 'visible');
CREATE POLICY "Admin can do all on reports" ON public.reports FOR ALL USING (public.is_admin());
CREATE POLICY "Client can view own reports" ON public.reports FOR SELECT USING (client_id = public.current_client_id() AND visibility = 'visible');
CREATE POLICY "Admin can do all on assets" ON public.assets FOR ALL USING (public.is_admin());
CREATE POLICY "Client can view own assets" ON public.assets FOR SELECT USING (client_id = public.current_client_id() AND visibility = 'visible');
CREATE POLICY "Admin can view all audit_logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin());

-- ============================================================
-- TRIGGERS (updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_clients BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_kpi_definitions BEFORE UPDATE ON public.kpi_definitions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_metrics BEFORE UPDATE ON public.metrics FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_actions BEFORE UPDATE ON public.actions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_calendar_events BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
