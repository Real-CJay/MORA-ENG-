// Stage 12.1: metadata only. Published catalog and progress stay registry-owned.
(function () {
  'use strict';
  let active=null;
  const entities=['semesters','departments','streams','modules'];
  const allowed=()=>typeof isAdmin==='function'&&isAdmin()&&!!getUserId();
  const generation=()=>typeof authGeneration==='number'?authGeneration:0;
  const current=s=>active===s&&s.host.isConnected&&allowed()&&s.owner===getUserId()&&s.generation===generation();
  const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  function button(text,fn){const b=node('button',text);b.type='button';b.style.cssText='margin:3px;max-width:100%;white-space:normal';b.addEventListener('click',fn);return b;}
  function dirty(s){return !!s?.draft&&(s.pending||s.uncertain||JSON.stringify(s.draft.values)!==JSON.stringify(s.draft.initial));}
  function canLeave(){
    const s=active;if(!s||!current(s))return true;
    if(dirty(s)&&!window.confirm(s.pending||s.uncertain?'A save may still complete. Leave and discard this local form?':'Discard unsaved curriculum edits?'))return false;
    s.draft=null;return true;
  }
  function close(){if(active){active.host.replaceChildren();active=null;}}
  function checkAccess(){if(active&&!current(active))close();}
  function validateSnapshot(data){
    if(!data||data.visibility!=='admin'||data.schemaVersion!==1||!Number.isSafeInteger(data.revision)||data.revision<1)throw Error('Invalid catalog response');
    for(const e of [...entities,'placements']){
      if(!Array.isArray(data[e])||data[e].length>10000)throw Error('Invalid catalog response');
      const ids=new Set();
      for(const r of data[e]){
        if(!r||typeof r.id!=='string'||! /^[a-z][a-z0-9_-]{0,63}$/.test(r.id)||ids.has(r.id)||!['draft','published','archived'].includes(r.status))throw Error('Invalid catalog response');
        if(e!=='placements'&&(typeof r.label!=='string'||!r.label.trim()||[...r.label].length>160))throw Error('Invalid catalog response');
        if(e==='modules'&&(typeof r.description!=='string'||[...r.description].length>2000))throw Error('Invalid catalog response');
        ids.add(r.id);
      }
    }
    return data;
  }
  async function bounded(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Request timed out')),10000);})]);}finally{clearTimeout(timer);}}
  function message(s,text){s.message=text;draw(s);}
  async function load(s,reconcile=false){
    if(!current(s)||s.loading||s.pending)return;
    s.loading=true;draw(s);
    try{
      const data=validateSnapshot(await bounded(window.MoraCurriculum.adminSnapshot()));
      if(!current(s))return;
      s.catalog=data;s.message='';
      if(reconcile&&s.draft){
        const d=s.draft,row=data[d.entity].find(r=>r.id===d.id);
        if(s.uncertain&&row&&Object.entries(d.attempt||{}).every(([k,v])=>row[k]===v)){
          d.create=false;d.row=row;d.blocked=row.status==='archived';d.initial=values(d.entity,row);d.values={...d.initial};s.message='Saved values confirmed in the current catalog.';
        }else if(!d.create&&!row){s.message='This record is no longer available. Close the form.';d.blocked=true;}
        else if(row){
          d.create=false;d.row=row;d.initial=values(d.entity,row);
          s.message='Catalog reloaded. Review current values below against your retained edits, then save explicitly.';
          d.review=true;d.blocked=row.status==='archived';
        }else{s.message='The record was not found. Review and explicitly retry with the same ID.';}
        s.uncertain=false;s.needsReload=false;
      }
    }catch(_){if(current(s))s.message='Could not load curriculum. Check connectivity and Stage 11 backend availability, then Retry.';}
    finally{if(current(s)){s.loading=false;draw(s);}}
  }
  function values(entity,row){const v={label:row.label||''};if(entity==='modules')v.description=row.description||'';return v;}
  function edit(s,entity,row,parent){
    if(!current(s)||s.pending||s.loading||!canLeave())return;
    const create=!row;
    const id=row?.id||entity.slice(0,-1)+'_'+crypto.randomUUID();
    const initial=values(entity,row||{});
    if(create&&entity==='semesters')initial.kind='common';
    s.draft={entity,id,create,row:row||null,parent,initial,values:{...initial},blocked:row?.status==='archived'};
    s.message='';s.needsReload=false;s.uncertain=false;draw(s);
  }
  async function save(s){
    if(!current(s)||s.pending||s.loading||s.needsReload||!s.draft||s.draft.blocked||navigator.onLine===false)return;
    const d=s.draft,v=d.values;
    if(!v.label.trim()||[...v.label.trim()].length>160||(v.description!==undefined&&[...v.description].length>2000)){message(s,'Enter a label (1–160 characters) and description of at most 2000 characters.');return;}
    const patch={};
    for(const [k,value] of Object.entries(v)){const next=k==='label'?value.trim():value;if(d.create||next!==d.initial[k])patch[k]=next;}
    if(d.create){patch.status='draft';if(d.entity==='departments')patch.semester_id=d.parent;if(d.entity==='streams')patch.department_id=d.parent;}
    if(!Object.keys(patch).length){message(s,'No changes to save.');return;}
    if(d.row?.status==='published'&&!window.confirm('These metadata changes become public immediately after a successful save. Save changes?'))return;
    d.attempt=patch;s.pending=true;draw(s);
    try{
      await bounded(window.MoraCurriculum.write(d.entity,d.create?'create':'update',d.id,patch,s.catalog.revision));
      if(!current(s))return;
      s.pending=false;s.uncertain=true;s.needsReload=true;
      await load(s,true);
    }catch(e){
      if(!current(s))return;
      s.pending=false;s.needsReload=true;s.uncertain=!String(e.message).includes('CATALOG_CONFLICT');
      s.message=s.uncertain?'Save outcome is unconfirmed. Reload to reconcile before retrying.':'Another edit changed the catalog. Reload and review before saving again.';
      draw(s);
    }
  }
  function draw(s){
    if(!current(s))return;
    s.host.replaceChildren();
    const section=node('section');section.id='mora-curriculum-admin';section.style.cssText='overflow-wrap:anywhere';
    section.append(node('h2','Curriculum'),node('p','Create draft curriculum and edit metadata. Placement, publication and uploads arrive in later parts of Stage 12.'));
    const status=node('p',s.loading?'Loading curriculum…':s.message);status.setAttribute('role','status');section.append(status);
    const retry=button(s.needsReload?'Reload and review':'Retry / refresh',()=>{if(s.draft&&!s.needsReload&&!canLeave())return;load(s,!!s.draft);});retry.disabled=s.loading||s.pending;section.append(retry);
    if(navigator.onLine===false)section.append(node('p','Offline: writes disabled. Drafts are kept only while this interface stays open.'));
    if(s.catalog){
      const layout=node('div');layout.style.cssText='display:flex;flex-wrap:wrap;gap:20px';
      const tree=node('nav');tree.setAttribute('aria-label','Curriculum hierarchy');tree.style.cssText='flex:1 1 280px;min-width:0';
      const folder=(parent,key,label)=>{const el=node('details');el.style.paddingLeft='12px';el.open=s.expanded.has(key);el.addEventListener('toggle',()=>{if(el.open)s.expanded.add(key);else s.expanded.delete(key);});el.append(node('summary',label));parent.append(el);return el;};
      const item=(parent,e,r)=>{const b=button(r.label+' ['+r.status+']'+(e==='modules'?' — '+(r.content_kind==='none'?'No content':'Bundled content'):''),()=>edit(s,e,r));b.dataset.record=r.id;b.dataset.entity=e;parent.append(b);};
      const add=(parent,text,e,id)=>{const b=button(text,()=>edit(s,e,null,id));b.dataset.create=e;if(id)b.dataset.parent=id;b.disabled=s.pending||s.loading||navigator.onLine===false;parent.append(b);};
      const placements=(parent,sem,dep,stream)=>{
        for(const p of s.catalog.placements.filter(p=>p.semester_id===sem&&(p.department_id||null)===dep&&(p.stream_id||null)===stream)){
          const m=s.catalog.modules.find(m=>m.id===p.module_id);if(m){const line=node('div');line.append(node('span','Placement ['+p.status+']: '));item(line,'modules',m);parent.append(line);}
        }
      };
      add(tree,'New semester','semesters');
      for(const sem of s.catalog.semesters){
        const f=folder(tree,sem.id,sem.label+' ['+sem.status+']');item(f,'semesters',sem);placements(f,sem.id,null,null);
        if(sem.kind==='departmental'&&sem.status!=='archived')add(f,'New department','departments',sem.id);
        for(const dep of s.catalog.departments.filter(d=>d.semester_id===sem.id)){
          const g=folder(f,dep.id,dep.label+' ['+dep.status+']');item(g,'departments',dep);placements(g,sem.id,dep.id,null);
          if(dep.status!=='archived'&&sem.status!=='archived')add(g,'New stream','streams',dep.id);
          for(const stream of s.catalog.streams.filter(t=>t.department_id===dep.id)){
            const h=folder(g,stream.id,stream.label+' ['+stream.status+']');item(h,'streams',stream);placements(h,sem.id,dep.id,stream.id);
          }
        }
      }
      const all=folder(tree,'all-modules','All modules');add(all,'New module','modules');
      for(const m of s.catalog.modules){const line=node('div');item(line,'modules',m);all.append(line);}
      layout.append(tree);
      if(s.draft){const d=s.draft,form=node('form');form.style.cssText='flex:1 1 280px;min-width:0';
        form.append(node('h3',(d.create?'Create draft ':'Edit ')+d.entity),node('p','ID: '+d.id));
        if(d.parent||d.row?.semester_id||d.row?.department_id)form.append(node('p','Parent: '+(d.parent||d.row.semester_id||d.row.department_id)));
        if(d.row)form.append(node('p','Status: '+d.row.status+(d.entity==='semesters'?' · Type: '+d.row.kind:'')));
        if(d.entity==='modules')form.append(node('p','Creating a module does not add questions or make it available to students. Existing placements share this same module.'));
        if(d.review)form.append(node('p','Current saved values: '+JSON.stringify(d.initial)));
        const field=(name,multiline)=>{const label=node('label',name==='label'?'Label':'Description'),input=node(multiline?'textarea':'input');input.name=name;input.value=d.values[name];input.style.cssText='display:block;width:100%;box-sizing:border-box;margin-bottom:12px';input.disabled=d.blocked||s.pending||s.loading||s.needsReload;input.addEventListener('input',()=>{d.values[name]=input.value;});label.append(input);form.append(label);};
        field('label',false);if(d.entity==='modules')field('description',true);
        if(d.create&&d.entity==='semesters'){const label=node('label','Semester type'),select=node('select');select.name='kind';for(const kind of ['common','departmental']){const o=node('option',kind);o.value=kind;select.append(o);}select.value=d.values.kind;select.disabled=s.pending;select.addEventListener('change',()=>{d.values.kind=select.value;});label.append(select);form.append(label);}
        if(d.blocked)form.append(node('p','Read-only: archived or unavailable record.'));
        const submit=node('button',s.pending?'Saving…':'Save');submit.type='submit';submit.disabled=d.blocked||s.pending||s.loading||s.needsReload||navigator.onLine===false;
        form.append(submit,button('Close form',()=>{if(canLeave())draw(s);}));form.addEventListener('submit',e=>{e.preventDefault();save(s);});layout.append(form);
      }
      section.append(layout);
    }
    s.host.append(section);
  }
  function open({host}){close();if(!allowed()){host.textContent='Access denied.';return;}const s={host,owner:getUserId(),generation:generation(),catalog:null,draft:null,expanded:new Set(['all-modules']),message:'',loading:false,pending:false};active=s;load(s);}
  window.addEventListener('mora-auth-ready',checkAccess);
  window.addEventListener('online',()=>{if(active)draw(active);});
  window.addEventListener('offline',()=>{if(active)draw(active);});
  window.addEventListener('beforeunload',event=>{if(current(active||{})&&dirty(active)){event.preventDefault();event.returnValue='';}});
  window.MoraCurriculumAdmin={open,close,canLeave,checkAccess};
})();
