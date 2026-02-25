-- ============================================================
-- Migration 014: 사용자 삭제 시 FK 오류 방지 (ON DELETE SET NULL)
-- auth.users 삭제 시 created_by/actor_user_id 를 NULL로 두고 레코드는 유지
-- Supabase Dashboard > Authentication > Users 에서 사용자 삭제 가능해짐
-- ============================================================

-- auth.users(id)를 참조하는 FK 중 profiles 제외하고 ON DELETE SET NULL 로 변경
-- (profiles는 ON DELETE CASCADE 유지 → 사용자 삭제 시 프로필도 삭제)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      c.conrelid::regclass::text AS tbl,
      a.attname AS col,
      c.conname AS fk_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.confrelid = 'auth.users'::regclass
      AND c.contype = 'f'
      AND c.conrelid::regclass::text LIKE 'public.%'
      AND c.conrelid::regclass::text NOT IN ('public.profiles', 'profiles')
      AND NOT a.attisdropped
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.tbl, r.fk_name);
    EXECUTE format('ALTER TABLE %s ALTER COLUMN %I DROP NOT NULL', r.tbl, r.col);
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL', r.tbl, r.fk_name || '_set_null', r.col);
  END LOOP;
END $$;
