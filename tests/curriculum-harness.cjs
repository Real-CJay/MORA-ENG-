const fs=require('node:fs'),path=require('node:path');
const fixture=require('./curriculum-fixture.cjs');
const app=fs.readFileSync(path.join(__dirname,'../quiz_app.js'),'utf8');
function section(a,b){const x=app.indexOf(a),y=app.indexOf(b,x);if(x<0||y<x)throw Error('Harness boundary missing');return app.slice(x,y);}
const scriptJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c');
exports.html=()=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Curriculum foundation test</title><link rel="stylesheet" href="/quiz_style.css">
  <style>#status,#resolution{overflow-wrap:anywhere}nav button{margin:2px}</style></head><body>
  <h1>Local synthetic curriculum</h1><p>No live database, AI requests or progress saves.</p>
  <nav aria-label="Test controls"><button id="reset">Reset fixture</button><button id="role">Switch to admin</button>
  <button id="offline">Go offline</button><button id="retry">Retry catalog</button><button id="archive">Archive shared placement</button>
  <button id="attempt">Start simulated attempt</button></nav>
  <p id="status" role="status"></p><div id="semesters"></div><div id="app"></div><p id="resolution" role="status"></p>
  <script>const SUBJECTS=${scriptJSON(fixture.subjects())};let serverCatalog=${scriptJSON(fixture.snapshot())};
  let role='student',online=true,account=0,navigation=0,busy=false;
  const state={curriculumSemester:'sem1',curriculumDepartment:'',curriculumStream:'',curriculumError:''};
  function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function subjectTotalCount(key){return SUBJECTS[key]?.pastUnit.length||0;}
  </script><script src="/js/curriculum_registry.js"></script><script src="/js/curriculum_module_adapter.js"></script>
  <script>
  ${section('function curriculumHelpersReady()','function writeCurriculumRootState(')}
  ${section('function curriculumPathForSelection(','function curriculumRouteForSubject(')}
  ${section('function resolveCurriculumRoute(','function applyRoute(')}
  ${section('function renderCurriculumModules()','function renderCategorySubjects(')}
  function draw(){
    MoraCurriculum.applyPending();
    document.getElementById('status').textContent=JSON.stringify({...MoraCurriculum.getStatus(),role,online,busy});
    const host=document.getElementById('semesters');host.replaceChildren();
    for(const s of getSemesters()){const b=document.createElement('button');b.textContent=s.label;b.onclick=()=>{navigation++;state.curriculumSemester=s.id;state.curriculumStream='';draw();};host.appendChild(b);}
    document.getElementById('app').innerHTML=renderCurriculumModules();
  }
  async function rpc(name,args){
    if(!online)return {error:{message:'Offline fixture'}};
    if(name==='curriculum_write'){
      if(role!=='admin')return {error:{message:'ADMIN_REQUIRED'}};
      if(args.p_revision!==serverCatalog.revision)return {error:{message:'CATALOG_CONFLICT'}};
      serverCatalog.placements=serverCatalog.placements.filter(p=>p.id!==args.p_id);serverCatalog.revision++;
      return {data:serverCatalog.revision};
    }
    if(args.p_admin&&role!=='admin')return {error:{message:'ADMIN_REQUIRED'}};
    return {data:{...structuredClone(serverCatalog),visibility:args.p_admin?'admin':'published'}};
  }
  const options={project:'local-synthetic-curriculum',rpc,accountGeneration:()=>account,navigationGeneration:()=>navigation,isBusy:()=>busy,onChange:draw};
  document.getElementById('reset').onclick=()=>{localStorage.removeItem('mora_curriculum_v1:local-synthetic-curriculum');location.reload();};
  document.getElementById('role').onclick=async()=>{role=role==='student'?'admin':'student';account++;MoraCurriculum.invalidate();await MoraCurriculum.refresh();draw();};
  document.getElementById('offline').onclick=async()=>{online=!online;await MoraCurriculum.refresh();draw();};
  document.getElementById('retry').onclick=()=>MoraCurriculum.refresh();
  document.getElementById('archive').onclick=async()=>{try{await MoraCurriculum.write('placements','archive','shared_math',{},serverCatalog.revision);}catch(e){document.getElementById('resolution').textContent=e.message;}draw();};
  document.getElementById('attempt').onclick=()=>{busy=!busy;draw();};
  document.getElementById('app').addEventListener('click',e=>{
    const module=e.target.closest('[data-curriculum-module]');
    if(module){e.preventDefault();const result=resolveCurriculumRoute(new URL(module.href).pathname.split('/').filter(Boolean));document.getElementById('resolution').textContent=JSON.stringify(result);return;}
    const stream=e.target.closest('[data-curriculum-stream]'),department=e.target.closest('[data-curriculum-department]');
    if(stream){navigation++;state.curriculumStream=stream.dataset.curriculumStream;draw();}
    else if(department){navigation++;state.curriculumDepartment=department.dataset.curriculumDepartment;state.curriculumStream='';draw();}
  });
  MoraCurriculum.initialize(options).then(draw);
  </script></body></html>`;
