const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {entryPoints, html} = require('./chat-harness.cjs');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const controls = read('js/app_chat_controls.js');

// Small observable DOM model; actual geometry/CSS/inline handlers are browser-tested.
function fixture(readyState = 'complete') {
  const nodes = {}, listeners = new Map();
  function node(id) {
    const classes = new Set();
    const n = {id, style:{}, title:'', textContent:'', parentNode:null,
      classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)), remove:(...xs)=>xs.forEach(x=>classes.delete(x)), contains:x=>classes.has(x)},
      addEventListener(type, fn){ const key = id+':'+type; listeners.set(key,[...(listeners.get(key)||[]),fn]); },
      insertBefore(child){child.parentNode=this; nodes[child.id]=child;},
      appendChild(child){this.insertBefore(child);},
      remove(){delete nodes[this.id];},
      getBoundingClientRect:()=>({width:360,height:500,top:100,left:700,right:1060,bottom:600}),
      focus(){document.activeElement=this;}
    };
    nodes[id]=n;return n;
  }
  const document = node('document');
  document.readyState=readyState; document.body=node('body');
  document.getElementById=id=>nodes[id]||null;
  document.querySelector=s=>s==='.chat-header'?nodes.header:s==='.nav-bar'?nodes.nav:null;
  document.createElement=()=>node('temp');
  ['app','chatWindow','chatInput','chatWcMin','chatWcMax','appZoomLabel','appZoomBar','chatResizeN','chatResizeW','chatResizeNW','header','nav'].forEach(id=>document.body.appendChild(node(id)));
  const context={document,innerWidth:1200,innerHeight:900,setTimeout:()=>0,clearTimeout(){},chatState:{isOpen:false,messages:['synthetic']},_activeProvider:'qwen',selectProvider(){},renderChatMessages(){}};
  context.window=context;
  vm.createContext(context); vm.runInContext(controls+'\n'+entryPoints(),context);
  const fire=(id,type,e={})=>(listeners.get(id+':'+type)||[]).forEach(fn=>fn({preventDefault(){},...e}));
  return {c:context,nodes,fire};
}
test('classic script is loaded once before app and required offline',()=>{
  const index=read('index.html'), worker=read('service-worker.js');
  assert.equal((index.match(/src="\/js\/app_chat_controls.js/g)||[]).length,1);
  assert.ok(index.indexOf('/js/app_chat_controls.js')<index.indexOf('/quiz_app.js'));
  assert.match(worker,/versionedAppAsset\('\/js\/app_chat_controls.js'\)/);
  assert.doesNotMatch(read('quiz_app.js'),/function initChatResize|let _winState =/);
  assert.doesNotMatch(controls,/\b(fetch|localStorage|sessionStorage|chatState|_sb)\b/);
  assert.doesNotMatch(html(),/src="[^\"]*(quiz_data|auth|quiz_app|pwa)\.js/);
});
test('minimize/maximize restore and close preserve messages and clear geometry',()=>{
  const {c,nodes:n}=fixture();const messages=c.chatState.messages;
  c.toggleChat();assert.equal(n.chatWindow.style.display,'flex');
  assert.equal(c.document.activeElement,n.chatInput);
  n.chatWindow.style.height='420px';c.chatWinMinimize();assert.equal(n.chatWindow.style.height,'54px');
  c.chatWinMinimize();assert.equal(n.chatWindow.style.height,'420px');
  c.chatWinMaximize();assert.ok(n.chatWindow.classList.contains('maximized'));
  c.chatWinMaximize();assert.ok(!n.chatWindow.classList.contains('maximized'));
  c.toggleChat();assert.equal(n.chatWindow.style.height,'');assert.equal(n.chatWindow.style.display,'none');
  c.openJanudaChat();assert.equal(n.chatWindow.style.display,'flex');assert.equal(c.chatState.messages,messages);
});
test('split wraps app once, zoom is bounded, close restores original parent',()=>{
  const {c,nodes:n,fire}=fixture(); const parent=n.app.parentNode;
  c.openJanudaChat();c.chatSnapClick();assert.ok(n.chatWindow.classList.contains('split-left'));
  assert.equal(n.app.parentNode.id,'appShell');assert.equal(n.appZoomBar.style.display,'flex');
  for(let i=0;i<40;i++)c.splitZoomApp(1);assert.equal(n.app.style.zoom,2.5);
  for(let i=0;i<40;i++)c.splitZoomApp(-1);assert.equal(n.app.style.zoom,0.4);
  c.splitZoomApp(0,true);fire('document','wheel',{ctrlKey:true,deltaY:-100});assert.equal(n.app.style.zoom,1.3);
  c.toggleChat();assert.equal(n.app.parentNode,parent);assert.equal(n.appShell,undefined);
  assert.equal(n.app.style.zoom,'');assert.equal(n.appZoomBar.style.display,'none');
  fire('document','wheel',{ctrlKey:true,deltaY:-100});assert.equal(n.app.style.zoom,'');
});
test('minimized state is cleared through every restore path',()=>{
  for(const target of ['restore','maximize','snap','close','drag']){
    const {c,nodes:n,fire}=fixture();c.openJanudaChat();
    n.chatWindow.style.height='420px';c.chatWinMinimize();
    assert.ok(n.chatWindow.classList.contains('minimized'));
    if(target==='restore')c.chatWinMinimize();
    if(target==='maximize'){c.chatWinMaximize();c.chatWinRestore();}
    if(target==='snap'){c.chatSnapClick();c.chatWinRestore();}
    if(target==='close'){c.toggleChat();c.openJanudaChat();}
    if(target==='drag')fire('header','mousedown',{clientX:800,clientY:110,target:{closest:()=>null}});
    assert.ok(!n.chatWindow.classList.contains('minimized'),target);
    assert.equal(n.chatWindow.style.height,target==='close'?'':'420px',target);
    assert.equal(n.chatWindow.style.overflow,'',target);
  }
});
for(const ready of ['loading','complete'])test('mouse/touch resize and drag bindings: '+ready,()=>{
  const {c,nodes:n,fire}=fixture(ready);
  if(ready==='loading')fire('document','DOMContentLoaded');
  c.openJanudaChat();
  fire('chatResizeNW','mousedown',{clientX:100,clientY:100});
  fire('document','mousemove',{clientX:50,clientY:60});
  assert.equal(n.chatWindow.style.width,'410px');assert.equal(n.chatWindow.style.height,'540px');
  fire('document','mouseup');assert.equal(n.body.style.userSelect,'');assert.equal(n.body.style.cursor,'');
  fire('document','mousemove',{clientX:0,clientY:0});assert.equal(n.chatWindow.style.width,'410px');
  fire('chatResizeW','touchstart',{touches:[{clientX:100,clientY:100}]});
  fire('document','touchmove',{touches:[{clientX:10000,clientY:100}]});assert.equal(n.chatWindow.style.width,'280px');
  fire('document','touchend');
  fire('header','mousedown',{clientX:800,clientY:110,target:{closest:()=>null}});
  fire('document','mousemove',{clientX:850,clientY:160});
  assert.equal(n.chatWindow.style.left,'750px');assert.equal(n.chatWindow.style.top,'150px');
  fire('document','mouseup');assert.equal(n.header.style.cursor,'grab');
});
