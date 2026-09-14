-- Stage 11 additive curriculum. No progress changes. Apply only with authorization.
begin;
create schema if not exists mora_private;
revoke all on schema mora_private from public;
grant usage on schema mora_private to anon,authenticated;
create function mora_private.curriculum_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.user_profiles where id=auth.uid() and is_admin=true)
$$;
revoke all on function mora_private.curriculum_is_admin() from public;
grant execute on function mora_private.curriculum_is_admin() to anon,authenticated;
create table public.curriculum_revision(singleton boolean primary key default true check(singleton),revision bigint not null default 1 check(revision>0));
insert into public.curriculum_revision values(true,1);
alter table public.curriculum_revision enable row level security;
revoke all on public.curriculum_revision from public,anon,authenticated;
grant select on public.curriculum_revision to anon,authenticated;
create policy catalog_revision_read on public.curriculum_revision for select to anon,authenticated using(true);
create table public.curriculum_semesters (id text primary key check (id ~ '^[a-z][a-z0-9_-]{0,63}$'), label text not null check (length(btrim(label)) between 1 and 160), status text not null default 'draft' check (status in ('draft','published','archived')), sort_order integer not null default 0, kind text not null default 'common' check (kind in ('common','departmental')));
alter table public.curriculum_semesters enable row level security;
revoke all on public.curriculum_semesters from public,anon,authenticated;
grant select on public.curriculum_semesters to anon,authenticated;
create policy published_read on public.curriculum_semesters for select to anon,authenticated using((status = 'published') or (select mora_private.curriculum_is_admin()));
create table public.curriculum_departments (id text primary key check (id ~ '^[a-z][a-z0-9_-]{0,63}$'), label text not null check (length(btrim(label)) between 1 and 160), status text not null default 'draft' check (status in ('draft','published','archived')), sort_order integer not null default 0, semester_id text not null references public.curriculum_semesters(id), unique(id,semester_id));
alter table public.curriculum_departments enable row level security;
revoke all on public.curriculum_departments from public,anon,authenticated;
grant select on public.curriculum_departments to anon,authenticated;
create policy published_read on public.curriculum_departments for select to anon,authenticated using((status = 'published' and exists(select 1 from public.curriculum_semesters s where s.id = semester_id and s.status = 'published')) or (select mora_private.curriculum_is_admin()));
create table public.curriculum_streams (id text primary key check (id ~ '^[a-z][a-z0-9_-]{0,63}$'), label text not null check (length(btrim(label)) between 1 and 160), status text not null default 'draft' check (status in ('draft','published','archived')), sort_order integer not null default 0, department_id text not null references public.curriculum_departments(id), unique(id,department_id));
alter table public.curriculum_streams enable row level security;
revoke all on public.curriculum_streams from public,anon,authenticated;
grant select on public.curriculum_streams to anon,authenticated;
create policy published_read on public.curriculum_streams for select to anon,authenticated using((status = 'published' and exists(select 1 from public.curriculum_departments d join public.curriculum_semesters s on s.id=d.semester_id where d.id=department_id and d.status='published' and s.status='published')) or (select mora_private.curriculum_is_admin()));
create table public.curriculum_modules (id text primary key check (id ~ '^[a-z][a-z0-9_-]{0,63}$'), label text not null check (length(btrim(label)) between 1 and 160), status text not null default 'draft' check (status in ('draft','published','archived')), sort_order integer not null default 0, description text not null default '' check(length(description)<=2000), color text not null default '#6c8bef' check(color ~ '^#[0-9a-fA-F]{6}$'), icon text not null default 'book' check(icon in ('book','calculator','gear','flask')), content_kind text not null default 'none' check(content_kind='none' or (content_kind='bundled' and id in ('materials','mechanics','fluid','math'))));
alter table public.curriculum_modules enable row level security;
revoke all on public.curriculum_modules from public,anon,authenticated;
grant select on public.curriculum_modules to anon,authenticated;
create policy published_read on public.curriculum_modules for select to anon,authenticated using((status = 'published') or (select mora_private.curriculum_is_admin()));
create table public.curriculum_placements (id text primary key check (id ~ '^[a-z][a-z0-9_-]{0,63}$'), module_id text not null references public.curriculum_modules(id), semester_id text not null references public.curriculum_semesters(id), department_id text, stream_id text, status text not null default 'draft' check(status in ('draft','published','archived')), sort_order integer not null default 0, foreign key(department_id,semester_id) references public.curriculum_departments(id,semester_id), foreign key(stream_id,department_id) references public.curriculum_streams(id,department_id), check(stream_id is null or department_id is not null));
alter table public.curriculum_placements enable row level security;
revoke all on public.curriculum_placements from public,anon,authenticated;
grant select on public.curriculum_placements to anon,authenticated;
create policy published_read on public.curriculum_placements for select to anon,authenticated using((status='published' and exists(select 1 from public.curriculum_modules m where m.id=module_id and m.status='published') and exists(select 1 from public.curriculum_semesters s where s.id=semester_id and s.status='published') and (department_id is null or exists(select 1 from public.curriculum_departments d where d.id=department_id and d.status='published')) and (stream_id is null or exists(select 1 from public.curriculum_streams t where t.id=stream_id and t.status='published'))) or (select mora_private.curriculum_is_admin()));
create unique index curriculum_placement_unique on public.curriculum_placements(module_id,semester_id,coalesce(department_id,''),coalesce(stream_id,''));
create index curriculum_department_parent on public.curriculum_departments(semester_id);
create index curriculum_stream_parent on public.curriculum_streams(department_id);
create index curriculum_placement_semester on public.curriculum_placements(semester_id);
create index curriculum_placement_department on public.curriculum_placements(department_id);
create index curriculum_placement_stream on public.curriculum_placements(stream_id);

