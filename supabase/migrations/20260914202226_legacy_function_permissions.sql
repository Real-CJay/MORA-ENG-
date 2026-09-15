-- Reviewed legacy-function hardening. No user/progress data changes.
begin;
alter function public.touch_updated_at() set search_path='';
alter function public.handle_new_user() set search_path='';
-- Trigger execution remains intact; these are not client RPC endpoints.
revoke execute on function public.touch_updated_at(),public.handle_new_user(),
 public.ensure_user_profile(),public.record_quiz_daily_activity(),public.rls_auto_enable()
 from public,anon,authenticated;
-- Settings already have public SELECT and RLS; no elevated execution is needed.
alter function public.get_leaderboard_modes() security invoker;
alter function public.get_leaderboard_modes() set search_path='';

-- Preserve RPC names, parameters, defaults and results; isolate privileged code.
do $migration$
declare item record; result_type text;
begin
 for item in select * from (values
  ('admin_daily_activity','','',''),
  ('admin_most_missed','integer','p_limit integer default 15','p_limit'),
  ('admin_overview','','',''),
  ('admin_user_stats','','','')
 ) as f(name,identity_args,wrapper_args,call_args)
 loop
  select pg_get_function_result(to_regprocedure(format('public.%I(%s)',item.name,item.identity_args))) into result_type;
  if result_type is null then raise exception 'Missing reviewed function: %',item.name; end if;
  execute format('alter function public.%I(%s) set schema mora_private',item.name,item.identity_args);
  execute format('alter function mora_private.%I(%s) set search_path = %L',item.name,item.identity_args,'');
  execute format('revoke all on function mora_private.%I(%s) from public,anon,authenticated',item.name,item.identity_args);
  execute format('grant execute on function mora_private.%I(%s) to authenticated,service_role',item.name,item.identity_args);
  execute format('create function public.%I(%s) returns %s language sql security invoker set search_path = %L as %L',
   item.name,item.wrapper_args,result_type,'',format('select * from mora_private.%I(%s)',item.name,item.call_args));
  execute format('revoke all on function public.%I(%s) from public,anon',item.name,item.identity_args);
  execute format('grant execute on function public.%I(%s) to authenticated,service_role',item.name,item.identity_args);
 end loop;
end $migration$;
commit;
