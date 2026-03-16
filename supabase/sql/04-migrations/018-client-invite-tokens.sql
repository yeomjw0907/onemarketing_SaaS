-- ============================================================
-- 018-client-invite-tokens: 클라이언트 초대 토큰 테이블
-- 에이전시가 클라이언트를 이메일로 초대할 때 사용
-- ============================================================

CREATE TABLE public.client_invite_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invite_tokens_token ON public.client_invite_tokens(token);
CREATE INDEX idx_invite_tokens_agency ON public.client_invite_tokens(agency_id);

ALTER TABLE public.client_invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on invite tokens" ON public.client_invite_tokens
  FOR ALL USING (public.is_admin());

CREATE POLICY "Agency owner can manage own invite tokens" ON public.client_invite_tokens
  FOR ALL USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE owner_user_id = auth.uid()
    )
  );

-- 초대 토큰은 공개 URL로 접근하므로 토큰 값으로 SELECT 허용
CREATE POLICY "Anyone can view by token" ON public.client_invite_tokens
  FOR SELECT USING (true);