-- Stable invoker: all arrays share one transaction snapshot; published is explicit even for admins.
create function public.curriculum_snapshot(p_admin boolean default false) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if p_admin is null then raise exception 'INVALID_CATALOG_VISIBILITY'; end if;
 if p_admin and not mora_private.curriculum_is_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 return jsonb_build_object('schemaVersion',1,'visibility',case when p_admin then 'admin' else 'published' end,'revision',(select revision from public.curriculum_revision),
 'semesters',coalesce((select jsonb_agg(to_jsonb(c) order by sort_order,id) from public.curriculum_semesters c where p_admin or (status = 'published')),'[]'::jsonb),
 'departments',coalesce((select jsonb_agg(to_jsonb(c) order by sort_order,id) from public.curriculum_departments c where p_admin or (status = 'published' and exists(select 1 from public.curriculum_semesters s where s.id = semester_id and s.status = 'published'))),'[]'::jsonb),
 'streams',coalesce((select jsonb_agg(to_jsonb(c) order by sort_order,id) from public.curriculum_streams c where p_admin or (status = 'published' and exists(select 1 from public.curriculum_departments d join public.curriculum_semesters s on s.id=d.semester_id where d.id=department_id and d.status='published' and s.status='published'))),'[]'::jsonb),
 'modules',coalesce((select jsonb_agg(to_jsonb(c) order by sort_order,id) from public.curriculum_modules c where p_admin or (status = 'published')),'[]'::jsonb),
 'placements',coalesce((select jsonb_agg(to_jsonb(c) order by sort_order,id) from public.curriculum_placements c where p_admin or (status='published' and exists(select 1 from public.curriculum_modules m where m.id=module_id and m.status='published') and exists(select 1 from public.curriculum_semesters s where s.id=semester_id and s.status='published') and (department_id is null or exists(select 1 from public.curriculum_departments d where d.id=department_id and d.status='published')) and (stream_id is null or exists(select 1 from public.curriculum_streams t where t.id=stream_id and t.status='published')))),'[]'::jsonb)
 );
