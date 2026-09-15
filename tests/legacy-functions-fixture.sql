-- Schema-only legacy definitions reviewed against live database, 2026-09-15.
CREATE OR REPLACE FUNCTION public.admin_daily_activity()
 RETURNS TABLE(day date, quizzes bigint, questions bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.admin_most_missed(p_limit integer DEFAULT 15)
 RETURNS TABLE(question_id text, subject text, total_attempts bigint, correct_count bigint, accuracy numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.admin_overview()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.admin_user_stats()
 RETURNS TABLE(user_id uuid, display_name text, email text, quizzes integer, total_q integer, correct_q integer, accuracy numeric, last_active timestamp with time zone, joined_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not coalesce((select is_admin from public.user_profiles where id = auth.uid()), false) then
    raise exception 'Unauthorized';
  end if;
  return query
    select
      up.id                                          ::uuid,
      up.display_name                                ::text,
      coalesce(au.email, '')                         ::text,
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
$function$;

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_leaderboard_modes()
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_quiz_daily_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
