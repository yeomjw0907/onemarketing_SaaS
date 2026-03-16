-- ============================================================
-- 017-agencies: 에이전시 + 구독 플랜 테이블
-- 사업화를 위한 에이전시 단위 멀티테넌시 및 구독 관리
-- ============================================================

-- 에이전시 테이블 (SaaS 구독 단위)
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 구독 플랜 정의 테이블
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_won INT NOT NULL,
  price_won_yearly INT,           -- 연간 결제 시 월 환산 금액
  max_clients INT,                -- NULL = 무제한
  max_alimtalk_per_month INT,     -- NULL = 무제한
  features JSONB NOT NULL DEFAULT '[]'::jsonb,  -- 기능 목록 (표시용)
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 에이전시 구독 테이블
CREATE TABLE public.agency_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL REFERENCES public.subscription_plans(plan_key),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'), -- 기본 14일 체험
  toss_customer_key TEXT,          -- Toss Payments 고객 키
  toss_billing_key TEXT,           -- Toss Payments 자동결제 키
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- clients 테이블에 agency_id 연결
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- profiles 테이블에 agency_id 연결 (에이전시 소속 유저)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_agencies_owner ON public.agencies(owner_user_id);
CREATE INDEX idx_agency_subscriptions_agency ON public.agency_subscriptions(agency_id);
CREATE INDEX idx_agency_subscriptions_status ON public.agency_subscriptions(status);
CREATE INDEX idx_clients_agency ON public.clients(agency_id);
CREATE INDEX idx_profiles_agency ON public.profiles(agency_id);

-- ============================================================
-- updated_at 트리거
-- ============================================================
CREATE TRIGGER set_updated_at_agencies
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_agency_subscriptions
  BEFORE UPDATE ON public.agency_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- agencies: 관리자(서비스 운영자)는 모두, 에이전시 오너는 자신의 것만
CREATE POLICY "Admin full access on agencies" ON public.agencies
  FOR ALL USING (public.is_admin());

CREATE POLICY "Agency owner can view own agency" ON public.agencies
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Agency owner can update own agency" ON public.agencies
  FOR UPDATE USING (owner_user_id = auth.uid());

-- subscription_plans: 누구나 조회 가능 (공개 가격 정보)
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access on plans" ON public.subscription_plans
  FOR ALL USING (public.is_admin());

-- agency_subscriptions: 관리자 또는 해당 에이전시 오너만 조회
CREATE POLICY "Admin full access on subscriptions" ON public.agency_subscriptions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Agency owner can view own subscription" ON public.agency_subscriptions
  FOR SELECT USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- 기본 구독 플랜 데이터 삽입
-- ============================================================
INSERT INTO public.subscription_plans (plan_key, name, price_won, price_won_yearly, max_clients, max_alimtalk_per_month, features, sort_order)
VALUES
  (
    'starter',
    '스타터',
    99000,
    79000,
    5,
    100,
    '["클라이언트 최대 5개", "모든 기본 모듈", "알림톡 100건/월", "주간·월간 리포트", "브랜드 에셋 자료실"]'::jsonb,
    1
  ),
  (
    'pro',
    '프로',
    199000,
    159000,
    20,
    500,
    '["클라이언트 최대 20개", "스타터 모든 기능", "알림톡 500건/월", "플랫폼 연동 (GA4·Meta·Google Ads·Naver)", "AI 리포트 자동 생성", "부가 서비스 스토어"]'::jsonb,
    2
  ),
  (
    'agency',
    '에이전시',
    399000,
    319000,
    NULL,
    NULL,
    '["클라이언트 무제한", "프로 모든 기능", "알림톡 무제한", "화이트라벨 지원", "전담 고객 지원", "커스텀 도메인"]'::jsonb,
    3
  );
