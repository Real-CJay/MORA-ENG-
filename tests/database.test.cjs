const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');
for (const selectedType of ['text', 'integer']) test(`isolated database (${selectedType} answers): receipts, ownership, rollback, newer answers and rate limits`, async () => {
  const db = new PGlite();
  const root = path.resolve(__dirname, '..');
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated;
      create table public.answer_history(user_id uuid, subject text, question_id text, selected ${selectedType}, correct boolean, answered_at timestamptz, primary key(user_id,subject,question_id));
      create table public.question_performance(user_id uuid, subject text, question_id text, correct_count int, incorrect_count int, primary key(user_id,question_id));
      create table public.quiz_sessions(id uuid default gen_random_uuid(), user_id uuid, subject text, app_mode text, score int, total int, time_taken int, countdown_limit int, completed_at timestamptz);`);
    const migration = fs.readdirSync(path.join(root, 'supabase/migrations')).find(name => name.endsWith('_progress_receipts_and_rate_limits.sql'));
    await db.exec(fs.readFileSync(path.join(root, 'supabase/migrations', migration), 'utf8'));
    const a = randomUUID(), b = randomUUID();
    await db.query('insert into auth.users values ($1), ($2)', [a, b]);
    await db.exec('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [a]);
    const op = { operationId: randomUUID(), userId:a, type:'answer', occurredAt:new Date(Date.now()-1000).toISOString(), payload:{subject:'materials',questionId:'q1',selected:1,correct:true,answerFormat:'canonical-v1'} };
    const save = value => db.query('select public.save_progress_operation($1::jsonb) as result', [JSON.stringify(value)]);
    assert.equal((await save(op)).rows[0].result.duplicate, false);
    assert.equal((await save(op)).rows[0].result.duplicate, true);
    await assert.rejects(save({...op, payload:{...op.payload, selected:0}}), /Receipt reused/);
    await assert.rejects(save({...op, operationId:randomUUID(), userId:b}), /owner mismatch/);
    await assert.rejects(db.query('select * from mora_private.progress_receipts'), /permission denied/);
    await assert.rejects(db.query("select public.consume_rate_limit($1,60000,2)", ['ip:'+'a'.repeat(64)]), /permission denied/);
    const imported = {...op, operationId:randomUUID(), occurredAt:new Date(Date.now()-86400000).toISOString(), payload:{...op.payload,correct:false,selected:0,imported:true}};
    await save(imported);
    const session = {...op, operationId:randomUUID(),type:'session',payload:{subject:'materials',appMode:'pastpaper',score:1,total:2,timeTaken:5,countdownLimit:60}};
    await save(session); await save(session);
    const invalid = {...session,operationId:randomUUID(),payload:{...session.payload,score:9}};
    await assert.rejects(save(invalid), /Invalid session/);
    await db.exec('reset role');
    assert.deepEqual((await db.query('select selected,correct from answer_history')).rows, [{selected:selectedType === 'text' ? '1' : 1,correct:true}]);
    assert.deepEqual((await db.query('select correct_count,incorrect_count from question_performance')).rows, [{correct_count:1,incorrect_count:0}]);
    assert.equal((await db.query('select count(*)::int as n from quiz_sessions')).rows[0].n, 1);
    assert.equal((await db.query('select count(*)::int as n from mora_private.progress_receipts where operation_id=$1',[invalid.operationId])).rows[0].n,0);
    await db.exec('set role service_role');
    for (let i=0;i<3;i++) {
      const row = (await db.query('select public.consume_rate_limit($1,60000,2) as result', ['ip:'+'a'.repeat(64)])).rows[0].result;
      assert.equal(row.limited, i===2);
    }
    await db.exec('set role anon');
    await assert.rejects(save(op), /permission denied/);
  } finally { await db.close(); }
});
