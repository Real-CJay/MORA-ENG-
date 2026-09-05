const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { IDBFactory } = require('fake-indexeddb');
function harness(indexedDB = new IDBFactory()) {
  const values = {mora_quiz_pending_sync_v1:'[{"type":"answer"}]'};
  const localStorage = Object.assign(values, {getItem:key=>values[key]??null});
  const ctx = { indexedDB, navigator:{onLine:true}, localStorage, window:{indexedDB}, console };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/app_progress_outbox.js'),'utf8'),ctx);
  return ctx.window.MoraProgressOutbox;
}
function op(id, userId='A') { return {operationId:id,userId,occurredAt:'2026-01-01T00:00:00.000Z',type:'answer',payload:{subject:'math'}}; }
test('ownerless legacy data is preserved, never uploaded', async()=>{
  const box=harness(); await box.preserveLegacy();
  assert.equal((await box.exportRecovery())[0].key,'mora_quiz_pending_sync_v1');
  assert.equal((await box.pending('A')).length,0);
});
test('account switch does not replay A as B',async()=>{
  const box=harness(), written=[]; let user='A';
  box.configure(async value=>{written.push(value);return {operationId:value.operationId}},()=>user);
  await box.enqueue(op('1')); user='B'; await box.flush();
  assert.equal(written.length,0); assert.equal((await box.pending('A')).length,1);
  user='A'; await box.flush(); assert.equal(written[0].userId,'A');
});
test('enqueue during replay is drained without deleting unacknowledged work',async()=>{
  const box=harness(),written=[]; let release;
  box.configure(async value=>{
    written.push(value.operationId);
    if(value.operationId==='1') await new Promise(resolve=>{release=resolve});
    return {operationId:value.operationId};
  },()=> 'A');
  await box.enqueue(op('1')); const replay=box.flush();
  while(!release) await new Promise(resolve=>setImmediate(resolve));
  await box.enqueue(op('2')); release(); await replay;
  assert.deepEqual(written,['1','2']); assert.equal((await box.pending('A')).length,0);
});
test('failed and unacknowledged operations survive reload; receipts cannot be overwritten',async()=>{
  const idb=new IDBFactory(),box=harness(idb); await box.enqueue(op('1'));
  box.configure(async()=>{throw Error('database unavailable')},()=> 'A');
  await assert.rejects(box.flush(),/database unavailable/);
  const reopened=harness(idb); assert.equal((await reopened.pending('A')).length,1);
  await assert.rejects(reopened.enqueue({...op('1'),payload:{subject:'different'}}));
  reopened.configure(async()=>({}),()=> 'A'); await assert.rejects(reopened.flush(),/not acknowledged/);
  assert.equal((await reopened.pending('A')).length,1);
});
test('two tabs can replay one receipt safely with server deduplication',async()=>{
  const idb=new IDBFactory(),a=harness(idb),b=harness(idb),receipts=new Set(); let effects=0;
  const server=async op=>{if(!receipts.has(op.operationId)){receipts.add(op.operationId);effects++} return {operationId:op.operationId};};
  a.configure(server,()=> 'A'); b.configure(server,()=> 'A');
  await a.enqueue(op('1')); await Promise.all([a.flush(),b.flush()]);
  assert.equal(effects,1); assert.equal((await a.pending('A')).length,0);
});

test('simultaneous guest imports share one immutable owner and receipt manifest',async()=>{
  const idb=new IDBFactory(),a=harness(idb),b=harness(idb);
  const manifests=await Promise.all([
    a.getOrCreateImport('guest-1',{userId:'A',operations:[op('first')]}),
    b.getOrCreateImport('guest-1',{userId:'B',operations:[op('second','B')]})
  ]);
  assert.equal(JSON.stringify(manifests[0]),JSON.stringify(manifests[1]));
  const reopened=await harness(idb).getOrCreateImport('guest-1',{userId:'C',operations:[]});
  assert.equal(reopened.userId,manifests[0].userId);
  assert.equal(reopened.operations.length,1);
});
