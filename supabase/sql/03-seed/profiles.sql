-- ============================================================
-- 03-seed: 프로필 등록 (Auth 사용자 생성 후 실행)
-- 기존 회원 프로필 삭제 후 재등록 → 여러 번 실행 가능
-- ============================================================

-- 기존 admin/test 프로필 제거 (다시 실행해도 오류 없음)
DELETE FROM public.profiles
WHERE user_id IN (
  '9b54abfa-7692-48a3-804d-bec6b977181d',
  'ebf05114-6c34-4c20-b25f-d31496c24541'
);

-- Admin / 테스트 클라이언트 프로필 등록
-- Auth에서 해당 이메일로 사용자 생성 후 UUID가 위와 같을 때 사용
INSERT INTO public.profiles (user_id, role, client_id, display_name, email)
VALUES
  ('9b54abfa-7692-48a3-804d-bec6b977181d', 'admin', NULL, 'Admin', 'yeomjw0907@naver.com'),
  ('ebf05114-6c34-4c20-b25f-d31496c24541', 'client', 'c0000000-0000-0000-0000-000000000001', 'Test Client', 'test1@naver.com');
