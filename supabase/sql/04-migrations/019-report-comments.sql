-- 019-report-comments.sql
-- 리포트 피드백/댓글 테이블

create table if not exists public.report_comments (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body        text not null check (char_length(body) > 0 and char_length(body) <= 2000),
  -- 승인/반려 (null = 일반 댓글)
  reaction    text check (reaction in ('approved', 'rejected', null)),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger report_comments_updated_at
  before update on public.report_comments
  for each row execute procedure public.set_updated_at();

-- 인덱스
create index if not exists report_comments_report_id_idx on public.report_comments(report_id);
create index if not exists report_comments_client_id_idx  on public.report_comments(client_id);

-- RLS
alter table public.report_comments enable row level security;

-- 어드민: 전체 접근
create policy "admin_all_report_comments"
  on public.report_comments for all
  using (public.is_admin())
  with check (public.is_admin());

-- 클라이언트: 자신의 client_id 댓글만 조회/삽입
create policy "client_select_report_comments"
  on public.report_comments for select
  using (client_id = public.current_client_id());

create policy "client_insert_report_comments"
  on public.report_comments for insert
  with check (
    client_id = public.current_client_id()
    and author_id = auth.uid()
  );
