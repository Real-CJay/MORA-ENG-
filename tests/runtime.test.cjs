const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../quiz_app.js'),'utf8');
const auth=fs.readFileSync(path.join(__dirname,'../auth.js'),'utf8');
function section(src,start,end){const a=src.indexOf(start),b=src.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return src.slice(a,b);}
test('shuffled options retain canonical identity, including identical option text',()=>{
  const ctx={window:{},Math:Object.assign(Object.create(Math),{random:()=>0})};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/app_quiz_utils.js'),'utf8'),ctx);
  vm.runInNewContext(section(app,'function canonicalAnswer(', 'function saveAttemptMetadata('),ctx);
  for(const original of [{opts:['A','B','C'],ans:1},{opts:['same','same','C'],ans:1}]){
    const q=ctx.window.shuffleQuestionOptions(original);
    const selected=ctx.canonicalAnswer(q,q.ans);
    assert.equal(selected,original.ans);
    assert.equal(ctx.savedAnswerIndex(q,{selected,answerFormat:'canonical-v1'}),q.ans);
    assert.equal(ctx.savedAnswerIndex(q,{selected}),-1);
  }
});
test('exam completion renders immediately, saves once, and snapshots subject',async()=>{
  const writes=[],state={screen:'examQuiz',examSubmitted:false,currentSubject:'math',appMode:'fullpaper',questions:[{id:'q',ans:0}],examAnswers:{q:0},timerSeconds:10,countdownLimit:60,attemptUserId:'A'};
  const ctx={state,getUserId:()=> 'A',answerHistory:{},document:{getElementById:()=>null,body:{classList:{remove(){}}}},stopTimer(){},isActiveQuizScreen:()=>['quiz','examQuiz'].includes(state.screen),renderApp(){writes.push('render')},saveAttemptMetadata:()=>({userId:'A'}),canonicalAnswer:(_,i)=>i,saveExamAnswer:async(...args)=>{writes.push(args)},saveCompletedQuizSession:async(...args)=>{writes.push(args)},reportSaveFailure:error=>{throw error}};
  vm.runInNewContext(section(app,'function finishQuizAttempt(', 'window.submitExamPaper ='),ctx);
  ctx.finishQuizAttempt(true); state.currentSubject='fluid';ctx.finishQuizAttempt(true);
  assert.equal(state.score,1);assert.equal(state.results.length,1);assert.equal(state.screen,'results');
  assert.equal(writes[0],'render');assert.equal(writes.length,3);
  assert.equal(writes[1][0],'math');assert.equal(writes[2][0],'math');assert.equal(ctx.answerHistory.q.correct,true);
});
test('timer uses elapsed time, excludes pause, and submits exam at expiry',()=>{
  let now=10000,tick,submitted=0;
  const state={screen:'examQuiz',countdownLimit:5};
  const ctx={state,Date:{now:()=>now},setInterval:fn=>{tick=fn;return 1},clearInterval(){},setTimeout(){},formatTime:String,playAlarm(){},submitExamPaper(){submitted++;state.screen='results'},finishQuizAttempt(){throw Error('wrong mode')},document:{getElementById:()=>null,createElement:()=>({style:{},remove(){}}),body:{appendChild(){}}}};
  vm.runInNewContext(section(app,'function startTimer()', 'function getAnsweredQuestionIds('),ctx);
  ctx.startTimer(); now+=2000;ctx.pauseTimer();now+=10000;ctx.resumeTimer();now+=3000;tick();
  assert.equal(state.timerSeconds,5);assert.equal(submitted,1);assert.equal(state.countdownRemaining,0);
});
test('profile name-only edit cannot overwrite privacy or creation time',async()=>{
  let sent;const query={update(row){sent=row;return this},eq(){return this},select(){return this},single:async()=>({data:sent})};
  const ctx={isGuest:()=>false,getUserId:()=> 'A',authGeneration:0,dbEnsureUserProfile:async()=>({public_profile:false}),_sb:{from:()=>query},dbRun:async(_,fn)=>fn(),_learningSnapshotCache:null,userProfile:{display_name:'Old'}};
  vm.runInNewContext(section(auth,'async function dbUpdateUserProfile(', 'async function uploadProfileAvatar('),ctx);
  await ctx.dbUpdateUserProfile({display_name:'New',is_admin:true});
  assert.equal(sent.display_name,'New');for(const key of ['public_profile','leaderboard_visible','created_at','is_admin'])assert.ok(!(key in sent));
});
test('out-of-order page responses do not replace newer navigation',async()=>{
  let release,committed=false;const ctx={_renderEpoch:1,authGeneration:1,state:{screen:'history'}};
  vm.runInNewContext(section(app,'function renderAsyncPage(', 'async function loadCurrentSubjectHistory('),ctx);
  const pending=ctx.renderAsyncPage(new Promise(resolve=>{release=resolve}),()=>{committed=true});
  ctx._renderEpoch=2;ctx.state.screen='profile';release('old history');await pending;
  assert.equal(committed,false);
});
test('signup requires a session and recovery form is present',()=>{
  assert.ok(auth.includes('if (signupData?.session?.user)'));
  assert.ok(!auth.includes('signupData?.session?.user || signupData?.user'));
  assert.ok(auth.includes("event === 'PASSWORD_RECOVERY'"));assert.ok(auth.includes('_sb.auth.updateUser({ password })'));
});

