const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const auth = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'quiz_app.js'), 'utf8');
function section(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Missing source boundaries: ${start}`);
  return source.slice(a, b);
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('all LaTeX delimiters preserve math but cannot restore raw HTML', () => {
  const ctx = { lpEscape: escape };
  vm.runInNewContext(section(app, 'function markdownToHTML(', 'function renderChatMessages('), ctx);
  for (const [left, right] of [['$', '$'], ['$$', '$$'], ['\\(', '\\)'], ['\\[', '\\]']]) {
    const html = ctx.markdownToHTML(`${left}<img src=x onerror=alert(1)>${right}`);
    assert.ok(!html.includes('<img'));
    assert.ok(html.includes('&lt;img'));
    assert.ok(ctx.markdownToHTML(`${left}x^2 + 1${right}`).includes(`${left}x^2 + 1${right}`));
  }
  assert.match(ctx.markdownToHTML('**hello**'), /<strong>hello<\/strong>/);
});
test('avatar styles cannot escape their attribute; valid colors are preserved', () => {
  const ctx = { lpEscape: escape, LEARNING_AVATARS: [], getDisplayName: () => 'U' };
  vm.runInNewContext(section(auth, 'function lpColor(', 'async function dbEnsureUserProfile('), ctx);
  const html = ctx.lpAvatar({ display_name: '<>', avatar_bg: 'red;" onpointerenter="sentinel', avatar_color: '#abcdef' });
  assert.ok(!html.includes('sentinel'));
  assert.ok(html.includes('color:#abcdef'));
  assert.ok(html.includes('&lt;&gt;'));
});
test('account names and admin identifiers are not interpolated into executable handlers', () => {
  assert.ok(!auth.includes('${getDisplayName()}'));
  assert.ok(!app.includes("onclick=\"adminConfirmResetHistory('${safeId}'"));
  assert.ok(!app.includes("onclick=\"adminDoResetHistory('${userId}'"));
  assert.ok(app.includes('${lpEscape(displayName)}'));
  assert.ok(app.includes('data-admin-reset-user="${safeId}"'));
});
