// Local-only harness: production markup/entry points, synthetic messages, no API.
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
function section(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  if (a < 0 || b < a) throw new Error('Chat harness source boundary missing');
  return source.slice(a, b);
}
function entryPoints() {
  return section(read('quiz_app.js'), 'function toggleChat()', 'function markdownToHTML(');
}
function html() {
  const index = read('index.html');
  const chat = section(index, '<button class="chat-toggle"', '<!-- Timer Modal -->');
  const zoom = section(index, '  <div id="appZoomBar"', '\n</div>');
  const css = index.match(/<link rel="stylesheet" href="\/quiz_style.css[^" ]*">/)[0];
  return `<!doctype html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Chat controls test</title>${css}</head><body>
    <div class="nav-bar">Local chat test — no AI requests${zoom}</div>
    <div id="app"><h1>Synthetic workspace</h1><p>Resize, snap, zoom and restore this panel.</p></div>
    ${chat}
    <script>
      let chatState={isOpen:false,messages:[{role:'assistant',content:'Synthetic message — nothing is saved.'}]};
      let _activeProvider='qwen';
      function selectProvider(p){_activeProvider=p;}
      function renderChatMessages(){document.getElementById('chatBody').textContent=chatState.messages[0].content;}
      function sendChatMessage(){document.getElementById('chatBody').textContent='Sending is disabled in this test.';}
      function toggleModelDropdown(){}
    </script>
    <script src="/js/app_chat_controls.js"></script>
    <script>${entryPoints()}</script></body></html>`;
}
module.exports = {html, entryPoints};
