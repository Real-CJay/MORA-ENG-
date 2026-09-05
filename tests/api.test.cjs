const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function handler(fetch, env={}) {
  const ctx={require,module:{exports:{}},Buffer,AbortSignal,fetch,process:{env:{SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-server-key',OPENROUTER_API_KEY:'test-ai-key',...env}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../api/januda.js'),'utf8'),ctx);
  return ctx.module.exports;
}
async function invoke(fn,body,headers={}) {
  const res={headers:{},setHeader(k,v){this.headers[k]=v},end(raw){this.body=JSON.parse(raw)}};
  await fn({method:'POST',headers,socket:{remoteAddress:'127.0.0.1'},body},res);
  return res;
}
const prompt={systemPrompt:'Explain engineering.',userPrompt:'Explain force.'};
test('bad input is rejected before any upstream call',async()=>{
  const fn=handler(()=>{throw Error('must not fetch')});
  for(const body of ['{',[],{...prompt,userPrompt:{}},null]) assert.equal((await invoke(fn,body)).statusCode,400);
  assert.equal((await invoke(fn,{...prompt,userPrompt:'x'.repeat(32001)})).statusCode,413);
});
test('rate limit failure is closed, not an unmetered AI request',async()=>{
  let calls=0; const fn=handler(async()=>{calls++;throw Error('network down')});
  assert.equal((await invoke(fn,prompt)).statusCode,503); assert.equal(calls,1);
});
test('separate handler instances share the database quota',async()=>{
  let count=0,ai=0;
  const fetch=async(url,opts)=>{
    if(url.includes('/consume_rate_limit')) {
      count++; assert.equal(JSON.parse(opts.body).max_requests,10);
      return {ok:true,json:async()=>({limited:count>1,limit:1,remaining:Math.max(0,1-count),resetAt:Date.now()+60000})};
    }
    ai++; return {ok:true,json:async()=>({choices:[{message:{content:'A force changes motion.'}}]})};
  };
  assert.equal((await invoke(handler(fetch),prompt)).statusCode,200);
  assert.equal((await invoke(handler(fetch),prompt)).statusCode,429); assert.equal(ai,1);
});
test('verified users retain their configured quota; provider timeouts are controlled',async()=>{
  const fn=handler(async(url,opts)=>{
    if(url.endsWith('/auth/v1/user')) return {ok:true,json:async()=>({id:'verified-user'})};
    if(url.includes('/consume_rate_limit')) {
      assert.equal(JSON.parse(opts.body).max_requests,30);
      assert.match(JSON.parse(opts.body).bucket_key,/^user:/);
      return {ok:true,json:async()=>({limited:false,limit:30,remaining:29,resetAt:Date.now()+60000})};
    }
    const err=Error('timeout');err.name='TimeoutError';throw err;
  });
  assert.equal((await invoke(fn,prompt,{authorization:'Bearer valid-test-token'})).statusCode,504);
});
