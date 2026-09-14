// curriculum_registry.js - Semester/department/module registry helpers.
// Classic script only. Live quiz behavior still runs through quiz_data.js + quiz_app.js.
(function () {
  'use strict';

  const SEMESTERS = {
    sem1: {
      id: 'sem1',
      label: 'Semester 1',
      type: 'common',
      active: true,
      departments: null
    },

    // Semester 2 and beyond are added later, once real department names are confirmed.
    // Example only - do not add as real data yet:
    // sem2: {
    //   id: 'sem2',
    //   label: 'Semester 2',
    //   type: 'departmental',
    //   active: true,
    //   departments: {
    //     mechanical: { id: 'mechanical', label: 'Mechanical Engineering' },
    //     electrical: { id: 'electrical', label: 'Electrical Engineering' }
    //   }
    // }
  };

  const CURRICULUM_REQUIRED_MODULES = ['materials', 'mechanics', 'fluid', 'math'];

  function subjectRegistry() {
    if (typeof SUBJECTS !== 'undefined') return SUBJECTS;
    return window.SUBJECTS || {};
  }

  function getSemesters() {
    if (catalog) return catalog.semesters.map(s => ({...s, type:s.kind, active:true,
      departments:s.kind==='common'?null:Object.fromEntries(getDepartments(s.id).map(d=>[d.id,d]))}));
    return Object.values(SEMESTERS)
      .map((semester, index) => ({ semester, index }))
      .sort((a, b) => {
        if (Boolean(a.semester.active) !== Boolean(b.semester.active)) {
          return a.semester.active ? -1 : 1;
        }
        return a.index - b.index;
      })
      .map(entry => entry.semester);
  }

  function getDepartments(semesterId) {
    if (catalog) {
      const semester=catalog.semesters.find(s=>s.id===semesterId);
      return !semester || semester.kind==='common' ? null : catalog.departments.filter(d=>d.semester_id===semesterId);
    }
    const semester = SEMESTERS[semesterId];
    if (!semester || semester.type === 'common') return null;
    return Object.values(semester.departments || {});
  }

  function getModules(semesterId, departmentId, streamId) {
    if (catalog) {
      const ids=new Set(catalog.placements.filter(p=>p.semester_id===semesterId
        && (!p.department_id || p.department_id===departmentId)
        && (!p.stream_id || p.stream_id===streamId)).map(p=>p.module_id));
      return [...ids].map(id=>catalog.modules.find(m=>m.id===id)).map(moduleView);
    }
    if (!SEMESTERS[semesterId]) return [];
    return Object.values(subjectRegistry()).filter(subject => {
      if (!subject || subject.semesterId !== semesterId) return false;
      const departmentIds = Array.isArray(subject.departmentIds) ? subject.departmentIds : [];
      return departmentIds.includes('all') || Boolean(departmentId && departmentIds.includes(departmentId));
    });
  }

  function isArchived(semesterId) {
    if (catalog) return !catalog.semesters.some(s=>s.id===semesterId);
    const semester = SEMESTERS[semesterId];
    return Boolean(semester && !semester.active);
  }

  function registryAssert(condition, message) {
    if (!condition) {
      throw new Error(`Curriculum registry assertion failed: ${message}`);
    }
  }

  function runCurriculumRegistryAssertions() {
    const subjects = subjectRegistry();
    registryAssert(!!SEMESTERS.sem1, 'sem1 exists');
    registryAssert(SEMESTERS.sem1.type === 'common', 'sem1 is type common');
    registryAssert(SEMESTERS.sem1.departments === null, 'sem1 departments is null');
    registryAssert(getDepartments('sem1') === null, 'getDepartments("sem1") returns null');
    registryAssert(isArchived('sem1') === false, 'isArchived("sem1") returns false');

    CURRICULUM_REQUIRED_MODULES.forEach(moduleKey => {
      const subject = subjects[moduleKey];
      registryAssert(!!subject, `${moduleKey} module exists`);
      registryAssert(subject.semesterId === 'sem1', `${moduleKey} semesterId is sem1`);
      registryAssert(
        Array.isArray(subject.departmentIds) && subject.departmentIds.includes('all'),
        `${moduleKey} departmentIds includes all`
      );
    });

    const sem1ModuleKeys = new Set(getModules('sem1').map(module => module.key));
    CURRICULUM_REQUIRED_MODULES.forEach(moduleKey => {
      registryAssert(sem1ModuleKeys.has(moduleKey), `getModules("sem1") includes ${moduleKey}`);
    });
  }

  Object.assign(window, {
    SEMESTERS,
    CURRICULUM_REQUIRED_MODULES,
    getSemesters,
    getDepartments,
    getModules,
    isArchived,
    runCurriculumRegistryAssertions
  });

  // The bundled registry is still checked independently of remote catalog state.
  let catalog=null, pending=null, config=null, epoch=0, request=0;
  let source='bundled', error='', loading=false;
  const idPattern=/^[a-z][a-z0-9_-]{0,63}$/;
  const icons={book:'📘',calculator:'🔢',gear:'⚙️',flask:'🧪'};
  const collections=['semesters','departments','streams','modules','placements'];
  function getStreams(semesterId,departmentId) {
    if (!catalog || !catalog.departments.some(d=>d.id===departmentId&&d.semester_id===semesterId)) return [];
    return catalog.streams.filter(s=>s.department_id===departmentId);
  }
  function validateSnapshot(raw) {
    if (!raw || raw.schemaVersion!==1 || raw.visibility!=='published' || !Number.isSafeInteger(raw.revision) || raw.revision<1) throw Error('INVALID_CATALOG');
    const clean={schemaVersion:1,visibility:'published',revision:raw.revision};
    const maps={};
    const text=(value,max)=>{if(typeof value!=='string'||value.length>max)throw Error('INVALID_CATALOG');return value;};
    for(const name of collections){
      if(!Array.isArray(raw[name])||raw[name].length>10000)throw Error('INVALID_CATALOG');
      maps[name]=new Map();
      clean[name]=raw[name].map(row=>{
        if(!row||!idPattern.test(row.id)||row.status!=='published'||!Number.isInteger(row.sort_order)||maps[name].has(row.id))throw Error('INVALID_CATALOG');
        const item={id:row.id,status:'published',sort_order:row.sort_order};
        if(name!=='placements'){item.label=text(row.label,160);if(!item.label.trim())throw Error('INVALID_CATALOG');}
        if(name==='semesters'){if(!['common','departmental'].includes(row.kind))throw Error('INVALID_CATALOG');item.kind=row.kind;}
        if(name==='departments'||name==='placements')item.semester_id=row.semester_id;
        if(name==='streams'||name==='placements')item.department_id=row.department_id??null;
        if(name==='placements'){item.module_id=row.module_id;item.stream_id=row.stream_id??null;}
        if(name==='modules'){
          item.description=text(row.description,2000);
          if(!/^#[0-9a-fA-F]{6}$/.test(row.color)||!Object.hasOwn(icons,row.icon)||!['none','bundled'].includes(row.content_kind)
            ||(row.content_kind==='bundled'&&!CURRICULUM_REQUIRED_MODULES.includes(row.id)))throw Error('INVALID_CATALOG');
          Object.assign(item,{color:row.color,icon:row.icon,content_kind:row.content_kind});
        }
        maps[name].set(item.id,item);return item;
      }).sort((a,b)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id));
    }
    for(const d of clean.departments)if(maps.semesters.get(d.semester_id)?.kind!=='departmental')throw Error('INVALID_CATALOG');
    for(const s of clean.streams)if(!maps.departments.has(s.department_id))throw Error('INVALID_CATALOG');
    const placements=new Set();
    for(const p of clean.placements){
      const key=JSON.stringify([p.module_id,p.semester_id,p.department_id,p.stream_id]);
      if(!maps.modules.has(p.module_id)||!maps.semesters.has(p.semester_id)||placements.has(key)
        ||(p.department_id!==null&&maps.departments.get(p.department_id)?.semester_id!==p.semester_id)
        ||(p.stream_id!==null&&(!p.department_id||maps.streams.get(p.stream_id)?.department_id!==p.department_id)))throw Error('INVALID_CATALOG');
      placements.add(key);
    }
    return clean;
  }
  function moduleView(m){
    const subject=subjectRegistry()[m.id];
    return Object.assign(Object.create(subject||null),{key:m.id,label:m.label,desc:m.description,color:m.color,
      icon:subject?.icon||icons[m.icon],available:isModuleAvailable(m.id)});
  }
  function isModuleAvailable(key){
    if(!catalog)return !!subjectRegistry()[key];
    return !!subjectRegistry()[key]&&catalog.modules.some(m=>m.id===key&&m.content_kind==='bundled')
      &&catalog.placements.some(p=>p.module_id===key);
  }
  function cacheKey(){return 'mora_curriculum_v1:'+config.project;}
  function changed(){config?.onChange?.();}
  function applySnapshot(next,nextSource){
    if(config?.isBusy?.()){pending={next,nextSource};return;}
    catalog=next;source=nextSource;pending=null;
  }
  function applyPending(){if(pending&&!config?.isBusy?.())applySnapshot(pending.next,pending.nextSource);}
  function invalidate(){epoch++;request++;loading=false;pending=null;}
  function getStatus(){return {source,error,loading,revision:catalog?.revision??null};}
  async function refresh(){
    if(!config)return getStatus();
    const serial=++request,owner=epoch,account=config.accountGeneration?.(),navigation=config.navigationGeneration?.();
    const current=()=>serial===request&&owner===epoch&&account===config.accountGeneration?.()&&navigation===config.navigationGeneration?.();
    loading=true;error='';let timer;
    try{
      const response=await Promise.race([config.rpc('curriculum_snapshot',{p_admin:false}),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('CATALOG_TIMEOUT')),5000);})]);
      if(!current())return getStatus();
      if(response.error)throw Error('CATALOG_UNAVAILABLE');
      const next=validateSnapshot(response.data);
      if(next.revision<Math.max(catalog?.revision||0,pending?.next.revision||0))throw Error('STALE_CATALOG');
      applySnapshot(next,'server');
      try{localStorage.setItem(cacheKey(),JSON.stringify(next));}catch(_){}
    }catch(_){if(current())error='Curriculum could not be refreshed. Using available offline information.';}
    finally{clearTimeout(timer);if(serial===request){loading=false;if(current())changed();}}
    return getStatus();
  }
  async function initialize(options){
    config=options;invalidate();
    try{const cached=localStorage.getItem(cacheKey());if(cached)applySnapshot(validateSnapshot(JSON.parse(cached)),'cache');}catch(_){}
    return refresh();
  }
  async function adminSnapshot(){
    if(!config||navigator.onLine===false)throw Error('CATALOG_OFFLINE');
    const owner=epoch,account=config.accountGeneration?.();
    const response=await config.rpc('curriculum_snapshot',{p_admin:true});
    if(owner!==epoch||account!==config.accountGeneration?.())throw Error('ACCOUNT_CHANGED');
    if(response.error)throw Error(response.error.message||'CATALOG_UNAVAILABLE');
    if(response.data?.visibility!=='admin')throw Error('INVALID_ADMIN_CATALOG');
    return response.data; // Caller-owned, never merged into the public cache.
  }
  async function write(entity,action,id,patch,revision){
    if(!config||navigator.onLine===false)throw Error('CATALOG_OFFLINE');
    const owner=epoch,account=config.accountGeneration?.();
    const response=await config.rpc('curriculum_write',{p_entity:entity,p_action:action,p_id:id,p_patch:patch,p_revision:revision});
    if(owner!==epoch||account!==config.accountGeneration?.())throw Error('ACCOUNT_CHANGED');
    if(response.error)throw Error(response.error.message||'CATALOG_WRITE_FAILED');
    if(!Number.isSafeInteger(response.data))throw Error('UNCONFIRMED_CATALOG_WRITE');
    await refresh();return response.data;
  }
  window.getStreams=getStreams;
  window.MoraCurriculum={initialize,refresh,invalidate,applyPending,getStatus,adminSnapshot,write,isModuleAvailable,validateSnapshot};
  window.addEventListener?.('online',()=>refresh());
  window.addEventListener?.('mora-auth-ready',()=>{invalidate();if(config)refresh();});
  runCurriculumRegistryAssertions();
})();
