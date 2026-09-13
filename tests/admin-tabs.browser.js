// Local-only harness: actual tab/explorer components, mocked statistics/settings.
(async()=>{
  if(location.hostname!=='127.0.0.1'||location.pathname!=='/sample-explorer-test') throw Error('Local harness required');
  const results=[];
  const assert=(ok,msg)=>{if(!ok)throw Error(msg);results.push(msg);};
  const tick=()=>new Promise(r=>setTimeout(r,10));
  const until=async fn=>{for(let i=0;i<300;i++){if(fn())return;await tick();}throw Error('Timed out');};
  const panel=()=>document.querySelector('#admin-panel');
  const tab=id=>document.querySelector('#admin-tab-'+id);
  let finish;
  try {
    sampleAccount('student',false); assert(MoraAdminTabs.render().includes('Access denied'),'student denied admin shell');
    sampleStatsImpl=()=>new Promise(resolve=>finish=resolve);sampleTabs();
    assert(panel().textContent.includes('Loading statistics'),'tab shell renders during loading');
    tab('samples').click();await until(()=>panel().querySelector('nav button'));
    assert(panel().querySelector('section#mora-sample-explorer'),'sample bank embedded without modal');
    const calls=sampleStatsCalls;
    finish('<p>OLD STATISTICS</p>');await tick();
    assert(!panel().textContent.includes('OLD STATISTICS'),'late statistics cannot overwrite samples');
    tab('settings').click();assert(panel().textContent==='Synthetic settings only','settings isolated from statistics and samples');
    assert(!document.querySelector('#mora-sample-explorer'),'leaving samples clears workspace');
    assert(sampleStatsCalls===calls,'samples and settings do not request statistics');
    document.querySelector('#admin-test-host').innerHTML=MoraAdminTabs.render();MoraAdminTabs.mount();
    assert(tab('settings').getAttribute('aria-selected')==='true','settings remains selected after refresh');
    tab('settings').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
    assert(document.activeElement===tab('statistics'),'Home moves focus to first tab');
    tab('statistics').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    await until(()=>panel().querySelector('nav button'));
    assert(tab('samples').getAttribute('aria-selected')==='true','arrow key selects sample tab');
    sampleStatsImpl=async()=>{throw Error('synthetic failure');};tab('statistics').click();
    await until(()=>panel().textContent.includes('Retry statistics'));
    const failures=sampleStatsCalls;await tick();assert(sampleStatsCalls===failures,'statistics error does not retry automatically');
    sampleStatsImpl=async()=>'<p>Recovered statistics</p>';panel().querySelector('button').click();
    await until(()=>panel().textContent.includes('Recovered statistics'));assert(true,'explicit statistics retry recovers');
    sampleStatsImpl=()=>new Promise(resolve=>finish=resolve);tab('statistics').click();
    sampleAccount('admin-B',true);finish('<p>ACCOUNT A DATA</p>');await tick();
    assert(!document.body.textContent.includes('ACCOUNT A DATA')&&!panel(),'account change removes panel and rejects late response');
    sampleTabs();sampleAdmin=false;MoraAdminTabs.checkAccess();assert(!panel(),'role revocation clears tabs');
    return {passed:results.length,results};
  } finally {MoraAdminTabs.close();sampleStatsImpl=async()=>'<p>Synthetic statistics only</p>';}
})();
