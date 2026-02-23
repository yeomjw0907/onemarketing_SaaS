-- ============================================================
-- Migration 005: 마이페이지에서 본인 담당자 정보 수정 허용
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 본인 프로필 수정 (담당자명, 이메일)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 본인 소속 클라이언트의 담당자 정보 수정 (담당자명, 전화번호, 이메일)
DROP POLICY IF EXISTS "Client can update own client contact" ON public.clients;
CREATE POLICY "Client can update own client contact" ON public.clients
  FOR UPDATE USING (id = public.current_client_id())
  WITH CHECK (id = public.current_client_id());
