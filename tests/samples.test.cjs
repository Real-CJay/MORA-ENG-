const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const questions = JSON.parse(read('examples/synthetic/live.json')).questions;
const app = read('quiz_app.js');
function section(start, end) {
  const a = app.indexOf(start), b = app.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a);
  return app.slice(a, b);
}

test('all live samples preserve original answer identity under controlled shuffles', () => {
  for (const random of [0, 0.25, 0.5, 0.999]) {
    const ctx = {window: {}, Math: Object.assign(Object.create(Math), {random: () => random})};
    vm.runInNewContext(read('js/app_quiz_utils.js'), ctx);
    vm.runInNewContext(section('function canonicalAnswer(', 'function saveAttemptMetadata('), ctx);
    for (const original of questions) {
      const before = JSON.stringify(original);
      const shuffled = ctx.window.shuffleQuestionOptions(original);
      assert.equal(ctx.canonicalAnswer(shuffled, shuffled.ans), original.ans);
      assert.equal(ctx.savedAnswerIndex(shuffled, {selected:original.ans,answerFormat:'canonical-v1'}), shuffled.ans);
      assert.equal(ctx.savedAnswerIndex(shuffled, {selected:original.ans}), -1);
      assert.equal(JSON.stringify(original), before);
    }
  }
});

test('sample IDs trigger existing synthetic guard and banks are not wired into production', () => {
  const ctx = {};
  vm.runInNewContext(section('function isSyntheticDevQuestion(', 'function enableDevBlockRendering('), ctx);
  for (const q of questions) assert.equal(ctx.isSyntheticDevQuestion(q), true);
  for (const file of ['index.html','service-worker.js','quiz_data.js','js/curriculum_registry.js']) {
    assert.doesNotMatch(read(file), /examples\/synthetic|__sample_shared|__samples\/stage8/);
  }
});
