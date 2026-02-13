-- ============================================================
-- enabled_services 컬럼 확실히 존재 + 스키마 캐시 갱신
-- Supabase SQL Editor에서 실행 후 "Could not find enabled_services" 오류 해결
-- ============================================================

-- 1) 컬럼 없으면 추가
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS enabled_services JSONB NOT NULL DEFAULT '{}';

-- 2) PostgREST가 새 스키마를 읽도록 알림 (필수)
NOTIFY pgrst, 'reload schema';
