-- Public rankings are an intentional, opt-in aggregate disclosure.
-- Keep raw sessions under existing RLS; never expose mora_private through PostgREST.
begin;
do $migration$
declare name text;
begin
 foreach name in array array['learning_leaderboard_all_time','learning_leaderboard_weekly',
 'learning_leaderboard_monthly','learning_pastpaper_leaderboard_all_time',
 'learning_pastpaper_leaderboard_weekly','learning_pastpaper_leaderboard_monthly']
 loop
  -- Moving the reviewed view retains its filters and column types exactly.
  execute format('alter view public.%I set schema mora_private',name);
  execute format('revoke all on mora_private.%I from public,anon,authenticated',name);
  execute format('create function mora_private.%I() returns setof mora_private.%I language sql stable security definer set search_path = %L as %L',
    name||'_rows',name,'',format('select * from mora_private.%I',name));
  execute format('revoke all on function mora_private.%I() from public',name||'_rows');
  execute format('grant execute on function mora_private.%I() to anon,authenticated,service_role',name||'_rows');
  execute format('create view public.%I with (security_invoker=true) as select * from mora_private.%I()',name,name||'_rows');
  execute format('revoke all on public.%I from public,anon,authenticated',name);
  execute format('grant select on public.%I to anon,authenticated,service_role',name);
 end loop;
end $migration$;
notify pgrst,'reload schema';
commit;
