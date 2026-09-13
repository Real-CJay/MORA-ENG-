const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('exact numeric sample is reachable and rejects near answers without changing tolerance sample', async () => {
  const pack=JSON.parse(read('examples/synthetic/preview.json'));
  const catalog=JSON.parse(read('examples/synthetic/catalog.json'));
  const exact=pack.questions.find(q=>q.id==='__dev_synthetic_preview_numeric_exact');
  const tolerant=pack.questions.find(q=>q.id==='__dev_synthetic_preview_numeric');
  assert.equal(exact.type,'numeric'); assert.equal(exact.answer.tolerance,0);
  assert.ok(catalog.modules.some(m=>m.previewQuestionIds.includes(exact.id)));
  assert.deepEqual(catalog.coverage['preview-numeric-exact'],[exact.id]);
  const {checkNumericAnswer}=await import('data:text/javascript;base64,'+Buffer.from(read('js/question_renderer.js')).toString('base64'));
  assert.equal(checkNumericAnswer(exact.answer,['2','-2']),true);
  assert.equal(checkNumericAnswer(exact.answer,['-2','2.0']),true);
  for(const values of [['2.005','-2'],['2.0000000001','-2'],['2',''],['2','2']]) {
    assert.equal(checkNumericAnswer(exact.answer,values),false);
  }
  assert.equal(tolerant.answer.tolerance,0.01);
  assert.equal(checkNumericAnswer(tolerant.answer,['2.005','-2']),true);
});

test('sample explorer is wired into admin, auth cleanup and offline shell only', () => {
  const app = read('quiz_app.js'), auth = read('auth.js');
  const explorer = read('js/app_sample_explorer.js');
  assert.match(app, /MoraAdminTabs.mount\(\)/);
  assert.match(read('js/app_admin_tabs.js'), /MoraSampleExplorer.open\(/);
  assert.match(auth, /MoraSampleExplorer\?\.close\(\)/);
  assert.match(auth, /MoraSampleExplorer\?\.checkAccess\(\)/);
  assert.match(read('index.html'), /app_sample_explorer.js\?v=\d+/);
  assert.match(read('service-worker.js'), /versionedAppAsset\('\/js\/app_sample_explorer.js'\)/);
  assert.doesNotMatch(explorer, /\b(?:localStorage|sessionStorage|indexedDB|_sb|answerHistory|dbSave\w*|renderQuestion)\b/);
  assert.doesNotMatch(read('index.html'), /sample-explorer-test|sampleAccount/);
});

test('all admin refresh paths mount tabs and statistics excludes settings', () => {
  const app=read('quiz_app.js');
  const lines=app.split('\n').filter(line=>line.includes('renderAsyncPage(renderAdminPage()'));
  assert.equal(lines.length,4);
  assert.ok(lines.every(line=>line.includes('MoraAdminTabs.mount()')));
  const start=app.indexOf('async function renderAdminPage()');
  const stats=app.indexOf('async function renderAdminStatistics()');
  assert.doesNotMatch(app.slice(start,stats),/dbAdmin|ensureAllSubjectData/);
  assert.doesNotMatch(app.slice(stats,app.indexOf('// ── View All Questions',stats)),/renderAdminSettings/);
});

test('real admin statistics renders mocked reads without settings or sample imports', async () => {
  const app=read('quiz_app.js'), start=app.indexOf('async function renderAdminStatistics()');
  const code=app.slice(start,app.indexOf('// ── View All Questions',start));
  let reads=0;
  const ctx={isAdmin:()=>true,ensureAllSubjectData:async()=>{reads++;},
    dbAdminOverview:async()=>({total_questions:0,total_correct:0}),
    dbAdminUserStats:async()=>[],dbAdminMostMissed:async()=>[],
    dbAdminDailyActivity:async()=>[],dbAdminGuestStats:async()=>({}),
    renderAdminSettings:()=>{throw Error('Settings must be separate');}};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  const html=await ctx.renderAdminStatistics();
  assert.match(html,/Total Users/);assert.match(html,/No users yet/);assert.equal(reads,1);
  ctx.dbAdminOverview=async()=>{throw Error('offline');};
  await assert.rejects(ctx.renderAdminStatistics(),/offline/);
  ctx.isAdmin=()=>false;assert.match(await ctx.renderAdminStatistics(),/Access denied/);
});
