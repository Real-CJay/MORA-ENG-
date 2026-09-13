// Run via agent-browser eval --stdin on /chat-controls-test only.
(async () => {
  if (location.pathname !== '/chat-controls-test') throw Error('Use the isolated chat harness');
  const checks=[];
  function check(ok,name){if(!ok)throw Error(name);checks.push(name);}
  const el=id=>document.getElementById(id), win=el('chatWindow');
  const settle=()=>new Promise(r=>setTimeout(r,350));
  const mouse=(node,type,x,y)=>node.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y}));
  const touch=(node,type,x,y)=>{
    const e=new Event(type,{bubbles:true,cancelable:true});
    Object.defineProperty(e,'touches',{value:type==='touchend'?[]:[{clientX:x,clientY:y}]});node.dispatchEvent(e);
  };
  if(chatState.isOpen)toggleChat();
  const parent=el('app').parentNode;
  document.querySelector('.chat-toggle').click();await settle();
  check(getComputedStyle(win).display==='flex'&&win.classList.contains('open'),'open button');
  check(document.activeElement===el('chatInput'),'input focused');
  const messages=JSON.stringify(chatState.messages);
  const start=win.getBoundingClientRect();
  check(start.width>250&&start.right<=innerWidth+1,'normal viewport fit');
  el('chatWcMin').click();await settle();
  // Existing CSS min-height:300px prevents full collapse; this extraction preserves it.
  check(win.style.height==='54px'&&win.getBoundingClientRect().height===300,'minimize preserves baseline CSS constraint');
  el('chatWcMin').click();await settle();check(win.getBoundingClientRect().height>250,'restore minimized');
  el('chatWcMax').click();await settle();
  check(Math.abs(win.getBoundingClientRect().width-innerWidth)<2,'maximize width');
  el('chatWcMax').click();await settle();check(!win.classList.contains('maximized'),'restore maximized');
  el('chatWcSnap').click();await settle();
  check(win.classList.contains('split-left')&&el('appShell')?.contains(el('app')),'snap left wraps app');
  // The same existing min-width:280px also limits narrow-screen split mode.
  check(Math.abs(win.getBoundingClientRect().width-Math.max(280,innerWidth/2))<2,'split preserves baseline minimum width');
  document.querySelector('[title="Zoom in"]').click();check(el('appZoomLabel').textContent==='110%','zoom button');
  document.dispatchEvent(new WheelEvent('wheel',{ctrlKey:true,deltaY:-100,cancelable:true}));
  check(el('appZoomLabel').textContent==='140%','pinch zoom');
  document.querySelector('[title="Reset zoom"]').click();check(el('appZoomLabel').textContent==='100%','reset zoom');
  chatSnapHover({currentTarget:el('chatWcSnap')});
  const right=[...el('snapChoicePopup').querySelectorAll('button')].find(b=>b.textContent==='Right');
  right.click();await settle();check(win.classList.contains('split-right'),'popup snap right');
  check(document.querySelectorAll('#appShell').length===1,'no duplicate shell');
  el('chatWcSnap').click();await settle();check(!el('appShell')&&el('app').parentNode===parent,'restore original app parent');
  check(el('app').style.zoom===''&&el('appZoomBar').style.display==='none','restore clears zoom');
  // Exercise real listener paths; dispatched coordinates avoid OS/window movement.
  mouse(el('chatResizeNW'),'mousedown',200,200);
  mouse(document,'mousemove',150,150);mouse(document,'mouseup',150,150);
  check(win.style.width!==''&&win.style.height!==''&&document.body.style.cursor==='','mouse resize and release');
  const resized=win.style.width;mouse(document,'mousemove',1,1);check(win.style.width===resized,'resize stops on release');
  touch(el('chatResizeW'),'touchstart',200,200);touch(document,'touchmove',10000,200);touch(document,'touchend');
  check(win.style.width==='280px'&&document.body.style.userSelect==='','touch resize clamped and released');
  for(const [x,y,klass] of [[1,100,'split-left'],[innerWidth-1,100,'split-right'],[100,1,'maximized']]){
    chatWinRestore();
    mouse(document.querySelector('.chat-header h3'),'mousedown',150,150);
    mouse(document,'mousemove',x,y);
    check(!!el('dragSnapPreview'),'drag preview '+klass);
    mouse(document,'mouseup',x,y);
    check(win.classList.contains(klass)&&!el('dragSnapPreview'),'drag snap '+klass);
  }
  document.querySelector('.chat-win-controls [title="Close"]').click();await settle();
  check(getComputedStyle(win).display==='none'&&!el('appShell'),'close removes split layout');
  check(win.style.width===''&&win.style.top===''&&el('app').style.zoom==='','close clears geometry');
  openJanudaChat();await settle();check(win.classList.contains('open')&&!win.classList.contains('maximized'),'tutorial reopen entry point');
  check(JSON.stringify(chatState.messages)===messages,'messages unchanged');
  check(!performance.getEntriesByType('resource').some(r=>/\/api\/|supabase/.test(r.name)),'no AI/backend requests');
  return {passed:checks.length,viewport:[innerWidth,innerHeight],checks};
})()
