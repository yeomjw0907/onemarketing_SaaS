-- 실행 항목에 종료일(선택) 추가
ALTER TABLE public.actions ADD COLUMN IF NOT EXISTS end_date DATE;
