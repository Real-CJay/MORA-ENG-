-- ═══════════════════════════════════════════════════════════════════════
-- Mora Quiz — Master Setup SQL
-- Run this ONCE in the Supabase SQL editor for project zjjvtqcuaqyccxdklvbs.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. SCHEMA ACCESS ─────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

-- ── 2. BASE QUIZ TABLES ──────────────────────────────────────────────────────

create table if not exists public.quiz_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subject         text not null,
  app_mode        text not null default 'standard',
  score           integer not null default 0,
  total           integer not null default 0,
  time_taken      integer not null default 0,
  countdown_limit integer not null default 0,
  completed_at    timestamptz not null default now()
);

create table if not exists public.answer_history (
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject     text not null,
  question_id text not null,
  selected    text,
  correct     boolean not null default false,
  answered_at timestamptz not null default now(),
  primary key (user_id, subject, question_id)
);

create table if not exists public.question_performance (
  user_id         uuid not null references auth.users(id) on delete cascade,
  question_id     text not null,
  subject         text not null,
  correct_count   integer not null default 0,
  incorrect_count integer not null default 0,
  primary key (user_id, question_id)
);

-- ── 3. LEARNING PLATFORM TABLES ──────────────────────────────────────────────

create table if not exists public.user_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text not null default 'Student',
  avatar_style        text not null default 'initials',
  avatar_icon         text not null default 'initials',
  avatar_color        text not null default '#8fa6f5',
  avatar_bg           text not null default '#182033',
  public_profile      boolean not null default true,
  leaderboard_visible boolean not null default true,
  is_admin            boolean not null default false,
  avatar_url          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  progress       numeric not null default 0,
  unlocked_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.user_daily_activity (
  user_id            uuid not null references auth.users(id) on delete cascade,
  activity_date      date not null,
  quizzes_completed  integer not null default 0,
  questions_answered integer not null default 0,
  correct_answers    integer not null default 0,
  study_time         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create table if not exists public.guest_quiz_sessions (
  id              uuid primary key default gen_random_uuid(),
  guest_id        text not null,
  user_id         uuid references auth.users(id) on delete set null,
  is_linked       boolean not null default false,
  subject         text not null,
  app_mode        text not null,
  score           integer not null default 0,
  total           integer not null default 0,
  time_taken      integer not null default 0,
  countdown_limit integer not null default 0,
  completed_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- Add is_admin column if the table existed before without it
alter table public.user_profiles add column if not exists is_admin boolean not null default false;

-- ── 4. TRIGGERS ──────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at     on public.user_profiles;
drop trigger if exists trg_user_achievements_updated_at on public.user_achievements;
drop trigger if exists trg_user_daily_activity_updated_at on public.user_daily_activity;

create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.touch_updated_at();

create trigger trg_user_achievements_updated_at
  before update on public.user_achievements
  for each row execute function public.touch_updated_at();

create trigger trg_user_daily_activity_updated_at
  before update on public.user_daily_activity
  for each row execute function public.touch_updated_at();

-- Auto-create a user_profiles row when a new auth user signs up
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

-- Backfill: create profiles for any existing auth users that don't have one yet
insert into public.user_profiles (id, display_name, leaderboard_visible, public_profile)
select
  id,
  coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1), 'Student'),
  true,
  true
from auth.users
on conflict (id) do nothing;

-- Record daily activity when a quiz session is saved
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
  set quizzes_completed  = public.user_daily_activity.quizzes_completed  + 1,
      questions_answered = public.user_daily_activity.questions_answered + coalesce(excluded.questions_answered, 0),
      correct_answers    = public.user_daily_activity.correct_answers    + coalesce(excluded.correct_answers, 0),
      study_time         = public.user_daily_activity.study_time         + coalesce(excluded.study_time, 0),
      updated_at         = now();
  return new;
end;
$$;

drop trigger if exists trg_quiz_session_daily_activity on public.quiz_sessions;
create trigger trg_quiz_session_daily_activity
  after insert on public.quiz_sessions
  for each row execute function public.record_quiz_daily_activity();

-- ── 5. LEADERBOARD VIEWS ─────────────────────────────────────────────────────

create or replace view public.learning_leaderboard_all_time
with (security_invoker = false) as
select
  qs.user_id,
  coalesce(up.display_name, 'Student')   as display_name,
  up.avatar_style,
  up.avatar_icon,
  up.avatar_color,
  up.avatar_bg,
  count(*)::int                          as quizzes_completed,
  coalesce(sum(qs.total),  0)::int       as questions_answered,
  coalesce(sum(qs.score),  0)::int       as correct_answers,
  coalesce(sum(qs.time_taken), 0)::int   as study_time,
  case when coalesce(sum(qs.total), 0) > 0
    then round((sum(qs.score)::numeric / sum(qs.total)::numeric) * 100, 1)
    else 0
  end as accuracy
