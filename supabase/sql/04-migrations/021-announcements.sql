-- 공지사항 테이블 (에이전시 → 전체 클라이언트 공지)
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text,
  is_pinned  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table announcements enable row level security;

-- 인증된 모든 유저 읽기 가능
create policy "announcements_read" on announcements
  for select using (auth.role() = 'authenticated');

-- admin만 쓰기 가능
create policy "announcements_admin_write" on announcements
  for all using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );
