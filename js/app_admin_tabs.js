// Stage 9.7: admin-only navigation; existing statistics/settings implementations.
(function () {
  'use strict';
  let active = null, selected = 'statistics', owner = null, ownerGeneration = null;
  const allowed = () => typeof isAdmin === 'function' && isAdmin() && !!getUserId();
  const generation = () => typeof authGeneration === 'number' ? authGeneration : 0;
  function current(session) {
    return active === session && session.root.isConnected && allowed() &&
      session.owner === getUserId() && session.generation === generation();
  }
  function close() {
    if(active) { active.root.replaceChildren(); active=null; }
    window.MoraSampleExplorer?.close();
    window.MoraCurriculumAdmin?.close();
    owner=null; ownerGeneration=null; selected='statistics';
  }
  function checkAccess() { if(active && !current(active)) close(); }
  function render() {
    if(!allowed()) return '<p>Access denied.</p>';
    return `<section id="mora-admin-tabs">
      <header class="header"><div class="header-badge">Admin Dashboard</div><h1>Dashboard</h1></header>
      <div role="tablist" aria-label="Admin sections" style="display:flex;gap:8px;overflow-x:auto;padding:8px;background:var(--surface,#1a1d27);border-radius:8px;margin-bottom:16px;">
        ${[['statistics','Statistics'],['samples','Sample bank'],['settings','Settings'],['curriculum','Curriculum']].map(([id,label])=>
          `<button type="button" role="tab" id="admin-tab-${id}" data-admin-tab="${id}" aria-controls="admin-panel" aria-selected="false" tabindex="-1" style="font:inherit;color:var(--text,#eef);background:transparent;border:0;border-radius:4px;white-space:nowrap;padding:10px 18px;cursor:pointer;">${label}</button>`).join('')}
      </div><div id="admin-panel" role="tabpanel" tabindex="0"></div>
    </section>`;
  }
  function mount() {
    const root=document.getElementById('mora-admin-tabs');
    if(!root || !allowed()) { checkAccess(); return; }
    if(owner!==getUserId() || ownerGeneration!==generation()) selected='statistics';
    owner=getUserId(); ownerGeneration=generation();
    const session={root,owner,generation:generation(),request:0}; active=session;
    const tabs=[...root.querySelectorAll('[data-admin-tab]')], panel=root.querySelector('#admin-panel');
    async function select(id) {
      if(!current(session)) { checkAccess(); return; }
      if(window.MoraCurriculumAdmin?.canLeave()===false)return;
      window.MoraCurriculumAdmin?.close();
      selected=id; const request=++session.request;
      window.MoraSampleExplorer?.close(); panel.replaceChildren();
      for(const tab of tabs) {
        const on=tab.dataset.adminTab===id;
        tab.setAttribute('aria-selected',String(on)); tab.tabIndex=on?0:-1;
        tab.style.borderBottom=on?'3px solid #818cf8':'3px solid transparent';
      }
      panel.setAttribute('aria-labelledby','admin-tab-'+id);
      panel.removeAttribute('aria-busy');
      if(id==='samples') { window.MoraSampleExplorer.open({host:panel}); return; }
      if(id==='settings') { panel.innerHTML=renderAdminSettings(); return; }
      if(id==='curriculum') { window.MoraCurriculumAdmin.open({host:panel}); return; }
      panel.textContent='Loading statistics…'; panel.setAttribute('aria-busy','true');
      try {
        const html=await renderAdminStatistics();
        if(!current(session) || request!==session.request) return;
        panel.innerHTML=html;
      } catch (_) {
        if(!current(session) || request!==session.request) return;
        panel.textContent='Could not load statistics. ';
        const retry=document.createElement('button'); retry.type='button';retry.textContent='Retry statistics';
        retry.addEventListener('click',()=>select('statistics')); panel.appendChild(retry);
      } finally { if(current(session) && request===session.request) panel.removeAttribute('aria-busy'); }
    }
    tabs.forEach((tab,index)=>{
      tab.addEventListener('click',()=>select(tab.dataset.adminTab));
      tab.addEventListener('keydown',event=>{
        let next;
        if(event.key==='ArrowRight') next=(index+1)%tabs.length;
        if(event.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
        if(event.key==='Home') next=0;
        if(event.key==='End') next=tabs.length-1;
        if(next===undefined) return;
        event.preventDefault(); tabs[next].focus(); select(tabs[next].dataset.adminTab);
      });
    });
    select(selected);
  }
  window.addEventListener('mora-auth-ready',checkAccess);
  window.addEventListener('popstate',checkAccess);
  window.MoraAdminTabs={render,mount,close,checkAccess};
})();
