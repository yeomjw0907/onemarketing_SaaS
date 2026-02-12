-- ============================================================
-- 02-storage: Storage 버킷 및 정책
-- 01-schema 실행 후, Supabase Dashboard > SQL Editor에서 실행
-- 실행 순서: 2번
-- ============================================================

-- 버킷 생성 (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책 (admin 업로드, admin 조회)
CREATE POLICY "Admin can upload to reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reports' AND public.is_admin());

CREATE POLICY "Admin can upload to assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'assets' AND public.is_admin());

CREATE POLICY "Admin can read all storage" ON storage.objects
  FOR SELECT USING (public.is_admin());