end $$;
revoke all on function public.curriculum_snapshot(boolean) from public;
grant execute on function public.curriculum_snapshot(boolean) to anon,authenticated;
-- No direct client mutations: private helper checks admin and serializes all writes.
create function mora_private.curriculum_write(p_entity text,p_action text,p_id text,p_patch jsonb,p_revision bigint) returns bigint
language plpgsql security definer set search_path='' as $$
declare current_revision bigint; old_row jsonb; next_row jsonb; allowed text[]; target text;
begin
 if not mora_private.curriculum_is_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 if p_entity is null or p_entity not in ('semesters','departments','streams','modules','placements') or p_action is null or p_action not in ('create','update','archive') or p_id is null or p_id !~ '^[a-z][a-z0-9_-]{0,63}$' or jsonb_typeof(p_patch) is distinct from 'object' then raise exception 'INVALID_CATALOG_WRITE'; end if;
 select revision into current_revision from public.curriculum_revision where singleton for update;
 if p_revision is distinct from current_revision then raise exception 'CATALOG_CONFLICT' using errcode='40001'; end if;
 target:='curriculum_'||p_entity;
 execute format('select to_jsonb(c) from public.%I c where id=$1',target) into old_row using p_id;
 if p_action='create' and old_row is not null then raise exception 'CATALOG_ID_EXISTS'; end if;
 if p_action<>'create' and old_row is null then raise exception 'CATALOG_NOT_FOUND'; end if;
 case p_entity
 when 'semesters' then allowed:=array['label','status','sort_order','kind']; next_row:=coalesce(old_row,'{"label":"","status":"draft","sort_order":0,"kind":"common"}'::jsonb);
 when 'departments' then allowed:=array['label','status','sort_order','semester_id']; next_row:=coalesce(old_row,'{"label":"","status":"draft","sort_order":0}'::jsonb);
 when 'streams' then allowed:=array['label','status','sort_order','department_id']; next_row:=coalesce(old_row,'{"label":"","status":"draft","sort_order":0}'::jsonb);
 when 'modules' then allowed:=array['label','status','sort_order','description','color','icon','content_kind']; next_row:=coalesce(old_row,'{"label":"","status":"draft","sort_order":0,"description":"","color":"#6c8bef","icon":"book","content_kind":"none"}'::jsonb);
 when 'placements' then allowed:=array['module_id','semester_id','department_id','stream_id','status','sort_order']; next_row:=coalesce(old_row,'{"department_id":null,"stream_id":null,"status":"draft","sort_order":0}'::jsonb);
 end case;
 if exists(select 1 from jsonb_object_keys(p_patch) k where not (k=any(allowed))) then raise exception 'UNKNOWN_OR_IMMUTABLE_FIELD'; end if;
 next_row:=next_row||p_patch||jsonb_build_object('id',p_id);
 if p_action='archive' then next_row:=next_row||'{"status":"archived"}'::jsonb; end if;
 if p_entity='departments' and not exists(select 1 from public.curriculum_semesters where id=next_row->>'semester_id' and kind='departmental') then raise exception 'INVALID_DEPARTMENT_PARENT'; end if;
 if p_entity='semesters' and next_row->>'kind'='common' and exists(select 1 from public.curriculum_departments where semester_id=p_id) then raise exception 'SEMESTER_HAS_DEPARTMENTS'; end if;
 if next_row->>'status'='published' then
  if p_entity in ('departments','placements') and not exists(select 1 from public.curriculum_semesters where id=next_row->>'semester_id' and status='published') then raise exception 'PARENT_NOT_PUBLISHED'; end if;
  if p_entity='streams' and not exists(select 1 from public.curriculum_departments d join public.curriculum_semesters s on s.id=d.semester_id where d.id=next_row->>'department_id' and d.status='published' and s.status='published') then raise exception 'PARENT_NOT_PUBLISHED'; end if;
  if p_entity='placements' then
   if not exists(select 1 from public.curriculum_modules where id=next_row->>'module_id' and status='published') then raise exception 'MODULE_NOT_PUBLISHED'; end if;
   if next_row->>'department_id' is not null and not exists(select 1 from public.curriculum_departments where id=next_row->>'department_id' and status='published') then raise exception 'PARENT_NOT_PUBLISHED'; end if;
   if next_row->>'stream_id' is not null and not exists(select 1 from public.curriculum_streams where id=next_row->>'stream_id' and status='published') then raise exception 'PARENT_NOT_PUBLISHED'; end if;
  end if;
 end if;
 case p_entity
 when 'semesters' then
 if p_action='create' then insert into public.curriculum_semesters select * from jsonb_populate_record(null::public.curriculum_semesters,next_row);
 else update public.curriculum_semesters t set (label,status,sort_order,kind)=(select label,status,sort_order,kind from jsonb_populate_record(null::public.curriculum_semesters,next_row)) where t.id=p_id; end if;
 when 'departments' then
 if p_action='create' then insert into public.curriculum_departments select * from jsonb_populate_record(null::public.curriculum_departments,next_row);
 else update public.curriculum_departments t set (label,status,sort_order,semester_id)=(select label,status,sort_order,semester_id from jsonb_populate_record(null::public.curriculum_departments,next_row)) where t.id=p_id; end if;
 when 'streams' then
 if p_action='create' then insert into public.curriculum_streams select * from jsonb_populate_record(null::public.curriculum_streams,next_row);
 else update public.curriculum_streams t set (label,status,sort_order,department_id)=(select label,status,sort_order,department_id from jsonb_populate_record(null::public.curriculum_streams,next_row)) where t.id=p_id; end if;
 when 'modules' then
 if p_action='create' then insert into public.curriculum_modules select * from jsonb_populate_record(null::public.curriculum_modules,next_row);
 else update public.curriculum_modules t set (label,status,sort_order,description,color,icon,content_kind)=(select label,status,sort_order,description,color,icon,content_kind from jsonb_populate_record(null::public.curriculum_modules,next_row)) where t.id=p_id; end if;
 when 'placements' then
 if p_action='create' then insert into public.curriculum_placements select * from jsonb_populate_record(null::public.curriculum_placements,next_row);
 else update public.curriculum_placements t set (module_id,semester_id,department_id,stream_id,status,sort_order)=(select module_id,semester_id,department_id,stream_id,status,sort_order from jsonb_populate_record(null::public.curriculum_placements,next_row)) where t.id=p_id; end if;
 end case;
 update public.curriculum_revision set revision=revision+1 where singleton returning revision into current_revision;
 return current_revision;
