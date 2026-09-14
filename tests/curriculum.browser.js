(async()=>{
  if(location.pathname!=='/curriculum-test')throw Error('Use curriculum harness');
  const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const api=MoraCurriculum;
  await api.refresh();
  check(getSemesters().length===2,'published semesters');
  check(document.querySelector('[aria-disabled="true"]')?.textContent.includes('Empty module'),'empty module is disabled');
  state.curriculumSemester='sem2';state.curriculumDepartment='mechanical';state.curriculumStream='mechatronics';draw();
  const card=document.querySelector('[data-curriculum-module="math"]');
  check(!!card,'shared stream module renders');card.click();
  check(JSON.parse(document.getElementById('resolution').textContent).dataKey==='math','real route resolver retains key');
  const original=SUBJECTS.math.pastUnit;
  online=false;await api.refresh();check(api.getStatus().error&&getModules('sem2','mechanical','mechatronics').length===1,'offline retains published catalog');
  online=true;await api.refresh();check(!api.getStatus().error,'explicit retry recovers');
  let refused=false;try{await api.write('placements','archive','shared_math',{},serverCatalog.revision);}catch(e){refused=/ADMIN_REQUIRED/.test(e.message);}
  check(refused,'student mutation denied by fixture backend');
  role='admin';account++;api.invalidate();await api.refresh();
  const cacheBefore=localStorage.getItem('mora_curriculum_v1:local-synthetic-curriculum');await api.adminSnapshot();
  check(cacheBefore===localStorage.getItem('mora_curriculum_v1:local-synthetic-curriculum'),'admin snapshot does not overwrite public cache');
  busy=true;await api.write('placements','archive','shared_math',{},serverCatalog.revision);
  check(getModules('sem2','mechanical','mechatronics').length===1,'active attempt defers metadata refresh');
  busy=false;draw();check(getModules('sem2','mechanical','mechatronics').length===0,'archive applied at safe boundary');
  check(getModules('sem1').some(m=>m.key==='math')&&SUBJECTS.math.pastUnit===original,'other placement and question identity preserved');
  const malicious={...structuredClone(serverCatalog),revision:serverCatalog.revision+1};
  malicious.modules.find(m=>m.id==='math').label='<img src=x onerror="window.injected=true">';serverCatalog=malicious;
  state.curriculumSemester='sem1';await api.refresh();draw();
  check(!document.querySelector('#app img')&&!window.injected&&document.getElementById('app').textContent.includes('<img'),'database labels rendered as text');
  check(!performance.getEntriesByType('resource').some(r=>/supabase|subject_data/.test(r.name)),'no live backend or question bank loaded');
  return {passed:checks.length,viewport:[innerWidth,innerHeight],checks};
})()
