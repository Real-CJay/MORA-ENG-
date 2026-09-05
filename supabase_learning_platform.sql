-- MoraMCQ learning platform upgrade
-- Apply this in the Supabase SQL editor for project zjjvtqcuaqyccxdklvbs.
-- It reuses quiz_sessions, answer_history, and question_performance for metrics.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Student',
  avatar_style text not null default 'initials',
  avatar_icon text not null default 'initials',
  avatar_color text not null default '#8fa6f5',
  avatar_bg text not null default '#182033',
  public_profile boolean not null default true,
  leaderboard_visible boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles add column if not exists avatar_url text;
alter table public.user_profiles add column if not exists is_admin boolean not null default false;
alter table public.user_profiles add column if not exists avatar_style text not null default 'initials';
alter table public.user_profiles add column if not exists avatar_icon text not null default 'initials';
alter table public.user_profiles add column if not exists avatar_color text not null default '#8fa6f5';
alter table public.user_profiles add column if not exists avatar_bg text not null default '#182033';
alter table public.user_profiles add column if not exists public_profile boolean not null default true;
alter table public.user_profiles add column if not exists leaderboard_visible boolean not null default true;

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  progress numeric not null default 0,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.user_daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  quizzes_completed integer not null default 0,
  questions_answered integer not null default 0,
  correct_answers integer not null default 0,
  study_time integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.user_profiles enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_daily_activity enable row level security;
alter table public.answer_history enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.question_performance enable row level security;

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

drop policy if exists "avatar images public read" on storage.objects;
create policy "avatar images public read"
on storage.objects for select
using (bucket_id = 'profile-avatars');

