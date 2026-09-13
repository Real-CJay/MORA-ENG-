// Run in the isolated /sample-explorer-test browser page, never production.
(async () => {
  if (location.hostname !== '127.0.0.1' || location.pathname !== '/sample-explorer-test') throw Error('Local harness required');
  const results = [], requests = [], originalFetch = window.fetch;
  const assert = (ok, message) => { if (!ok) throw Error(message); results.push(message); };
  const dialog = () => document.querySelector('#mora-sample-explorer');
  const panel = () => dialog().querySelector('article');
  const tick = () => new Promise(resolve => setTimeout(resolve, 10));
  const until = async predicate => { for(let n=0;n<300;n++){if(predicate())return;await tick();}throw Error('Timed out'); };
  const click = (root, text) => { const b = [...root.querySelectorAll('button')].find(b=>b.textContent===text); if(!b)throw Error('Missing '+text); b.click(); };
  const loaded = () => dialog()?.querySelector('nav button');
  const beforeStorage = JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]);
  let fail = false, delay = false, release;
  window.fetch = async (url, options) => {
    requests.push({url:String(url),method:options?.method || 'GET'});
    if(fail) return {ok:false};
    if(delay) await new Promise(resolve => { const prior=release; release=()=>{prior?.();resolve();}; });
    return originalFetch(url,options);
  };
  try {
    sampleAccount(null,false);
    assert(MoraSampleExplorer.open()===false && !dialog() && !requests.length,'guest denied without fetching');
    sampleAccount('student',false);
    assert(MoraSampleExplorer.open()===false,'student denied');
    sampleAccount('admin-A',true); MoraSampleExplorer.open(); await until(loaded);
    const tree = dialog().querySelector('nav');
    assert(['Electrical','Mechanical','Aeronautical','Mechatronics','Common Stream','Full papers','Target hard'].every(s=>tree.textContent.includes(s)),'hierarchy includes departments, streams and modes');
    assert(tree.textContent.includes('No sample questions.'),'empty module shown');
    click(tree,'minimal'); click(panel(),'Check answer');
    assert(panel().textContent.includes('Select an option first.'),'selection required');
    const choose = index => { const radio=panel().querySelectorAll('input')[index];radio.checked=true;radio.dispatchEvent(new Event('change'));click(panel(),'Check answer'); };
    choose(0); assert(panel().textContent.includes('Incorrect.'),'incorrect answer feedback');
    choose(1); assert(panel().textContent.includes('Correct. Nothing was saved.'),'correct answer feedback');
    click(panel(),'Reset'); assert(!panel().querySelector('input:checked') && !panel().querySelector('[role=status]').textContent,'reset clears attempt');
    click(tree,'duplicate_options'); choose(0); assert(panel().textContent.includes('Incorrect.'),'duplicate first option remains incorrect');
    choose(1); assert(panel().textContent.includes('Correct.'),'duplicate canonical second option correct');
    for(const name of ['rich','math','hybrid','hard']) {click(tree,name); assert(panel().querySelector('fieldset'),name+' renders');}
    click(tree,'rich'); await until(()=>panel().querySelector('img')?.complete);
    assert(panel().querySelector('img').naturalWidth>0 && panel().querySelector('strong'),'figure and safe formatting rendered');
    click(tree,'math'); assert(panel().querySelector('.katex'),'LaTeX rendered');
    for(const name of ['mcq','multi_select','numeric','numeric_exact','short_answer','structured','written','code_output','matching','image_based']) {
      click(tree,name);
      const manual=['structured','written'].includes(name), action=manual?'Compare with model answer':'Check answer';
      click(panel(),action);assert(panel().textContent.includes('Enter or select an answer first.'),name+' empty response rejected');
      let inputs=[...panel().querySelectorAll('input,textarea')];
      if(manual) inputs[0].value='One plus one is two counters.';
      else if(['mcq','image_based','multi_select'].includes(name)) {
        inputs.forEach(i=>i.checked=name==='multi_select'?['a','b'].includes(i.value):i.value==='a');
      } else {
        const values={numeric:['2.005','-2'],numeric_exact:['2','-2'],short_answer:[' TWO '],code_output:['2'],matching:['b-2','a-1']}[name];
        inputs.forEach((i,n)=>i.value=values[n]);
      }
      click(panel(),action);
      assert(panel().textContent.includes(manual?'Not automatically graded':'Correct. Nothing was saved.'),name+' response can be tested');
      if(!manual) {
        if(inputs[0].type==='radio'||inputs[0].type==='checkbox') inputs.forEach(i=>i.checked=i.value===(name==='multi_select'?'a':'b'));
        else inputs.forEach((i,n)=>i.value=name==='numeric_exact'?['2.005','-2'][n]:'999');
        click(panel(),action);assert(panel().textContent.includes('Incorrect.'),name+' wrong response rejected');
      }
      click(panel(),'Reset');assert([...panel().querySelectorAll('input,textarea')].every(i=>['radio','checkbox'].includes(i.type)?!i.checked:i.value===''),name+' reset clears response');
    }
    sampleAccount('admin-B',true); assert(!dialog(),'account change clears explorer');
    MoraSampleExplorer.open(); await until(loaded); sampleAdmin=false; MoraSampleExplorer.checkAccess(); assert(!dialog(),'admin revocation clears explorer');
    sampleAccount('admin-A',true); fail=true; MoraSampleExplorer.open(); await until(()=>dialog()?.textContent.includes('Could not load'));
    const failedCount=requests.length; await tick();assert(requests.length===failedCount,'failed load stays stable');
    fail=false;click(panel(),'Retry');await until(loaded);assert(loaded(),'explicit retry recovers');
    MoraSampleExplorer.close();delay=true;MoraSampleExplorer.open();sampleAccount('admin-B',true);release();await tick();await tick();assert(!dialog(),'late load cannot reopen another account');delay=false;
    assert(requests.every(r=>r.method==='GET' && r.url.startsWith('/examples/synthetic/')),'only synthetic GET requests');
    assert(beforeStorage===JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]),'browser storage unchanged');
    return {passed:results.length,results};
  } finally { MoraSampleExplorer.close();window.fetch=originalFetch; }
})();