from public.quiz_sessions qs
join public.user_profiles up on up.id = qs.user_id
where up.leaderboard_visible = true
group by qs.user_id, up.display_name, up.avatar_style, up.avatar_icon, up.avatar_color, up.avatar_bg;

create or replace view public.learning_leaderboard_weekly
with (security_invoker = false) as
select * from public.learning_leaderboard_all_time
where user_id in (
  select distinct user_id from public.quiz_sessions
  where completed_at >= now() - interval '7 days'
);

create or replace view public.learning_leaderboard_monthly
with (security_invoker = false) as
select * from public.learning_leaderboard_all_time
where user_id in (
  select distinct user_id from public.quiz_sessions
  where completed_at >= now() - interval '30 days'
);

-- ── 6. INDEXES ───────────────────────────────────────────────────────────────

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
create index if not exists idx_guest_quiz_sessions_guest
  on public.guest_quiz_sessions(guest_id, completed_at desc);
create index if not exists idx_guest_quiz_sessions_user
  on public.guest_quiz_sessions(user_id, completed_at desc);

-- ── 7. ROW LEVEL SECURITY ────────────────────────────────────────────────────

alter table public.user_profiles         enable row level security;
alter table public.user_achievements     enable row level security;
alter table public.user_daily_activity   enable row level security;
alter table public.answer_history        enable row level security;
alter table public.quiz_sessions         enable row level security;
alter table public.question_performance  enable row level security;
alter table public.guest_quiz_sessions   enable row level security;

-- user_profiles
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

-- user_achievements
drop policy if exists "achievements own read"   on public.user_achievements;
drop policy if exists "achievements own write"  on public.user_achievements;
drop policy if exists "achievements own update" on public.user_achievements;

create policy "achievements own read"
  on public.user_achievements for select
  using (user_id = auth.uid());
create policy "achievements own write"
  on public.user_achievements for insert
  with check (user_id = auth.uid());
create policy "achievements own update"
  on public.user_achievements for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- user_daily_activity
drop policy if exists "daily own read"   on public.user_daily_activity;
drop policy if exists "daily own write"  on public.user_daily_activity;
drop policy if exists "daily own update" on public.user_daily_activity;

create policy "daily own read"
  on public.user_daily_activity for select
  using (user_id = auth.uid());
create policy "daily own write"
  on public.user_daily_activity for insert
  with check (user_id = auth.uid());
create policy "daily own update"
  on public.user_daily_activity for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- answer_history
drop policy if exists "answer history own read"   on public.answer_history;
drop policy if exists "answer history own insert" on public.answer_history;
drop policy if exists "answer history own update" on public.answer_history;

create policy "answer history own read"
  on public.answer_history for select
  using (user_id = auth.uid());
create policy "answer history own insert"
  on public.answer_history for insert
  with check (user_id = auth.uid());
create policy "answer history own update"
  on public.answer_history for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- quiz_sessions
drop policy if exists "quiz sessions own read"   on public.quiz_sessions;
drop policy if exists "quiz sessions own insert" on public.quiz_sessions;

create policy "quiz sessions own read"
  on public.quiz_sessions for select
  using (user_id = auth.uid());
create policy "quiz sessions own insert"
  on public.quiz_sessions for insert
  with check (user_id = auth.uid());

-- question_performance
drop policy if exists "question performance own read"   on public.question_performance;
drop policy if exists "question performance own insert" on public.question_performance;
drop policy if exists "question performance own update" on public.question_performance;

create policy "question performance own read"
  on public.question_performance for select
  using (user_id = auth.uid());
create policy "question performance own insert"
  on public.question_performance for insert
  with check (user_id = auth.uid());
create policy "question performance own update"
  on public.question_performance for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- guest_quiz_sessions
drop policy if exists "guest sessions anonymous insert"  on public.guest_quiz_sessions;
drop policy if exists "guest sessions linked user read"  on public.guest_quiz_sessions;
drop policy if exists "guest sessions link own account"  on public.guest_quiz_sessions;

create policy "guest sessions anonymous insert"
  on public.guest_quiz_sessions for insert
  with check (user_id is null and is_linked = false);
create policy "guest sessions linked user read"
  on public.guest_quiz_sessions for select
  using (user_id = auth.uid());
create policy "guest sessions link own account"
  on public.guest_quiz_sessions for update
  using (user_id is null)
  with check (user_id = auth.uid() and is_linked = true);

-- ── 8. TABLE GRANTS ──────────────────────────────────────────────────────────

