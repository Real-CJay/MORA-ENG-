const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const admin='00000000-0000-0000-0000-000000000001', student='00000000-0000-0000-0000-000000000002';
test('curriculum migration: permissions, hierarchy, publication, immutable identities and concurrent edits',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;
      create schema auth;grant usage on schema auth to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table public.user_profiles(id uuid primary key,is_admin boolean not null default false);
      insert into public.user_profiles values('${admin}',true),('${student}',false);
      create table public.answer_history(subject text,question_id text,selected int);
      insert into public.answer_history values('math','synthetic_history',2);`);
    const dir=path.join(__dirname,'../supabase/migrations');
    const migration=fs.readdirSync(dir).find(n=>n.endsWith('_dynamic_curriculum.sql'));
    await db.exec(fs.readFileSync(path.join(dir,migration),'utf8'));
    const role=async(name,id='')=>{await db.exec('set role '+name);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
    const snapshot=async(full=false)=>(await db.query('select public.curriculum_snapshot($1) as catalog',[full])).rows[0].catalog;
    const write=(entity,action,id,patch,rev)=>db.query('select public.curriculum_write($1,$2,$3,$4::jsonb,$5) as revision',[entity,action,id,JSON.stringify(patch),rev]);
    await role('anon');let initial=await snapshot();
    assert.deepEqual(initial.modules.map(m=>m.id),['materials','mechanics','fluid','math']);
    assert.equal(initial.semesters.length,1);assert.equal(initial.placements.length,4);
    await assert.rejects(snapshot(true),/ADMIN_REQUIRED/);
    for(const r of ['anon','authenticated']){
      await role(r,r==='authenticated'?student:'');
      for(const sql of ["insert into public.curriculum_semesters(id,label) values('evil','X')","update public.curriculum_modules set label='X'","delete from public.curriculum_placements","truncate public.curriculum_modules","update public.curriculum_revision set revision=9"])
        await assert.rejects(db.exec(sql),/permission denied/);
      await assert.rejects(write('modules','archive','math',{},1),/permission denied|ADMIN_REQUIRED/);
    }
    await role('authenticated',admin);
    // Admins also cannot bypass the revision-aware write operation.
    await assert.rejects(db.exec("update public.curriculum_modules set label='X'"),/permission denied/);
    let revision=1;
    const change=async(e,a,id,p)=>{const result=await write(e,a,id,p,revision);revision=Number(result.rows[0].revision);};
    await change('semesters','create','sem2',{label:'Synthetic Semester',kind:'departmental'});
    assert.equal((await snapshot()).semesters.length,1);
    assert.equal((await snapshot(true)).semesters.length,2);
    await assert.rejects(change('departments','create','mechanical',{label:'Mechanical',semester_id:'sem2',status:'published'}),/PARENT_NOT_PUBLISHED/);
    assert.equal((await snapshot()).revision,revision);
    await change('semesters','update','sem2',{status:'published'});
    await change('departments','create','mechanical',{label:'Mechanical',semester_id:'sem2',status:'published'});
    await change('streams','create','mechatronics',{label:'Mechatronics',department_id:'mechanical',status:'published'});
    await change('placements','create','shared_math',{module_id:'math',semester_id:'sem2',department_id:'mechanical',stream_id:'mechatronics',status:'published'});
    assert.equal((await snapshot()).modules.filter(m=>m.id==='math').length,1);
    assert.equal((await snapshot()).placements.filter(p=>p.module_id==='math').length,2);
    await assert.rejects(change('placements','create','duplicate',{module_id:'math',semester_id:'sem2',department_id:'mechanical',stream_id:'mechatronics'}),/duplicate key/);
    await assert.rejects(change('placements','create','wrong_parent',{module_id:'math',semester_id:'sem1',department_id:'mechanical',stream_id:'mechatronics'}),/foreign key/);
    await assert.rejects(change('departments','create','bad_common',{label:'X',semester_id:'sem1'}),/INVALID_DEPARTMENT_PARENT/);
    await assert.rejects(change('modules','update','math',{id:'renamed'}),/IMMUTABLE/);
    await assert.rejects(change('modules','create','empty',{label:'Empty',content_kind:'bundled'}),/check constraint/);
    await change('modules','create','empty',{label:'Empty',status:'published'});
    assert.equal((await snapshot()).modules.find(m=>m.id==='empty').content_kind,'none');
    const simultaneous=await Promise.allSettled([write('modules','update','math',{label:'First'},revision),write('modules','update','math',{label:'Second'},revision)]);
    assert.equal(simultaneous.filter(r=>r.status==='fulfilled').length,1);
    assert.match(simultaneous.find(r=>r.status==='rejected').reason.message,/CATALOG_CONFLICT/);
    revision++;
    await change('departments','archive','mechanical',{});
    let publicView=await snapshot();
    assert.equal(publicView.streams.length,0);assert.ok(!publicView.placements.some(p=>p.id==='shared_math'));
    assert.equal((await snapshot(true)).streams.length,1);
    await role('authenticated',student);publicView=await snapshot();
    assert.equal(publicView.departments.length,0);
    assert.equal((await db.query('select * from public.curriculum_streams')).rows.length,0);
    await assert.rejects(snapshot(true),/ADMIN_REQUIRED/);
    await role('postgres');
    assert.deepEqual((await db.query('select * from public.answer_history')).rows,[{subject:'math',question_id:'synthetic_history',selected:2}]);
    // All exposed curriculum tables have RLS; no public definer function exists.
    assert.ok((await db.query("select relrowsecurity from pg_class where relname like 'curriculum_%' and relkind='r'")).rows.every(r=>r.relrowsecurity));
    assert.equal((await db.query("select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like 'curriculum_%' and prosecdef")).rows[0].n,0);
  }finally{await db.close();}
});
