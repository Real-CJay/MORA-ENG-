const fixture=require('./curriculum-fixture.cjs');
const json=v=>JSON.stringify(v).replace(/</g,'\\u003c');
exports.html=()=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Curriculum admin test</title><link rel="stylesheet" href="/quiz_style.css"><style>body{padding:16px}button{margin:3px;max-width:100%;white-space:normal}summary{cursor:pointer}details details{margin-left:16px}</style></head><body>
<h1>Local synthetic curriculum admin</h1><p>No live backend, real question banks or progress saves.</p>
<button onclick="location.reload()">Reset fixture</button><button onclick="testAccount('admin',true)">Admin</button><button onclick="testAccount('student',false)">Student</button><button onclick="testAccount(null,false)">Guest</button>
<button onclick="testOnline=!testOnline;dispatchEvent(new Event(testOnline?'online':'offline'))">Toggle offline</button>
<div id="host"></div>
<script>
const SUBJECTS=${json(fixture.subjects())};let testCatalog=${json(fixture.snapshot())};
testCatalog.modules.push({id:'archived',label:'Archived fixture',description:'',status:'archived',sort_order:0,color:'#6c8bef',icon:'book',content_kind:'none'});
let testUser='admin',testAdmin=true,authGeneration=0,testOnline=true,testWrites=[],testFailure='',testReadHook=null,testWriteHook=null;
Object.defineProperty(navigator,'onLine',{get:()=>testOnline,configurable:true});
function isAdmin(){return testAdmin;}function getUserId(){return testUser;}
function testAccount(id,admin){testUser=id;testAdmin=admin;authGeneration++;dispatchEvent(new Event('mora-auth-ready'));mountTabs();}
function renderAdminStatistics(){return Promise.resolve('<p>Synthetic statistics</p>');}function renderAdminSettings(){return '<p>Synthetic settings</p>';}
async function testRpc(name,args){
 if(!testOnline)throw Error('Offline');
 if(name==='curriculum_snapshot'){
  if(testReadHook)await testReadHook();
  if(args.p_admin&&!testAdmin)return {error:{message:'ADMIN_REQUIRED'}};
  const result=structuredClone(testCatalog);result.visibility=args.p_admin?'admin':'published';
  if(!args.p_admin)for(const key of ['semesters','departments','streams','modules','placements'])result[key]=result[key].filter(r=>r.status==='published');
  return {data:result};
 }
 if(!testAdmin)return {error:{message:'ADMIN_REQUIRED'}};
 testWrites.push(structuredClone(args));if(testWriteHook)await testWriteHook();
 if(args.p_revision!==testCatalog.revision)return {error:{message:'CATALOG_CONFLICT'}};
 if(testFailure==='before'){testFailure='';throw Error('Lost connection');}
 const rows=testCatalog[args.p_entity],row=rows.find(r=>r.id===args.p_id);
 if(args.p_action==='create'){
  if(row)return {error:{message:'CATALOG_ID_EXISTS'}};
  rows.push({id:args.p_id,label:'',description:'',status:'draft',sort_order:0,color:'#6c8bef',icon:'book',content_kind:'none',...args.p_patch});
 }else Object.assign(row,args.p_patch);
 testCatalog.revision++;
 if(testFailure==='after'){testFailure='';throw Error('Lost acknowledgement');}
 return {data:testCatalog.revision};
}
</script>
<script src="/js/curriculum_registry.js"></script><script src="/js/app_curriculum_admin.js"></script><script src="/js/app_admin_tabs.js"></script>
<script>
window.MoraSampleExplorer={open:({host})=>host.textContent='Synthetic sample bank',close:()=>{}};
function mountTabs(){document.getElementById('host').innerHTML=MoraAdminTabs.render();MoraAdminTabs.mount();}
MoraCurriculum.initialize({project:'local-synthetic-admin',rpc:testRpc,accountGeneration:()=>authGeneration}).then(mountTabs);
</script></body></html>`;
