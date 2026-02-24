-- profiles에 company_name, phone 추가 + role에 pending/rejected 허용
-- Supabase SQL Editor에 붙여넣고 Run 실행

-- 1) role CHECK에 'pending', 'rejected' 추가
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'client', 'pending', 'rejected'));

-- 2) 가입 시 수집 필드
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3) 회원가입 시 본인 프로필 INSERT 허용
DROP POLICY IF EXISTS "Users can insert own profile for signup" ON public.profiles;
CREATE POLICY "Users can insert own profile for signup"
  ON public.profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 4) 본인 INSERT 시 role 강제 pending (admin 탈취 방지)
CREATE OR REPLACE FUNCTION public.profiles_force_pending_on_self_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id = auth.uid() THEN
    NEW.role := 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_force_pending_on_self_insert ON public.profiles;
CREATE TRIGGER trg_profiles_force_pending_on_self_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_force_pending_on_self_insert();

-- 5) 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
