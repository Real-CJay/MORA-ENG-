-- ═══════════════════════════════════════════════════════════════════════
-- Admin Setup — run once in the Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Add is_admin flag to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Step 2: Promote yourself to admin (replace with your actual user UUID)
-- Find your UUID: Supabase Dashboard → Authentication → Users
-- UPDATE public.user_profiles SET is_admin = true WHERE id = '<your-uuid>';


-- ═══════════════════════════════════════════════════════════════════════
-- RPC: admin_overview  — headline stats card
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_users',     (SELECT COUNT(*) FROM public.user_profiles WHERE is_admin = false),
      'active_7d',       (SELECT COUNT(DISTINCT user_id) FROM public.quiz_sessions
                          WHERE completed_at >= now() - interval '7 days'),
      'active_30d',      (SELECT COUNT(DISTINCT user_id) FROM public.quiz_sessions
                          WHERE completed_at >= now() - interval '30 days'),
      'total_quizzes',   (SELECT COUNT(*) FROM public.quiz_sessions),
      'total_questions', (SELECT COALESCE(SUM(total), 0) FROM public.quiz_sessions),
      'total_correct',   (SELECT COALESCE(SUM(score), 0) FROM public.quiz_sessions),
      'quizzes_today',   (SELECT COUNT(*) FROM public.quiz_sessions
                          WHERE completed_at >= (now() AT TIME ZONE 'UTC')::date)
    )
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- RPC: admin_user_stats  — per-user breakdown table
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_user_stats()
RETURNS TABLE(
  user_id        uuid,
  display_name   text,
  email          text,
  quizzes        int,
  total_q        int,
  correct_q      int,
  accuracy       numeric,
  last_active    timestamptz,
  joined_at      timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT
      up.id,
      up.display_name,
      au.email,
      COUNT(qs.id)::int,
      COALESCE(SUM(qs.total), 0)::int,
      COALESCE(SUM(qs.score), 0)::int,
      CASE WHEN COALESCE(SUM(qs.total), 0) > 0
        THEN ROUND(COALESCE(SUM(qs.score), 0)::numeric / COALESCE(SUM(qs.total), 0)::numeric * 100, 1)
        ELSE 0::numeric
      END,
      MAX(qs.completed_at),
      up.created_at
    FROM public.user_profiles up
    LEFT JOIN auth.users au ON au.id = up.id
    LEFT JOIN public.quiz_sessions qs ON qs.user_id = up.id
    WHERE up.is_admin = false
    GROUP BY up.id, up.display_name, au.email, up.created_at
    ORDER BY MAX(qs.completed_at) DESC NULLS LAST;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- RPC: admin_most_missed  — globally hardest questions
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_most_missed(p_limit int DEFAULT 15)
RETURNS TABLE(
  question_id    text,
  subject        text,
  total_attempts bigint,
  correct_count  bigint,
  accuracy       numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT
      qp.question_id,
      qp.subject,
      SUM(qp.correct_count + qp.incorrect_count) AS total_attempts,
      SUM(qp.correct_count)                       AS correct_count,
      CASE WHEN SUM(qp.correct_count + qp.incorrect_count) > 0
        THEN ROUND(SUM(qp.correct_count)::numeric /
                   SUM(qp.correct_count + qp.incorrect_count)::numeric * 100, 1)
        ELSE 0::numeric
      END AS accuracy
    FROM public.question_performance qp
    GROUP BY qp.question_id, qp.subject
    HAVING SUM(qp.correct_count + qp.incorrect_count) >= 2
    ORDER BY accuracy ASC
    LIMIT p_limit;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- RPC: admin_daily_activity  — quiz volume by day (last 30 days)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_daily_activity()
RETURNS TABLE(day date, quizzes bigint, questions bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT
      (completed_at AT TIME ZONE 'UTC')::date AS day,
      COUNT(*)::bigint                         AS quizzes,
      COALESCE(SUM(total), 0)::bigint          AS questions
    FROM public.quiz_sessions
    WHERE completed_at >= now() - interval '30 days'
    GROUP BY 1
    ORDER BY 1 DESC;
END;
$$;

-- Grant execute to authenticated users (functions check admin status internally)
GRANT EXECUTE ON FUNCTION public.admin_overview()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_stats()          TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_most_missed(int)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_daily_activity()      TO authenticated;

-- Keep API privileges explicit after admin migration too.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_daily_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.answer_history TO authenticated;
GRANT SELECT, INSERT ON TABLE public.quiz_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.question_performance TO authenticated;
GRANT SELECT ON TABLE public.learning_leaderboard_all_time TO anon, authenticated;
GRANT SELECT ON TABLE public.learning_leaderboard_weekly TO anon, authenticated;
GRANT SELECT ON TABLE public.learning_leaderboard_monthly TO anon, authenticated;
