-- ═══════════════════════════════════════════════════════════════════════
-- Mora Quiz — Admin extras: guest stats + user history reset
-- Run in the Supabase SQL editor for project zjjvtqcuaqyccxdklvbs
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Guest statistics ───────────────────────────────────────────────────────
create or replace function public.admin_guest_stats()
returns json
language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_admin from public.user_profiles where id = auth.uid()), false) then
    raise exception 'Unauthorized';
  end if;

  return (
    select json_build_object(
      -- guests who never registered (user_id is null)
      'total_guests',    (select count(distinct guest_id)
                          from public.guest_quiz_sessions
                          where user_id is null),
      'active_7d',       (select count(distinct guest_id)
                          from public.guest_quiz_sessions
                          where user_id is null
                            and completed_at >= now() - interval '7 days'),
      'active_30d',      (select count(distinct guest_id)
                          from public.guest_quiz_sessions
                          where user_id is null
                            and completed_at >= now() - interval '30 days'),
      'total_quizzes',   (select count(*)
                          from public.guest_quiz_sessions
                          where user_id is null),
      'total_questions', (select coalesce(sum(total), 0)
                          from public.guest_quiz_sessions
                          where user_id is null),
      'total_correct',   (select coalesce(sum(score), 0)
                          from public.guest_quiz_sessions
                          where user_id is null),
      -- guests who eventually created an account (user_id was later linked)
      'converted',       (select count(distinct guest_id)
                          from public.guest_quiz_sessions
                          where user_id is not null)
    )
  );
end;
$$;

grant execute on function public.admin_guest_stats() to authenticated;

-- ── 2. Reset a user's quiz history ───────────────────────────────────────────
create or replace function public.admin_reset_user_history(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  -- Only admins can call this
  if not coalesce((select is_admin from public.user_profiles where id = auth.uid()), false) then
    raise exception 'Unauthorized';
  end if;

  -- Protect admin accounts from being reset
  if coalesce((select is_admin from public.user_profiles where id = p_user_id), false) then
    raise exception 'Cannot reset an admin account';
  end if;

  delete from public.answer_history       where user_id = p_user_id;
  delete from public.quiz_sessions        where user_id = p_user_id;
  delete from public.question_performance where user_id = p_user_id;
  delete from public.user_achievements    where user_id = p_user_id;
  delete from public.user_daily_activity  where user_id = p_user_id;
  delete from public.user_flags           where user_id = p_user_id;
end;
$$;

grant execute on function public.admin_reset_user_history(uuid) to authenticated;
