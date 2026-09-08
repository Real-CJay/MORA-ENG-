-- Supabase 403 repair for Mora Quiz.
-- Run this in the Supabase SQL editor for project zjjvtqcuaqyccxdklvbs
-- if authenticated users see 403 Forbidden on user_profiles,
-- answer_history, question_performance, quiz_sessions, or user_achievements.

grant usage on schema public to anon, authenticated;

alter table public.user_profiles enable row level security;
alter table public.user_achievements enable row level security;
alter table public.answer_history enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.question_performance enable row level security;

grant select, insert, update on table public.user_profiles to authenticated;
grant select, insert, update on table public.user_achievements to authenticated;
grant select, insert, update on table public.answer_history to authenticated;
grant select, insert on table public.quiz_sessions to authenticated;
grant select, insert, update on table public.question_performance to authenticated;

drop policy if exists "profiles readable when public or own" on public.user_profiles;
create policy "profiles readable when public or own"
on public.user_profiles for select
using (id = auth.uid() or public_profile = true);

drop policy if exists "profiles insert own" on public.user_profiles;
create policy "profiles insert own"
on public.user_profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles update own" on public.user_profiles;
create policy "profiles update own"
on public.user_profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "achievements own read" on public.user_achievements;
create policy "achievements own read"
on public.user_achievements for select
using (user_id = auth.uid());

drop policy if exists "achievements own write" on public.user_achievements;
create policy "achievements own write"
on public.user_achievements for insert
with check (user_id = auth.uid());

drop policy if exists "achievements own update" on public.user_achievements;
create policy "achievements own update"
on public.user_achievements for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "answer history own read" on public.answer_history;
create policy "answer history own read"
on public.answer_history for select
using (user_id = auth.uid());

drop policy if exists "answer history own insert" on public.answer_history;
create policy "answer history own insert"
on public.answer_history for insert
with check (user_id = auth.uid());

drop policy if exists "answer history own update" on public.answer_history;
create policy "answer history own update"
on public.answer_history for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "quiz sessions own read" on public.quiz_sessions;
create policy "quiz sessions own read"
on public.quiz_sessions for select
using (user_id = auth.uid());

drop policy if exists "quiz sessions own insert" on public.quiz_sessions;
create policy "quiz sessions own insert"
on public.quiz_sessions for insert
with check (user_id = auth.uid());

drop policy if exists "question performance own read" on public.question_performance;
create policy "question performance own read"
on public.question_performance for select
using (user_id = auth.uid());

drop policy if exists "question performance own insert" on public.question_performance;
create policy "question performance own insert"
on public.question_performance for insert
with check (user_id = auth.uid());

drop policy if exists "question performance own update" on public.question_performance;
create policy "question performance own update"
on public.question_performance for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select on table public.learning_leaderboard_all_time to anon, authenticated;
grant select on table public.learning_leaderboard_weekly to anon, authenticated;
grant select on table public.learning_leaderboard_monthly to anon, authenticated;