grant select, insert, update on table public.user_profiles        to authenticated;
grant select, insert, update on table public.user_achievements    to authenticated;
grant select, insert, update on table public.user_daily_activity  to authenticated;
grant select, insert, update on table public.answer_history       to authenticated;
grant select, insert         on table public.quiz_sessions        to authenticated;
grant select, insert, update on table public.question_performance to authenticated;
grant select, insert, update on table public.guest_quiz_sessions  to anon, authenticated;

grant select on table public.learning_leaderboard_all_time to anon, authenticated;
grant select on table public.learning_leaderboard_weekly   to anon, authenticated;
grant select on table public.learning_leaderboard_monthly  to anon, authenticated;

-- ── 9. ADMIN RPC FUNCTIONS ───────────────────────────────────────────────────

create or replace function public.admin_overview()
returns json language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_admin from public.user_profiles where id = auth.uid()), false) then
    raise exception 'Unauthorized';
  end if;
  return (
    select json_build_object(
      'total_users',     (select count(*) from public.user_profiles where is_admin = false),
      'active_7d',       (select count(distinct user_id) from public.quiz_sessions where completed_at >= now() - interval '7 days'),
      'active_30d',      (select count(distinct user_id) from public.quiz_sessions where completed_at >= now() - interval '30 days'),
      'total_quizzes',   (select count(*) from public.quiz_sessions),
      'total_questions', (select coalesce(sum(total), 0) from public.quiz_sessions),
      'total_correct',   (select coalesce(sum(score), 0) from public.quiz_sessions),
      'quizzes_today',   (select count(*) from public.quiz_sessions where completed_at >= (now() at time zone 'UTC')::date)
    )
  );
end;
$$;

-- Drop first so we can change the return type signature safely
drop function if exists public.admin_user_stats();

create function public.admin_user_stats()
returns table(
  user_id      uuid,
  display_name text,
  email        text,
  quizzes      int,
  total_q      int,
  correct_q    int,
  accuracy     numeric,
  last_active  timestamptz,
  joined_at    timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_admin from public.user_profiles where id = auth.uid()), false) then
    raise exception 'Unauthorized';
  end if;
  return query
    select
      up.id                                          ::uuid,
      up.display_name                                ::text,
      coalesce(au.email, '')                         ::text,  -- auth.users.email is varchar
      count(qs.id)                                   ::int,
      coalesce(sum(qs.total),  0)                    ::int,
      coalesce(sum(qs.score),  0)                    ::int,
      case
        when coalesce(sum(qs.total), 0) > 0
        then round(
               coalesce(sum(qs.score),0)::numeric
             / coalesce(sum(qs.total),0)::numeric * 100, 1)
        else 0::numeric
      end                                            ::numeric,
      max(qs.completed_at)                           ::timestamptz,
      up.created_at                                  ::timestamptz
    from public.user_profiles up
    left join auth.users au on au.id = up.id
    left join public.quiz_sessions qs on qs.user_id = up.id
    where up.is_admin = false
    group by up.id, up.display_name, au.email, up.created_at
    order by max(qs.completed_at) desc nulls last;
end;
$$;

create or replace function public.admin_most_missed(p_limit int default 15)
returns table(
  question_id    text,
  subject        text,
  total_attempts bigint,
  correct_count  bigint,
  accuracy       numeric
) language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_admin from public.user_profiles where id = auth.uid()), false) then
    raise exception 'Unauthorized';
  end if;
  return query
    select
      qp.question_id,
      qp.subject,
      sum(qp.correct_count + qp.incorrect_count) as total_attempts,
      sum(qp.correct_count)                       as correct_count,
      case when sum(qp.correct_count + qp.incorrect_count) > 0
        then round(sum(qp.correct_count)::numeric / sum(qp.correct_count + qp.incorrect_count)::numeric * 100, 1)
        else 0::numeric
      end as accuracy
    from public.question_performance qp
    group by qp.question_id, qp.subject
    having sum(qp.correct_count + qp.incorrect_count) >= 2
    order by accuracy asc
    limit p_limit;
end;
$$;

create or replace function public.admin_daily_activity()
returns table(day date, quizzes bigint, questions bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_admin from public.user_profiles where id = auth.uid()), false) then
    raise exception 'Unauthorized';
  end if;
  return query
    select
      (completed_at at time zone 'UTC')::date as day,
      count(*)::bigint                         as quizzes,
      coalesce(sum(total), 0)::bigint          as questions
    from public.quiz_sessions
    where completed_at >= now() - interval '30 days'
    group by 1
    order by 1 desc;
end;
$$;

grant execute on function public.admin_overview()         to authenticated;
grant execute on function public.admin_user_stats()       to authenticated;
grant execute on function public.admin_most_missed(int)   to authenticated;
grant execute on function public.admin_daily_activity()   to authenticated;
