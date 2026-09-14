// Local-only SPA server for manual/browser tests. No backend writes or API proxy.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.MORA_TEST_PORT || 4173);
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400).end();return;}
  // Explicit local-only harness; never included in production index.html.
  if (process.argv.includes('--curriculum-admin') && pathname === '/curriculum-admin-test') {
    res.writeHead(200, {'Content-Type':'text/html','Cache-Control':'no-store'}).end(require('./curriculum-admin-harness.cjs').html());
    return;
  }
  if (process.argv.includes('--curriculum') && pathname === '/curriculum-test') {
    res.writeHead(200, {'Content-Type':'text/html','Cache-Control':'no-store'}).end(require('./curriculum-harness.cjs').html());
    return;
  }
  if (process.argv.includes('--chat') && pathname === '/chat-controls-test') {
    res.writeHead(200, {'Content-Type':'text/html','Cache-Control':'no-store'}).end(require('./chat-harness.cjs').html());
    return;
  }
  if (process.argv.includes('--samples') && pathname === '/sample-explorer-test') {
    res.writeHead(200, {'Content-Type':'text/html','Cache-Control':'no-store'}).end(`<!doctype html>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sample explorer test</title>
      <link rel="stylesheet" href="/quiz_style.css?v=85">
      <link rel="stylesheet" href="/vendor/katex/katex.min.css">
      <script src="/vendor/katex/katex.min.js"></script><script src="/vendor/katex/contrib/auto-render.min.js"></script>
      <script>let authGeneration=0; let sampleUser=null; let sampleAdmin=false;
      function getUserId(){return sampleUser;} function isAdmin(){return sampleAdmin;}
      function sampleAccount(id,admin){authGeneration++;sampleUser=id;sampleAdmin=admin;window.dispatchEvent(new Event('mora-auth-ready'));}</script>
      <script src="/js/app_sample_explorer.js"></script>
      <script src="/js/app_admin_tabs.js"></script>
      <script>let sampleStatsCalls=0; let sampleStatsImpl=async()=>'<p>Synthetic statistics only</p>';
      function renderAdminStatistics(){sampleStatsCalls++;return sampleStatsImpl();}
      function renderAdminSettings(){return '<h2>Synthetic settings only</h2>';}
      function sampleTabs(){sampleAccount('test-admin',true);document.getElementById('admin-test-host').innerHTML=MoraAdminTabs.render();MoraAdminTabs.mount();}</script>
      <h1>Local synthetic test harness</h1><button onclick="sampleAccount('test-admin',true);MoraSampleExplorer.open()">Open as test admin</button>
      <button onclick="sampleTabs()">Open admin tabs</button><div id="admin-test-host"></div>`);
    return;
  }
  if(req.method!=='GET'||/^\/(api|tests|supabase|tools|docs|AI exports)(\/|$)/.test(pathname)||/\.sql$/i.test(pathname)){res.writeHead(404).end();return;}
  if(pathname==='/'||!path.extname(pathname))pathname='/index.html';
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
  fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Mora Quiz local test server: http://127.0.0.1:${port}`));
