const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const vm=require('node:vm');
test('curriculum admin classic script and offline dependency are wired once',()=>{
  const html=read('index.html'),worker=read('service-worker.js');
  assert.equal(html.match(/src="\/js\/app_curriculum_admin.js/g).length,1);
  assert.ok(html.indexOf('/js/app_curriculum_admin.js')<html.indexOf('/js/app_admin_tabs.js'));
  assert.ok(worker.includes("versionedAppAsset('/js/app_curriculum_admin.js')"));
});
test('actual router and render entrypoints honor cancelled discard',()=>{
  const app=read('quiz_app.js'),c={state:{screen:'admin'},window:{MoraCurriculumAdmin:{canLeave:()=>false}},
    canUseAppHistory:()=>true,routePayloadForState:()=>({screen:'admin'}),routeForState:()=>'/admin',history:{replaceState:(s,t,p)=>{c.restored=p;}}};
  vm.createContext(c);
  vm.runInContext(app.slice(app.indexOf('function applyRoute('),app.indexOf('function confirmLeaveActiveQuiz()')),c);
  c.applyRoute('/dashboard',{});assert.equal(c.state.screen,'admin');assert.equal(c.restored,'/admin');
  vm.runInContext(app.slice(app.indexOf('function renderApp()'),app.indexOf('function _doRenderApp()')),c);
  c.state.screen='dashboard';c.renderApp();assert.equal(c.state.screen,'admin');
});
test('admin feature stays metadata-only and navigation includes discard guards',()=>{
  const feature=read('js/app_curriculum_admin.js'),tabs=read('js/app_admin_tabs.js'),app=read('quiz_app.js');
  assert.ok(feature.includes('MoraCurriculum.adminSnapshot()'));assert.ok(feature.includes('MoraCurriculum.write('));
  assert.ok(!/localStorage|sessionStorage|\.from\(|innerHTML|dbSave/.test(feature));
  assert.ok(tabs.includes("['curriculum','Curriculum']"));assert.ok(tabs.includes('MoraCurriculumAdmin?.canLeave()'));
  assert.ok(app.slice(app.indexOf('function applyRoute('),app.indexOf('function confirmLeaveActiveQuiz()')).includes('MoraCurriculumAdmin?.canLeave()'));
  assert.ok(read('tests/serve.cjs').includes("process.argv.includes('--curriculum-admin')"));
});