end $$;
revoke all on function mora_private.curriculum_write(text,text,text,jsonb,bigint) from public;
grant execute on function mora_private.curriculum_write(text,text,text,jsonb,bigint) to authenticated;
create function public.curriculum_write(p_entity text,p_action text,p_id text,p_patch jsonb,p_revision bigint) returns bigint language sql security invoker set search_path='' as $$ select mora_private.curriculum_write(p_entity,p_action,p_id,p_patch,p_revision) $$;
revoke all on function public.curriculum_write(text,text,text,jsonb,bigint) from public;
grant execute on function public.curriculum_write(text,text,text,jsonb,bigint) to authenticated;

-- Seed registered metadata only; preserve all question/progress identities.
insert into public.curriculum_semesters(id,label,status,kind) values('sem1','Semester 1','published','common');
insert into public.curriculum_modules(id,label,description,color,status,sort_order,content_kind) values('materials','Materials Science','Bonding, crystal structures & mechanical properties','#6c8bef','published',0,'bundled');
insert into public.curriculum_placements(id,module_id,semester_id,status,sort_order) values('sem1_materials','materials','sem1','published',0);
insert into public.curriculum_modules(id,label,description,color,status,sort_order,content_kind) values('mechanics','Mechanics','Statics, dynamics, kinematics & structural mechanics','#4ade80','published',1,'bundled');
insert into public.curriculum_placements(id,module_id,semester_id,status,sort_order) values('sem1_mechanics','mechanics','sem1','published',1);
insert into public.curriculum_modules(id,label,description,color,status,sort_order,content_kind) values('fluid','Fluid Mechanics','Fluid statics, dynamics, viscosity & pipe flow','#38bdf8','published',2,'bundled');
insert into public.curriculum_placements(id,module_id,semester_id,status,sort_order) values('sem1_fluid','fluid','sem1','published',2);
insert into public.curriculum_modules(id,label,description,color,status,sort_order,content_kind) values('math','Mathematics','MA1014 · Real Analysis, ODEs, Riemann Integration, Vectors, Matrices & Complex Numbers','#a78bfa','published',3,'bundled');
insert into public.curriculum_placements(id,module_id,semester_id,status,sort_order) values('sem1_math','math','sem1','published',3);
commit;
