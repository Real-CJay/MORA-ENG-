-- Mora Quiz anonymous guest analytics.
-- Run in Supabase SQL editor for project zjjvtqcuaqyccxdklvbs.

create table if not exists public.guest_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  is_linked boolean not null default false,
  subject text not null,
  app_mode text not null,
  score integer not null default 0,
  total integer not null default 0,
  time_taken integer not null default 0,
  countdown_limit integer not null default 0,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.guest_quiz_sessions enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.guest_quiz_sessions to anon, authenticated;

drop policy if exists "guest sessions anonymous insert" on public.guest_quiz_sessions;
create policy "guest sessions anonymous insert"
on public.guest_quiz_sessions for insert
with check (user_id is null and is_linked = false);

drop policy if exists "guest sessions linked user read" on public.guest_quiz_sessions;
create policy "guest sessions linked user read"
on public.guest_quiz_sessions for select
using (user_id = auth.uid());

drop policy if exists "guest sessions link own account" on public.guest_quiz_sessions;
create policy "guest sessions link own account"
on public.guest_quiz_sessions for update
using (user_id is null)
with check (user_id = auth.uid() and is_linked = true);

create index if not exists idx_guest_quiz_sessions_guest
  on public.guest_quiz_sessions(guest_id, completed_at desc);

create index if not exists idx_guest_quiz_sessions_user
  on public.guest_quiz_sessions(user_id, completed_at desc);

create index if not exists idx_guest_quiz_sessions_linked
  on public.guest_quiz_sessions(is_linked, completed_at desc);