drop policy if exists "avatar images insert own folder" on storage.objects;
create policy "avatar images insert own folder"
on storage.objects for insert
with check (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatar images update own folder" on storage.objects;
create policy "avatar images update own folder"
on storage.objects for update
using (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatar images delete own folder" on storage.objects;
create policy "avatar images delete own folder"
on storage.objects for delete
using (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

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

drop policy if exists "daily own read" on public.user_daily_activity;
create policy "daily own read"
on public.user_daily_activity for select
using (user_id = auth.uid());

drop policy if exists "daily own write" on public.user_daily_activity;
create policy "daily own write"
on public.user_daily_activity for insert
with check (user_id = auth.uid());

drop policy if exists "daily own update" on public.user_daily_activity;
create policy "daily own update"
on public.user_daily_activity for update
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

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_user_achievements_updated_at on public.user_achievements;
create trigger trg_user_achievements_updated_at
before update on public.user_achievements
for each row execute function public.touch_updated_at();

drop trigger if exists trg_user_daily_activity_updated_at on public.user_daily_activity;
create trigger trg_user_daily_activity_updated_at
before update on public.user_daily_activity
for each row execute function public.touch_updated_at();

create or replace function public.ensure_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, display_name, leaderboard_visible, public_profile)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Student'),
    true,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_profile on auth.users;
create trigger trg_auth_user_profile
after insert on auth.users
for each row execute function public.ensure_user_profile();

create or replace function public.record_quiz_daily_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_daily_activity (
    user_id, activity_date, quizzes_completed, questions_answered, correct_answers, study_time
  )
  values (
    new.user_id,
    (coalesce(new.completed_at, now()) at time zone 'UTC')::date,
    1,
    coalesce(new.total, 0),
    coalesce(new.score, 0),
    coalesce(new.time_taken, 0)
  )
  on conflict (user_id, activity_date) do update
  set quizzes_completed = public.user_daily_activity.quizzes_completed + 1,
      questions_answered = public.user_daily_activity.questions_answered + coalesce(excluded.questions_answered, 0),
      correct_answers = public.user_daily_activity.correct_answers + coalesce(excluded.correct_answers, 0),
      study_time = public.user_daily_activity.study_time + coalesce(excluded.study_time, 0),
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_quiz_session_daily_activity on public.quiz_sessions;
create trigger trg_quiz_session_daily_activity
after insert on public.quiz_sessions
for each row execute function public.record_quiz_daily_activity();

insert into public.app_settings (key, value)
values ('leaderboard_modes', '["pastpaper","target"]'::jsonb)
on conflict (key) do nothing;

drop view if exists public.learning_pastpaper_leaderboard_monthly;
drop view if exists public.learning_pastpaper_leaderboard_weekly;
drop view if exists public.learning_pastpaper_leaderboard_all_time;
drop view if exists public.learning_leaderboard_monthly;
drop view if exists public.learning_leaderboard_weekly;
drop view if exists public.learning_leaderboard_all_time;

create or replace function public.get_leaderboard_modes()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(
    (select array_agg(mode)
     from jsonb_array_elements_text(
       coalesce(
         (select value from public.app_settings where key = 'leaderboard_modes'),
         '["pastpaper","target"]'::jsonb
       )
     ) as modes(mode)),
    array['pastpaper', 'target']::text[]
  );
$$;

create or replace view public.learning_leaderboard_all_time
with (security_invoker = false) as
select
  qs.user_id,
  coalesce(up.display_name, 'Student') as display_name,
  up.avatar_style,
  up.avatar_icon,
  up.avatar_color,
  up.avatar_bg,
  up.avatar_url,
  count(*)::int as quizzes_completed,
  coalesce(sum(qs.total), 0)::int as questions_answered,
  coalesce(sum(qs.score), 0)::int as correct_answers,
  coalesce(sum(qs.time_taken), 0)::int as study_time,
  case when coalesce(sum(qs.total), 0) > 0
    then round((sum(qs.score)::numeric / sum(qs.total)::numeric) * 100, 1)
    else 0 end as accuracy
from public.quiz_sessions qs
join public.user_profiles up on up.id = qs.user_id
where up.leaderboard_visible = true
  and qs.app_mode = any(public.get_leaderboard_modes())
group by qs.user_id, up.display_name, up.avatar_style, up.avatar_icon, up.avatar_color, up.avatar_bg, up.avatar_url;

create or replace view public.learning_leaderboard_weekly
with (security_invoker = false) as
select
  qs.user_id,
  coalesce(up.display_name, 'Student') as display_name,
  up.avatar_style,
  up.avatar_icon,
  up.avatar_color,
  up.avatar_bg,
  up.avatar_url,
  count(*)::int as quizzes_completed,
  coalesce(sum(qs.total), 0)::int as questions_answered,
  coalesce(sum(qs.score), 0)::int as correct_answers,
  coalesce(sum(qs.time_taken), 0)::int as study_time,
  case when coalesce(sum(qs.total), 0) > 0
    then round((sum(qs.score)::numeric / sum(qs.total)::numeric) * 100, 1)
    else 0 end as accuracy
from public.quiz_sessions qs
join public.user_profiles up on up.id = qs.user_id
where up.leaderboard_visible = true
  and qs.app_mode = any(public.get_leaderboard_modes())
  and qs.completed_at >= now() - interval '7 days'
group by qs.user_id, up.display_name, up.avatar_style, up.avatar_icon, up.avatar_color, up.avatar_bg, up.avatar_url;

create or replace view public.learning_leaderboard_monthly
with (security_invoker = false) as
select
  qs.user_id,
  coalesce(up.display_name, 'Student') as display_name,
  up.avatar_style,
  up.avatar_icon,
  up.avatar_color,
  up.avatar_bg,
  up.avatar_url,
  count(*)::int as quizzes_completed,
  coalesce(sum(qs.total), 0)::int as questions_answered,
  coalesce(sum(qs.score), 0)::int as correct_answers,
  coalesce(sum(qs.time_taken), 0)::int as study_time,
  case when coalesce(sum(qs.total), 0) > 0
    then round((sum(qs.score)::numeric / sum(qs.total)::numeric) * 100, 1)
    else 0 end as accuracy
from public.quiz_sessions qs
join public.user_profiles up on up.id = qs.user_id
where up.leaderboard_visible = true
  and qs.app_mode = any(public.get_leaderboard_modes())
  and qs.completed_at >= now() - interval '30 days'
group by qs.user_id, up.display_name, up.avatar_style, up.avatar_icon, up.avatar_color, up.avatar_bg, up.avatar_url;

create or replace view public.learning_pastpaper_leaderboard_all_time
with (security_invoker = false) as
select
  qs.user_id,
  coalesce(up.display_name, 'Student') as display_name,
  up.avatar_style,
  up.avatar_icon,
  up.avatar_color,
  up.avatar_bg,
  up.avatar_url,
  count(*)::int as quizzes_completed,
  coalesce(sum(qs.total), 0)::int as questions_answered,
  coalesce(sum(qs.score), 0)::int as correct_answers,
  coalesce(sum(qs.time_taken), 0)::int as study_time,
  case when coalesce(sum(qs.total), 0) > 0
    then round((sum(qs.score)::numeric / sum(qs.total)::numeric) * 100, 1)
    else 0 end as accuracy
from public.quiz_sessions qs
join public.user_profiles up on up.id = qs.user_id
where up.leaderboard_visible = true
  and qs.app_mode = 'pastpaper'
group by qs.user_id, up.display_name, up.avatar_style, up.avatar_icon, up.avatar_color, up.avatar_bg, up.avatar_url;

create or replace view public.learning_pastpaper_leaderboard_weekly
with (security_invoker = false) as
select
  qs.user_id,
  coalesce(up.display_name, 'Student') as display_name,
  up.avatar_style,
  up.avatar_icon,
  up.avatar_color,
  up.avatar_bg,
  up.avatar_url,
  count(*)::int as quizzes_completed,
  coalesce(sum(qs.total), 0)::int as questions_answered,
  coalesce(sum(qs.score), 0)::int as correct_answers,
  coalesce(sum(qs.time_taken), 0)::int as study_time,
  case when coalesce(sum(qs.total), 0) > 0
    then round((sum(qs.score)::numeric / sum(qs.total)::numeric) * 100, 1)
    else 0 end as accuracy
from public.quiz_sessions qs
join public.user_profiles up on up.id = qs.user_id
where up.leaderboard_visible = true
  and qs.app_mode = 'pastpaper'
  and qs.completed_at >= now() - interval '7 days'
group by qs.user_id, up.display_name, up.avatar_style, up.avatar_icon, up.avatar_color, up.avatar_bg, up.avatar_url;

create or replace view public.learning_pastpaper_leaderboard_monthly
with (security_invoker = false) as
select
  qs.user_id,
  coalesce(up.display_name, 'Student') as display_name,
  up.avatar_style,
  up.avatar_icon,
  up.avatar_color,
  up.avatar_bg,
  up.avatar_url,
  count(*)::int as quizzes_completed,
  coalesce(sum(qs.total), 0)::int as questions_answered,
  coalesce(sum(qs.score), 0)::int as correct_answers,
  coalesce(sum(qs.time_taken), 0)::int as study_time,
  case when coalesce(sum(qs.total), 0) > 0
    then round((sum(qs.score)::numeric / sum(qs.total)::numeric) * 100, 1)
    else 0 end as accuracy
from public.quiz_sessions qs
join public.user_profiles up on up.id = qs.user_id
where up.leaderboard_visible = true
  and qs.app_mode = 'pastpaper'
  and qs.completed_at >= now() - interval '30 days'
group by qs.user_id, up.display_name, up.avatar_style, up.avatar_icon, up.avatar_color, up.avatar_bg, up.avatar_url;
create index if not exists idx_quiz_sessions_user_completed
  on public.quiz_sessions(user_id, completed_at desc);
create index if not exists idx_quiz_sessions_subject_completed
  on public.quiz_sessions(subject, completed_at desc);
create index if not exists idx_answer_history_user_subject
  on public.answer_history(user_id, subject, answered_at desc);
create index if not exists idx_question_performance_user_subject
  on public.question_performance(user_id, subject);
create index if not exists idx_daily_activity_user_date
  on public.user_daily_activity(user_id, activity_date desc);

-- Required API privileges for Supabase PostgREST.
-- RLS policies still decide which rows each user can see/write; these grants only
-- allow the anon/authenticated roles to access the objects at all.
grant usage on schema public to anon, authenticated;

grant select, insert, update on table public.user_profiles to authenticated;
grant select, insert, update on table public.user_achievements to authenticated;
grant select, insert, update on table public.user_daily_activity to authenticated;

grant select, insert, update on table public.answer_history to authenticated;
grant select, insert on table public.quiz_sessions to authenticated;
grant select, insert, update on table public.question_performance to authenticated;

grant select on table public.learning_leaderboard_all_time to anon, authenticated;
grant select on table public.learning_leaderboard_weekly to anon, authenticated;
grant select on table public.learning_leaderboard_monthly to anon, authenticated;
grant select on table public.learning_pastpaper_leaderboard_all_time to anon, authenticated;
grant select on table public.learning_pastpaper_leaderboard_weekly to anon, authenticated;
grant select on table public.learning_pastpaper_leaderboard_monthly to anon, authenticated;
grant execute on function public.get_leaderboard_modes() to anon, authenticated;
