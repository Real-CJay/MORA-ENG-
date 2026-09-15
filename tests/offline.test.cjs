const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function worker(fetch) {
  const handlers={},puts=[];
  const ctx={URL,Response,location:{origin:'https://mora.test'},self:{addEventListener:(kind,cb)=>handlers[kind]=cb},caches:{open:async()=>({put:async(key)=>puts.push(typeof key==='string'?key:key.url)}),match:async()=>null},fetch};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../service-worker.js'),'utf8'),ctx);
  return {handlers,puts};
}
test('document icons resolve to existing root assets from nested quiz routes',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const links=[...html.matchAll(/<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]+href="([^"]+)"/g)];
  assert.equal(links.length,2);
  for(const link of links)for(const page of ['/','/subjects/fluid/past-papers/full','/semester/sem2/mechanical/math']){
    const icon=new URL(link[1],'https://mora.test'+page);
    assert.equal(icon.pathname,'/assets/icons/icon-192.png');
    assert.ok(fs.existsSync(path.join(__dirname,'..',icon.pathname)));
  }
});
test('404 responses and standalone pages cannot overwrite the offline app shell',async()=>{
  for(const [url,status,wanted] of [['/missing',404,[]],['/short_notes/example.html',200,['https://mora.test/short_notes/example.html']],['/subjects/math',200,['/index.html']]]){
    const {handlers,puts}=worker(async()=>new Response('html',{status,headers:{'Content-Type':'text/html'}}));
    let response;const pending=[];
    handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://mora.test'+url},respondWith:p=>{response=p},waitUntil:p=>pending.push(p)});
    await response;await Promise.all(pending);assert.deepEqual(puts,wanted);
  }
});
test('download acknowledgement uses the transferred port and reflects failures',async()=>{
  for(const type of ['CACHE_SUBJECT','CACHE_IMAGES'])for(const status of [200,404]){
    const {handlers}=worker(async()=>new Response('data',{status}));
    let pending,message;handlers.message({data:{type,url:'/subject_data/math.js',urls:['/IMAGES/m.png']},ports:[{postMessage:value=>{message=value}}],source:{postMessage:()=>{throw Error('wrong channel')}},waitUntil:p=>{pending=p}});
    await pending;assert.equal(message.ok,status===200);
  }
});
test('exams are protected from PWA update reloads',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../pwa.js'),'utf8');
  const a=src.indexOf('  function isActiveQuiz()'),b=src.indexOf('  function show(',a);
  const ctx={state:{screen:'examQuiz'}};vm.runInNewContext(src.slice(a,b),ctx);
  assert.equal(ctx.isActiveQuiz(),true);ctx.state.screen='results';assert.equal(ctx.isActiveQuiz(),false);
});
