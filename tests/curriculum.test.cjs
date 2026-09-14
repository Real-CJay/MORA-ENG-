const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const fixture=require('./curriculum-fixture.cjs');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function environment(storage=new Map()){
  const events={},c={SUBJECTS:fixture.subjects(),setTimeout,clearTimeout,navigator:{onLine:true},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener:(n,f)=>events[n]=f};
  c.window=c;vm.createContext(c);
  vm.runInContext(read('js/curriculum_registry.js')+'\n'+read('js/curriculum_module_adapter.js'),c);
  let reply=fixture.snapshot(),account=0,nav=0,busy=false,rpc=async()=>({data:reply});
  const options={project:'synthetic-project',rpc:(...args)=>rpc(...args),accountGeneration:()=>account,navigationGeneration:()=>nav,isBusy:()=>busy};
  return {c,api:c.MoraCurriculum,storage,options,events,setReply:v=>reply=v,setRpc:v=>rpc=v,account:()=>account++,navigate:()=>nav++,busy:v=>busy=v};
}
test('published placements share original subject/answer identity; streams and unavailable modules',async()=>{
  const e=environment(),q=e.c.SUBJECTS.math.pastUnit;
  await e.api.initialize(e.options);
  const selected=e.c.resolveModuleSelection({semesterId:'sem2',departmentId:'mechanical',streamId:'mechatronics',moduleKey:'math'});
  assert.equal(selected.subjectEntry,e.c.SUBJECTS.math);assert.equal(selected.dataKey,'math');
  assert.equal(e.c.getModules('sem2','mechanical','mechatronics')[0].pastUnit,q);
  assert.equal(e.c.getModules('sem2','mechanical').length,0);
  assert.equal(e.c.resolveModuleSelection({semesterId:'sem2',departmentId:'civil',streamId:'mechatronics',moduleKey:'math'}),null);
  assert.equal(e.c.getStreams('sem2','mechanical').length,1);
  assert.equal(e.c.getModules('sem1').find(m=>m.key==='empty').available,false);
  assert.equal(e.api.isModuleAvailable('empty'),false);
  assert.equal(e.c.SUBJECTS.math.semesterId,'sem1');
  const reordered=fixture.snapshot(2);
  reordered.placements.find(p=>p.module_id==='math'&&p.semester_id==='sem1').sort_order=-1;
  e.setReply(reordered);await e.api.refresh();
  assert.equal(e.c.getModules('sem1')[0].key,'math');
});
test('public cache survives outage, corrupt cache falls back, empty snapshots remain empty',async()=>{
  const store=new Map(),e=environment(store);await e.api.initialize(e.options);
  const offline=environment(store);offline.setRpc(async()=>({error:{message:'offline'}}));await offline.api.initialize(offline.options);
  assert.equal(offline.api.getStatus().source,'cache');assert.equal(offline.c.getSemesters().length,2);
  const empty=fixture.snapshot(2);for(const name of ['semesters','departments','streams','modules','placements'])empty[name]=[];
  e.setReply(empty);await e.api.refresh();assert.equal(e.c.getSemesters().length,0);assert.equal(e.api.isModuleAvailable('math'),false);
  const restart=environment(store);restart.setRpc(async()=>{throw Error('offline');});await restart.api.initialize(restart.options);
  assert.equal(restart.c.getModules('sem1').length,0);
  store.set('mora_curriculum_v1:synthetic-project','corrupt');const corrupt=environment(store);corrupt.setRpc(async()=>({error:{}}));await corrupt.api.initialize(corrupt.options);
  assert.equal(corrupt.api.getStatus().source,'bundled');assert.equal(corrupt.c.getModules('sem1').length,4);
});
test('drafts, malicious styles, duplicate placements and broken parents cannot enter cache',async()=>{
  const e=environment();await e.api.initialize(e.options);const saved=e.storage.values().next().value;
  for(const mutate of [s=>s.visibility='admin',s=>s.modules[0].status='draft',s=>s.modules[0].color='red; bad',s=>s.modules[0].icon='<svg onload=bad>',s=>s.placements.push({...s.placements[0],id:'duplicate'}),s=>s.streams[0].department_id='missing']){
    const bad=fixture.snapshot(2);mutate(bad);e.setReply(bad);await e.api.refresh();
    assert.equal(e.api.getStatus().revision,1);assert.equal(e.storage.values().next().value,saved);
  }
});
test('stale requests and account/navigation changes cannot replace current catalog',async()=>{
  const e=environment();await e.api.initialize(e.options);
  let release;e.setRpc(()=>new Promise(r=>release=r));let pending=e.api.refresh();
  e.setReply(fixture.snapshot(3));e.setRpc(async()=>({data:fixture.snapshot(3)}));await e.api.refresh();
  release({data:fixture.snapshot(2)});await pending;assert.equal(e.api.getStatus().revision,3);
  for(const invalidate of [()=>{e.account();e.api.invalidate();},()=>e.navigate()]){
    e.setRpc(()=>new Promise(r=>release=r));pending=e.api.refresh();invalidate();release({data:fixture.snapshot(4)});await pending;
    assert.equal(e.api.getStatus().revision,3);
  }
});
test('refresh during an attempt is deferred; admin data never becomes a public cache',async()=>{
  const e=environment();await e.api.initialize(e.options);e.busy(true);
  const next=fixture.snapshot(2);next.placements=next.placements.filter(p=>p.module_id!=='math');e.setReply(next);await e.api.refresh();
  assert.equal(e.api.isModuleAvailable('math'),true);e.busy(false);e.api.applyPending();assert.equal(e.api.isModuleAvailable('math'),false);
  const saved=e.storage.values().next().value;
  e.setRpc(async(name,args)=>({data:{...fixture.snapshot(3),visibility:args.p_admin?'admin':'published'}}));
  assert.equal((await e.api.adminSnapshot()).visibility,'admin');assert.equal(e.storage.values().next().value,saved);
  e.c.navigator.onLine=false;await assert.rejects(e.api.write('modules','archive','math',{},2),/OFFLINE/);
  e.c.navigator.onLine=true;e.setRpc(async()=>({error:{message:'CATALOG_CONFLICT'}}));await assert.rejects(e.api.write('modules','archive','math',{},2),/CONFLICT/);
});
test('old and new curriculum URLs resolve through actual placement adapter',async()=>{
  const e=environment();await e.api.initialize(e.options);
  const app=read('quiz_app.js');
  const section=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b,app.indexOf(a)));
  vm.runInContext(section('function curriculumPathForSelection(','function curriculumRouteForSubject(')+section('function resolveCurriculumRoute(','function applyRoute('),e.c);
  assert.equal(e.c.curriculumPathForSelection('sem1',null,'math'),'/semester/sem1/math');
  const url=e.c.curriculumPathForSelection('sem2','mechanical','math','mechatronics');
  assert.equal(e.c.resolveCurriculumRoute(url.split('/').filter(Boolean)).dataKey,'math');
  assert.equal(e.c.resolveCurriculumRoute(['semester','sem2','civil','mechatronics','math']).ok,false);
  assert.ok(app.indexOf('await window.MoraCurriculum.initialize')<app.lastIndexOf('initRouter();'));
  const loaded=[];
  Object.assign(e.c,{state:{currentSubject:'materials',questions:[]},location:{pathname:'/'},
    setupRouteDefaults:()=>{},renderApp:()=>{},isSyntheticDevSubject:()=>false,
    loadCurrentSubjectHistory:async()=>loaded.push(e.c.state.currentSubject),reportSaveFailure:()=>{},
    dbLoadFlags:async()=>{},dbLoadPerformance:async()=>{}});
  vm.runInContext(section('function applyRoute(','function confirmLeaveActiveQuiz()')
    +section('function backToCurriculumModules()','function openCurriculumModule('),e.c);
  e.c.applyRoute(url,null);
  assert.equal(e.c.state.screen,'subjectHome');assert.equal(loaded.at(-1),'math');
  e.c.writeCurriculumRootState=()=>{};e.c.backToCurriculumModules();
  assert.equal(e.c.state.curriculumStream,'mechatronics');
  e.c.applyRoute('/',{screen:'curriculumModules',curriculumSemester:'sem2',curriculumDepartment:'mechanical',curriculumStream:'mechatronics',subject:'math'});
  assert.equal(e.c.state.screen,'curriculumModules');assert.equal(e.c.state.curriculumStream,'mechatronics');
  e.c.applyRoute('/semester/sem1/fluid',null);assert.equal(loaded.at(-1),'fluid');
  const archived=fixture.snapshot(2);archived.placements=archived.placements.filter(p=>p.module_id!=='math');
  e.setReply(archived);await e.api.refresh();
  e.c.applyRoute('/subjects/math/target',null);assert.equal(e.c.state.screen,'landing');
  assert.match(e.c.state.curriculumError,/unavailable/);
});