test('offline answer history overlays pending work but preserves newer cloud answers',async()=>{
  const pending=[{type:'answer',occurredAt:'2026-01-02T00:00:00Z',payload:{subject:'math',questionId:'q',selected:1,correct:true,answerFormat:'canonical-v1'}},{type:'answer',occurredAt:'2025-01-01T00:00:00Z',payload:{subject:'math',questionId:'newer',selected:0}},{type:'answer',occurredAt:'2026-01-02T00:00:00Z',payload:{subject:'fluid',questionId:'other',selected:1}}];
  let offline=false;
  const query={select(){return this},eq(){return this},then(resolve){resolve(offline?{error:{message:'offline'}}:{data:[{question_id:'newer',selected:'2',answered_at:'2026-01-01',answer_format:'canonical-v1'}]})}};
  const ctx={isGuest:()=>false,getUserId:()=> 'A',authGeneration:0,_sb:{from:()=>query},dbRun:(_,fn)=>fn(),window:{MoraProgressOutbox:{pending:async uid=>{assert.equal(uid,'A');return pending}}}};
  vm.runInNewContext(section(auth,'async function dbLoadAnswerHistory(', 'async function dbSendProgressOperation('),ctx);
  let result=await ctx.dbLoadAnswerHistory('math');assert.equal(result.q.selected,1);assert.equal(result.newer.selected,2);assert.ok(!result.other);
  offline=true;result=await ctx.dbLoadAnswerHistory('math');assert.equal(result.q.correct,true);
});

test('exam owned by A never changes B history after switching accounts',()=>{
  const state={screen:'examQuiz',examSubmitted:false,currentSubject:'math',appMode:'fullpaper',questions:[{id:'q',ans:0}],examAnswers:{q:0},timerSeconds:10,countdownLimit:60};
  const owners=[];
  const ctx={state,getUserId:()=> 'B',answerHistory:{},document:{getElementById:()=>null,body:{classList:{remove(){}}}},stopTimer(){},isActiveQuizScreen:()=>true,renderApp(){},saveAttemptMetadata:()=>({userId:'A'}),canonicalAnswer:(_,i)=>i,saveExamAnswer:async(...args)=>owners.push(args.at(-1).userId),saveCompletedQuizSession:async(...args)=>owners.push(args.at(-1).userId),reportSaveFailure:error=>{throw error}};
  vm.runInNewContext(section(app,'function finishQuizAttempt(', 'window.submitExamPaper ='),ctx);ctx.finishQuizAttempt(true);
  assert.equal(Object.keys(ctx.answerHistory).length,0);assert.deepEqual(owners,['A','A']);
});

test('practice count applies to unit mode but never truncates a full paper',()=>{
  const pool=Array.from({length:53},(_,id)=>({id,opts:['a','b'],ans:0}));
  for(const mode of ['pastpaper','fullpaper']) {
    const state={appMode:mode,count:20};
    const ctx={state,getPracticeQuizPool:()=>({pool,fullScope:pool}),isSyntheticDevSubject:()=>false,isSyntheticDevQuestion:()=>false,getAnsweredQuestionIds:()=>[],clearBrowseState(){},resetQuizAttemptState(){},limitQuestionCount:p=>p.slice(0,state.count),ensureActiveQuizHistoryEntry(){},startTimer(){},renderApp(){},setTimeout(){},_maybeNudgeShortcuts(){}};
    vm.runInNewContext(section(app,'function startQuiz(', 'function startTargetQuiz('),ctx);ctx.startQuiz();
    assert.equal(state.questions.length,mode==='fullpaper'?53:20);
  }
});
