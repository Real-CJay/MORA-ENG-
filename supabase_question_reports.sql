-- Question issue reports for Mora Quiz.
-- Run this once in the Supabase SQL editor.

create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  subject text,
  subject_label text,
  app_mode text,
  question_id text not null,
  question_text text,
  year text,
  unit text,
  issue_type text not null default 'other',
  details text,
  page_url text,
  local_report_id text,
  status text not null default 'open',
  report_payload jsonb not null default '{}'::jsonb
);

create index if not exists question_reports_created_at_idx
  on public.question_reports (created_at desc);

create index if not exists question_reports_status_idx
  on public.question_reports (status, created_at desc);

create index if not exists question_reports_question_idx
  on public.question_reports (subject, question_id);

alter table public.question_reports enable row level security;

drop policy if exists "question_reports_insert_guest" on public.question_reports;
create policy "question_reports_insert_guest"
on public.question_reports
for insert
to anon
with check (user_id is null);

drop policy if exists "question_reports_insert_authenticated" on public.question_reports;
create policy "question_reports_insert_authenticated"
on public.question_reports
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "question_reports_read_own" on public.question_reports;
create policy "question_reports_read_own"
on public.question_reports
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "question_reports_admin_read" on public.question_reports;
create policy "question_reports_admin_read"
on public.question_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid()
      and coalesce(p.is_admin, false) = true
  )
);

drop policy if exists "question_reports_admin_update" on public.question_reports;
create policy "question_reports_admin_update"
on public.question_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid()
      and coalesce(p.is_admin, false) = true
  )
)
with check (
  exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid()
      and coalesce(p.is_admin, false) = true
  )
);
