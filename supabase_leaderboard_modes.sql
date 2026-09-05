-- Mora Quiz leaderboard mode migration
-- Run this in Supabase SQL editor if the app already has quiz_sessions,
-- user_profiles, and app_settings.
--
-- This keeps full-paper quizzes out of the default overall leaderboard,
-- adds separate past-paper accuracy leaderboards, and exposes uploaded
-- profile avatars to leaderboard rows.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.user_profiles add column if not exists avatar_url text;

insert into public.app_settings (key, value)
values ('leaderboard_modes', '["pastpaper","target"]'::jsonb)
on conflict (key) do update
set value = coalesce(public.app_settings.value, excluded.value);

drop view if exists public.learning_pastpaper_leaderboard_monthly;
drop view if exists public.learning_pastpaper_leaderboard_weekly;
drop view if exists public.learning_pastpaper_leaderboard_all_time;
drop view if exists public.learning_leaderboard_monthly;
drop view if exists public.learning_leaderboard_weekly;
drop view if exists public.learning_leaderboard_all_time;

create or replace function public.get_leaderboard_modes()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select array_agg(mode)
      from jsonb_array_elements_text(
        coalesce(
          (select value from public.app_settings where key = 'leaderboard_modes'),
          '["pastpaper","target"]'::jsonb
        )
      ) as modes(mode)
    ),
    array['pastpaper', 'target']::text[]
  );
$$;

create view public.learning_leaderboard_all_time
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

create view public.learning_leaderboard_weekly
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

create view public.learning_leaderboard_monthly
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

create view public.learning_pastpaper_leaderboard_all_time
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

create view public.learning_pastpaper_leaderboard_weekly
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

create view public.learning_pastpaper_leaderboard_monthly
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

grant select on table public.learning_leaderboard_all_time to anon, authenticated;
grant select on table public.learning_leaderboard_weekly to anon, authenticated;
grant select on table public.learning_leaderboard_monthly to anon, authenticated;
grant select on table public.learning_pastpaper_leaderboard_all_time to anon, authenticated;
grant select on table public.learning_pastpaper_leaderboard_weekly to anon, authenticated;
grant select on table public.learning_pastpaper_leaderboard_monthly to anon, authenticated;
grant execute on function public.get_leaderboard_modes() to anon, authenticated;
