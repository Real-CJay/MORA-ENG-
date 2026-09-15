const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('legacy permission repair preserves rankings, admin checks and triggers',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role;
   create schema auth;create schema mora_private;
   grant usage on schema auth,mora_private to anon,authenticated,service_role;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
   create table public.user_profiles(id uuid primary key,display_name text,is_admin boolean default false,
    leaderboard_visible boolean default true,public_profile boolean default true,created_at timestamptz default now(),
    avatar_style text,avatar_icon text,avatar_color text,avatar_bg text,avatar_url text);
   create table public.profiles(id uuid,display_name text);
   create table public.quiz_sessions(id serial,user_id uuid,total int,score int,time_taken int,app_mode text,completed_at timestamptz default now());
   create table public.question_performance(question_id text,subject text,correct_count int,incorrect_count int);
   create table public.user_daily_activity(user_id uuid,activity_date date,quizzes_completed int,questions_answered int,
    correct_answers int,study_time int,updated_at timestamptz,primary key(user_id,activity_date));
   create table public.app_settings(key text primary key,value jsonb);
   grant select on public.app_settings to anon,authenticated;
   alter table public.app_settings enable row level security;
   create policy settings_read on public.app_settings for select using(true);
   alter table public.quiz_sessions enable row level security;
   grant select,insert on public.quiz_sessions to authenticated;
   grant usage on sequence public.quiz_sessions_id_seq to authenticated;
   create policy own_sessions on public.quiz_sessions to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
   alter table public.user_profiles enable row level security;
   grant select on public.user_profiles to authenticated;
   create policy own_profile on public.user_profiles to authenticated using(id=auth.uid());`);
  await db.exec(read('tests/legacy-functions-fixture.sql'));
  // Reviewed historical view definitions, not real content or user data.
  const historical=read('supabase_leaderboard_modes.sql');
  await db.exec(historical.slice(historical.indexOf('create view public.learning_leaderboard_all_time')));
  await db.exec(`create trigger signup_profile after insert on auth.users for each row execute function public.ensure_user_profile();
   create trigger signup_legacy after insert on auth.users for each row execute function public.handle_new_user();
   create trigger activity after insert on public.quiz_sessions for each row execute function public.record_quiz_daily_activity();
   create trigger touched before update on public.user_daily_activity for each row execute function public.touch_updated_at();`);
  for(let i=1;i<=3;i++) await db.query("insert into auth.users values($1,$2,'{}')",[`00000000-0000-0000-0000-00000000000${i}`,`synthetic${i}@example.invalid`]);
  await db.exec(`update public.user_profiles set is_admin=true where id::text like '%1';
   update public.user_profiles set public_profile=false where id::text like '%2';
   update public.user_profiles set leaderboard_visible=false where id::text like '%3';
   insert into public.quiz_sessions(user_id,total,score,time_taken,app_mode,completed_at)
   select id,10,7,60,mode,now()-age from public.user_profiles cross join(values('pastpaper'),('target'),('full')) m(mode)
   cross join(values(interval '1 day'),(interval '10 days'),(interval '40 days')) t(age);`);
  const views=['learning_leaderboard','learning_pastpaper_leaderboard'].flatMap(n=>['all_time','weekly','monthly'].map(p=>`${n}_${p}`));
  const before=[];
  for(const v of views) before.push((await db.query(`select * from public.${v} order by user_id`)).rows);
  for(const suffix of ['legacy_function_permissions','public_leaderboard_boundary']){
   const file=fs.readdirSync(path.join(__dirname,'../supabase/migrations')).find(n=>n.endsWith(`_${suffix}.sql`));
   await db.exec(read('supabase/migrations/'+file));
  }
  for(const role of ['anon','authenticated']){
   await db.exec('set role '+role);
   await db.query("select set_config('request.jwt.claim.sub',$1,false)",['00000000-0000-0000-0000-000000000002']);
   for(let i=0;i<views.length;i++){
    assert.deepEqual((await db.query(`select * from public.${views[i]} order by user_id`)).rows,before[i]);
    assert.equal(before[i].length,2,'opted-out user excluded; private profile opt-in retained');
    await assert.rejects(db.query(`select * from mora_private.${views[i]}`),/permission denied/);
   }
   for(const fn of ['admin_daily_activity','admin_most_missed','admin_overview','admin_user_stats'])
    await assert.rejects(db.query(`select * from public.${fn}()`),/permission denied|Unauthorized/);
   const perms=await db.query(`select bool_or(has_function_privilege(current_user,p.oid,'execute')) as allowed
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and p.proname in('touch_updated_at','handle_new_user','ensure_user_profile','record_quiz_daily_activity','rls_auto_enable')`);
   assert.equal(perms.rows[0].allowed,false);
   if(role==='anon') await assert.rejects(db.query('select * from public.quiz_sessions'),/permission denied/);
   else assert.equal((await db.query('select count(*)::int as n from public.quiz_sessions')).rows[0].n,9);
   await db.exec('reset role');
  }
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",['00000000-0000-0000-0000-000000000001']);
  for(const fn of ['admin_daily_activity','admin_most_missed','admin_overview','admin_user_stats']) await db.query(`select * from public.${fn}()`);
  await db.exec(`insert into public.quiz_sessions(user_id,total,score,time_taken,app_mode) values(auth.uid(),2,1,3,'target');reset role;`);
  await db.exec(`insert into auth.users values('00000000-0000-0000-0000-000000000004','new@example.invalid','{}');`);
  assert.equal((await db.query('select count(*)::int as n from public.profiles')).rows[0].n,4);
  assert.equal((await db.query('select sum(quizzes_completed)::int as n from public.user_daily_activity')).rows[0].n,28);
  assert.equal((await db.query("select count(*)::int as n from pg_views where schemaname='public' and viewname like 'learning%'")).rows[0].n,6);
 } finally {await db.close();}
});
