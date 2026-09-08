-- Additive repair. Requires existing quiz tables and Stage 3.04a hardening.
-- Version matches the live migration receipt returned by Supabase MCP.
-- Apply to an isolated database first; never replay historical setup scripts after it.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
create schema if not exists mora_private;
revoke all on schema mora_private from public, anon, authenticated;
grant usage on schema mora_private to authenticated, service_role;

alter table public.answer_history add column if not exists answer_format text;

create table mora_private.progress_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  operation jsonb not null,
  received_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);
alter table mora_private.progress_receipts enable row level security;
revoke all on mora_private.progress_receipts from public, anon, authenticated;

create function mora_private.save_progress_operation(operation jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  receipt_id uuid := (operation->>'operationId')::uuid;
  happened_at timestamptz := (operation->>'occurredAt')::timestamptz;
  p jsonb := operation->'payload';
  inserted_id uuid;
  previous jsonb;
  changed integer;
begin
  if owner_id is null or owner_id is distinct from (operation->>'userId')::uuid then
    raise exception 'Progress owner mismatch' using errcode = '42501';
  end if;
  if receipt_id is null or happened_at is null or happened_at > now() + interval '5 minutes'
     or octet_length(operation::text) > 65536
     or jsonb_typeof(p) is distinct from 'object'
     or coalesce(length(p->>'subject'), 0) not between 1 and 100 then
    raise exception 'Invalid progress operation' using errcode = '22023';
  end if;
  insert into mora_private.progress_receipts(user_id, operation_id, operation)
    values(owner_id, receipt_id, operation)
    on conflict do nothing returning operation_id into inserted_id;
  if inserted_id is null then
    select r.operation into previous from mora_private.progress_receipts r
      where r.user_id = owner_id and r.operation_id = receipt_id;
    if previous is distinct from operation then
      raise exception 'Receipt reused for different data' using errcode = '22023';
    end if;
    return jsonb_build_object('operationId', receipt_id, 'duplicate', true);
  end if;

  if operation->>'type' = 'answer' then
    if coalesce(length(p->>'questionId'), 0) not between 1 and 200
       or coalesce(p->>'selected', '') !~ '^[0-9]{1,2}$'
       or jsonb_typeof(p->'correct') is distinct from 'boolean'
       or (p->>'answerFormat' is distinct from 'canonical-v1' and not coalesce((p->>'imported')::boolean, false)) then
      raise exception 'Invalid answer operation' using errcode = '22023';
    end if;
    insert into public.answer_history(user_id, subject, question_id, selected, correct, answered_at, answer_format)
      values(owner_id, p->>'subject', p->>'questionId', (p->>'selected')::integer, (p->>'correct')::boolean, happened_at, p->>'answerFormat')
      on conflict(user_id, subject, question_id) do update set
        selected = excluded.selected, correct = excluded.correct,
        answered_at = excluded.answered_at, answer_format = excluded.answer_format
      where public.answer_history.answered_at < excluded.answered_at;
    get diagnostics changed = row_count;
    if changed > 0 or not coalesce((p->>'imported')::boolean, false) then
      insert into public.question_performance(user_id, subject, question_id, correct_count, incorrect_count)
        values(owner_id, p->>'subject', p->>'questionId',
          case when (p->>'correct')::boolean then 1 else 0 end,
          case when (p->>'correct')::boolean then 0 else 1 end)
        on conflict(user_id, question_id) do update set
          correct_count = public.question_performance.correct_count + excluded.correct_count,
          incorrect_count = public.question_performance.incorrect_count + excluded.incorrect_count;
    end if;
  elsif operation->>'type' = 'session' then
    if coalesce(p->>'score', '') !~ '^[0-9]+$' or coalesce(p->>'total', '') !~ '^[0-9]+$'
       or coalesce(p->>'timeTaken', '') !~ '^[0-9]+$' or coalesce(p->>'countdownLimit', '') !~ '^[0-9]+$'
       or (p->>'total')::integer not between 1 and 10000
       or (p->>'score')::integer not between 0 and (p->>'total')::integer
       or (p->>'timeTaken')::integer not between 0 and 86400
       or (p->>'countdownLimit')::integer not between 0 and 86400
       or coalesce(length(p->>'appMode'), 0) not between 1 and 50 then
      raise exception 'Invalid session operation' using errcode = '22023';
    end if;
    insert into public.quiz_sessions(user_id, subject, app_mode, score, total, time_taken, countdown_limit, completed_at)
      values(owner_id, p->>'subject', p->>'appMode', (p->>'score')::integer, (p->>'total')::integer,
        (p->>'timeTaken')::integer, (p->>'countdownLimit')::integer, happened_at);
  else
    raise exception 'Unknown operation type' using errcode = '22023';
  end if;
  return jsonb_build_object('operationId', receipt_id, 'duplicate', false);
end $$;
revoke all on function mora_private.save_progress_operation(jsonb) from public, anon, authenticated;
grant execute on function mora_private.save_progress_operation(jsonb) to authenticated;

create function public.save_progress_operation(operation jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select mora_private.save_progress_operation(operation);
$$;
revoke all on function public.save_progress_operation(jsonb) from public, anon;
grant execute on function public.save_progress_operation(jsonb) to authenticated;

create table mora_private.rate_limits (
  key_hash text primary key,
  window_start timestamptz not null,
  request_count integer not null
);
alter table mora_private.rate_limits enable row level security;
create index rate_limits_expiry on mora_private.rate_limits(window_start);
revoke all on mora_private.rate_limits from public, anon, authenticated;
create function mora_private.consume_rate_limit(bucket_key text, window_ms integer, max_requests integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  bucket mora_private.rate_limits;
  current_time_at timestamptz := clock_timestamp();
begin
  if bucket_key !~ '^(user|ip):[a-f0-9]{64}$' or window_ms not between 1000 and 86400000 or max_requests not between 1 and 100000 then
    raise exception 'Invalid rate limit input';
  end if;
  delete from mora_private.rate_limits where key_hash in (
    select key_hash from mora_private.rate_limits
    where window_start < current_time_at - interval '2 days' limit 100
  );
  insert into mora_private.rate_limits as existing(key_hash, window_start, request_count)
    values(bucket_key, current_time_at, 1)
    on conflict(key_hash) do update set
      window_start = case when existing.window_start + window_ms * interval '1 millisecond' <= current_time_at then current_time_at else existing.window_start end,
      request_count = case when existing.window_start + window_ms * interval '1 millisecond' <= current_time_at then 1 else least(existing.request_count + 1, max_requests + 1) end
    returning * into bucket;
  return jsonb_build_object('limited', bucket.request_count > max_requests,
    'limit', max_requests, 'remaining', greatest(0, max_requests - bucket.request_count),
    'resetAt', extract(epoch from bucket.window_start) * 1000 + window_ms);
end $$;
revoke all on function mora_private.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function mora_private.consume_rate_limit(text, integer, integer) to service_role;
create function public.consume_rate_limit(bucket_key text, window_ms integer, max_requests integer)
returns jsonb language sql security invoker set search_path = '' as $$
  select mora_private.consume_rate_limit(bucket_key, window_ms, max_requests);
$$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
commit;
