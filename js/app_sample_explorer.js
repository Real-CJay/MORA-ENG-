// Stage 9: synthetic-only admin workspace. No quiz state or persistence APIs.
(function () {
  'use strict';
  const BASE = '/examples/synthetic/';
  const VERSION = '85';
  let active = null;
  const authorized = () => typeof isAdmin === 'function' && isAdmin() &&
    typeof getUserId === 'function' && !!getUserId();
  const generation = () => typeof authGeneration === 'number' ? authGeneration : 0;
  function current(session) {
    return active === session && authorized() && session.owner === getUserId() &&
      session.generation === generation() && session.dialog.isConnected;
  }
  function node(tag, text, parent) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = String(text);
    if (parent) parent.appendChild(el);
    return el;
  }
  function button(text, parent, action) {
    const el = node('button', text, parent);
    el.type = 'button';
    el.addEventListener('click', action);
    return el;
  }
  function close() {
    const previous = active;
    active = null;
    if (!previous) return;
    previous.abort.abort();
    previous.dialog.remove();
    previous.style.remove();
    previous.bank = null;
    previous.selected = null;
    if (previous.focus?.isConnected) previous.focus.focus();
  }
  function checkAccess() {
    if (active && !current(active)) close();
  }
  function rich(text, parent) {
    // Preserve small legacy formatting without copying attributes/active HTML.
    const template = document.createElement('template');
    template.innerHTML = String(text ?? '');
    const allowed = new Set(['B','STRONG','I','EM','SUB','SUP','BR','P','UL','OL','LI','CODE','PRE','SPAN']);
    function copy(source, destination) {
      for (const child of source.childNodes) {
        if (child.nodeType === 3) destination.appendChild(document.createTextNode(child.textContent));
        else if (allowed.has(child.nodeName)) {
          const el = node(child.nodeName.toLowerCase(), undefined, destination);
          copy(child, el);
        }
      }
    }
    copy(template.content, parent);
    if (typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(parent, {throwOnError:false, delimiters:[
        {left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},
        {left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}
      ]});
    }
  }
  function sampleImage(src) {
    const value = String(src || '').replace(/^\//, '');
    if (!/^IMAGES\/__samples\/[A-Za-z0-9_-]+\.(svg|png|webp|jpg)$/.test(value)) return '';
    return '/' + value;
  }
  function image(src, alt, parent) {
    const safe = sampleImage(src);
    if (!safe) { node('p', 'Sample image unavailable.', parent); return; }
    const img = node('img', undefined, parent);
    img.alt = alt || 'Synthetic figure';
    img.addEventListener('error', () => { img.replaceWith(node('p', 'Sample image unavailable.')); }, {once:true});
    img.src = safe;
  }
  function blocks(items, parent, session, pack) {
    const context = {images:{}};
    for (const [id, entry] of Object.entries(pack.images || {})) {
      const src = sampleImage(entry.src);
      if (src) context.images[id] = {...entry, src};
    }
    const normalized = (items || []).map(block => {
      if (typeof block !== 'object' || block === null) return block;
      const result = {...block};
      if (block.type === 'text' || block.type === 'code') result.value = block.value ?? block.text ?? '';
      if (block.type === 'image' && !block.assetId) {
        result.src = sampleImage(block.src || block.img);
        delete result.img;
      }
      return result;
    });
    session.renderer.renderBlocks(normalized, parent, context, {role:'body'});
  }
  function detail(session, question, pack, live, breadcrumb) {
    if (!current(session)) { checkAccess(); return; }
    session.selected = question.id;
    const panel = session.panel;
    panel.replaceChildren();
    node('p', breadcrumb, panel).className = 'sample-breadcrumb';
    node('h3', question.id.replace('__dev_synthetic_', ''), panel);
    node('p', live ? 'Live-compatible · synthetic only' : 'Preview-only · not supported for live imports', panel).className = 'sample-badge';
    const coverage = Object.entries(session.bank.catalog.coverage).filter(([,ids]) => ids.includes(question.id)).map(([name]) => name);
    node('p', 'Tests: ' + coverage.join(', '), panel);
    if (live) {
      if (question.context) rich(question.context, node('div', undefined, panel));
      rich(question.text, node('div', undefined, panel));
      if (question.img) image(question.img, question.imgAlt, panel);
      if (question.blocks?.length) {
        const extra = node('details', undefined, panel);
        node('summary', 'Existing block presentation (flat fallback shown above)', extra);
        blocks(question.blocks, extra, session, pack);
      }
      const form = node('fieldset', undefined, panel);
      node('legend', 'Try an answer — nothing is saved', form);
      let selected = null;
      const radios = question.opts.map((option, index) => {
        const label = node('label', undefined, form);
        label.className = 'sample-option';
        const radio = node('input', undefined, label);
        radio.type = 'radio'; radio.name = 'sample-answer'; radio.value = String(index);
        radio.addEventListener('change', () => {
          if (!current(session)) { checkAccess(); return; }
          selected = index;
          feedback.textContent = '';
        });
        rich(String.fromCharCode(65 + index) + '. ' + option, node('span', undefined, label));
        return radio;
      });
      const feedback = node('p', '', panel);
      feedback.setAttribute('role', 'status');
      button('Check answer', panel, () => {
        if (!current(session)) { checkAccess(); return; }
        feedback.textContent = selected === null ? 'Select an option first.' :
          selected === question.ans ? 'Correct. Nothing was saved.' : 'Incorrect. Try again; nothing was saved.';
      });
      button('Reset', panel, () => {
        if (!current(session)) { checkAccess(); return; }
        selected = null; radios.forEach(radio => { radio.checked = false; });
        feedback.textContent = '';
        answer.open = false;
      });
      const answer = node('details', undefined, panel);
      node('summary', 'Answer and explanation', answer);
      node('p', 'Canonical answer: ' + String.fromCharCode(65 + question.ans) + ' (index ' + question.ans + ')', answer);
      rich(question.exp || 'No explanation in this sample.', node('div', undefined, answer));
      if (question.explanationBlocks) blocks(question.explanationBlocks, answer, session, pack);
    } else {
      const stimulus = pack.stimuli?.[question.stimulusId];
      if (stimulus) {
        node('h4', stimulus.title || 'Shared setup', panel);
        blocks(stimulus.body, panel, session, pack);
      }
      blocks(question.body, panel, session, pack);
      const answer = node('details');
      previewControls(session, question, pack, panel, answer, breadcrumb);
      panel.appendChild(answer);
      node('summary', 'Answer and explanation', answer);
      node('pre', JSON.stringify(question.answer, null, 2), answer);
      blocks(question.explanation, answer, session, pack);
    }
    const raw = node('details', undefined, panel);
    node('summary', 'Raw synthetic fields', raw);
    node('pre', JSON.stringify(question, null, 2), raw);
  }
  function previewControls(session, question, pack, panel, answerPanel, breadcrumb) {
    const answer = question.answer || {}, mode = answer.mode;
    const manual = mode === 'manual' || mode === 'self_mark';
    const supported = ['single','multiple','numeric','text','manual','self_mark'].includes(mode);
    const notes = {
      matching:'Partial interaction: type one pair per field (for example a-1). Pair-selection/drag-and-drop is not established.',
      structured:'Partial interaction: free-text response and model comparison. Separate subpart marks are not established.',
      written:'Manual comparison only; no automatic grading.',
      code_output:'Type the expected output. Code is displayed, never executed.'
    };
    node('p', notes[question.type] || 'Sample interaction available; live quiz support is not enabled.', panel);
    if (!supported) { node('p', 'Answer interaction is not established for this mode.', panel); return; }
    const form = node('fieldset', undefined, panel);
    node('legend', 'Try an answer — nothing is saved', form);
    const inputs = [];
    if (mode === 'single' || mode === 'multiple') {
      for (const option of question.options || []) {
        const label = node('label', undefined, form); label.className = 'sample-option';
        const input = node('input', undefined, label);
        input.type = mode === 'single' ? 'radio' : 'checkbox';
        input.name = 'sample-preview-answer'; input.value = String(option.label);
        inputs.push(input);
        const body = node('span', undefined, label);
        node('span', String(option.label).toUpperCase() + '. ', body);
        blocks(option.body, body, session, pack);
      }
    } else {
      const count = !manual && answer.matchMode === 'all' && Array.isArray(answer.value) ? answer.value.length : 1;
      function addInput() {
        const label = node('label', undefined, form);
        node('span', manual ? 'Your response' : 'Answer ' + (inputs.length + 1), label);
        const input = node(manual ? 'textarea' : 'input', undefined, label);
        if (manual) input.rows = 5;
        else { input.type = mode === 'numeric' ? 'number' : 'text'; if(mode === 'numeric') input.step = 'any'; }
        input.autocomplete = 'off'; inputs.push(input);
      }
      for (let i=0;i<count;i++) addInput();
      if (!manual && answer.matchMode === 'all' && answer.extraAllowed) button('Add another answer', form, () => {
        if (current(session)) addInput(); else checkAccess();
      });
      if (mode === 'numeric') node('p', 'Numeric comparison: ' + (answer.matchMode || 'any') +
        '; tolerance ' + (answer.tolerance ?? 0) + ' (' + (answer.toleranceType || 'relative') + ').', form);
      if (mode === 'text') node('p', 'Text comparison ignores case and surrounding spaces; ' +
        (answer.matchMode === 'all' ? 'all fields required' : 'one accepted answer required') + '.', form);
    }
    const feedback = node('p', '', panel); feedback.setAttribute('role', 'status');
    form.addEventListener('input', () => { if(current(session)) feedback.textContent=''; else checkAccess(); });
    button(manual ? 'Compare with model answer' : 'Check answer', panel, () => {
      if (!current(session)) { checkAccess(); return; }
      const choices = mode === 'single' || mode === 'multiple';
      const values = choices ? inputs.filter(i=>i.checked).map(i=>i.value) : inputs.map(i=>i.value.trim());
      if (!values.length || values.every(v=>v==='')) { feedback.textContent='Enter or select an answer first.'; return; }
      if (manual) { answerPanel.open=true; feedback.textContent='Compare your response with the model below. Not automatically graded; nothing was saved.'; return; }
      let correct;
      if (mode === 'single') correct = values[0] === String(answer.value);
      else if (mode === 'multiple') {
        const expected = new Set((Array.isArray(answer.value) ? answer.value : [answer.value]).map(String));
        correct = values.length === expected.size && values.every(v=>expected.has(v));
      } else correct = mode === 'numeric' ? session.renderer.checkNumericAnswer(answer, values) : session.renderer.checkTextAnswer(answer, values);
      feedback.textContent = correct ? 'Correct. Nothing was saved.' : 'Incorrect. Try again; nothing was saved.';
    });
    button('Reset', panel, () => detail(session, question, pack, false, breadcrumb));
  }
  function folder(label, parent) {
    const el = node('details', undefined, parent);
    node('summary', label, el);
    const children = node('div', undefined, el);
    children.className = 'sample-folder';
    return children;
  }
  function showTree(session) {
    const {catalog, live, preview} = session.bank;
    const tree = session.tree;
    tree.replaceChildren();
    function moduleTree(placement, parent, trail) {
      const module = catalog.modules.find(m => m.id === placement.moduleId);
      const content = folder(module.label, parent);
      const moduleTrail = trail + ' / ' + module.label;
      if (!module.groups.length && !module.previewQuestionIds.length) node('p', 'No sample questions.', content);
      const buckets = {pastUnit:'Unit-wise past papers',pastPaper:'Full papers',targetNormal:'Target normal',targetHard:'Target hard'};
      for (const [bucket, label] of Object.entries(buckets)) {
        const groups = module.groups.filter(group => group.bucket === bucket);
        if (!groups.length) continue;
        const mode = folder(label, content);
        for (const group of groups) {
          const groupLabel = group.unit ? module.units.find(unit => unit.id === group.unit)?.label || group.label : group.label;
          const groupFolder = folder(groupLabel, mode);
          for (const id of group.questionIds) button(id.replace('__dev_synthetic_', ''), groupFolder, () =>
            detail(session, live.questions.find(q => q.id === id), live, true, moduleTrail + ' / ' + label + ' / ' + groupLabel));
        }
      }
      if (module.previewQuestionIds.length) {
        const previewFolder = folder('Preview-only formats', content);
        for (const id of module.previewQuestionIds) button(id.replace('__dev_synthetic_preview_', ''), previewFolder, () =>
          detail(session, preview.questions.find(q => q.id === id), preview, false, moduleTrail + ' / Preview-only formats'));
      }
    }
    for (const semester of catalog.semesters) {
      const sem = folder(semester.label, tree);
      if (semester.type === 'common') {
        const common = folder('Common modules', sem);
        semester.placements.forEach(p => moduleTree(p, common, semester.label + ' / Common modules'));
      } else for (const department of catalog.departments) {
        const placements = semester.placements.filter(p => p.departmentId === department.id);
        if (!placements.length) continue;
        const dept = folder(department.label, sem);
        const trail = semester.label + ' / ' + department.label;
        placements.filter(p => !p.streamId).forEach(p => moduleTree(p, dept, trail));
        for (const stream of department.streams) {
          const matches = placements.filter(p => p.streamId === stream.id);
          if (matches.length) {
            const branch = folder(stream.label, dept);
            matches.forEach(p => moduleTree(p, branch, trail + ' / ' + stream.label));
          }
        }
      }
    }
  }
  function validateBank(catalog, live, preview) {
    if (catalog.catalogVersion !== 1 || catalog.synthetic !== true ||
        catalog.packFiles.live !== 'live.json' || catalog.packFiles.preview !== 'preview.json') throw new Error('Invalid sample catalog');
    const ids = new Set();
    for (const pack of [live, preview]) for (const q of pack.questions) {
      if (!q.id?.startsWith('__dev_synthetic_') || ids.has(q.id)) throw new Error('Invalid sample ID');
      ids.add(q.id);
    }
    for (const q of live.questions) {
      if (!Array.isArray(q.opts) || q.opts.length < 2 || !q.opts.every(o => typeof o === 'string') ||
          !Number.isInteger(q.ans) || q.ans < 0 || q.ans >= q.opts.length) throw new Error('Invalid live sample');
    }
    for (const module of catalog.modules) {
      if (!module.id.startsWith('__sample_')) throw new Error('Invalid sample module');
      for (const group of module.groups) for (const id of group.questionIds) {
        if (!live.questions.some(q => q.id === id)) throw new Error('Missing live sample');
      }
      for (const id of module.previewQuestionIds) if (!preview.questions.some(q => q.id === id)) throw new Error('Missing preview sample');
    }
    for (const sem of catalog.semesters) for (const p of sem.placements) {
      if (!catalog.modules.some(m => m.id === p.moduleId)) throw new Error('Missing sample module');
    }
  }
  async function load(session) {
    try {
      const json = async file => {
        const response = await fetch(BASE + file + '?v=' + VERSION, {signal:session.abort.signal, cache:'no-cache'});
        if (!response.ok) throw new Error('Sample load failed');
        return response.json();
      };
      const [catalog, live, preview, renderer] = await Promise.all([
        json('catalog.json'), json('live.json'), json('preview.json'), import('/js/question_renderer.js')
      ]);
      if (!current(session)) { checkAccess(); return; }
      validateBank(catalog, live, preview);
      session.bank = {catalog, live, preview}; session.renderer = renderer;
      showTree(session);
      session.panel.replaceChildren(node('p', 'Choose a sample question from the folders.'));
    } catch (_) {
      if (!current(session)) { checkAccess(); return; }
      session.tree.replaceChildren();
      session.panel.replaceChildren(node('p', 'Could not load the sample bank. Reconnect and retry.'));
      button('Retry', session.panel, () => open({host:session.host}));
    }
  }
  function open(options = {}) {
    close();
    if (!authorized()) return false;
    const embedded = options.host?.isConnected === true;
    const dialog = node(embedded ? 'section' : 'dialog');
    dialog.id = 'mora-sample-explorer';
    dialog.setAttribute('aria-labelledby', 'sample-explorer-title');
    const style = node('style', `
      #mora-sample-explorer{box-sizing:border-box;width:min(1100px,96vw);height:88vh;max-height:94vh;padding:20px;background:var(--bg,#101320);color:var(--text,#eef);border:1px solid var(--border,#455);border-radius:8px}
      #mora-sample-explorer::backdrop{background:#0009}
      #mora-sample-explorer .sample-layout{display:grid;grid-template-columns:minmax(230px,35%) minmax(0,1fr);gap:20px;height:calc(100% - 150px)}
      #mora-sample-explorer nav,#mora-sample-explorer article{overflow:auto;padding:8px;min-width:0}
      #mora-sample-explorer .sample-folder{padding-left:16px}
      #mora-sample-explorer summary{cursor:pointer;padding:7px 0}
      #mora-sample-explorer button{font:inherit;color:inherit;background:transparent;border:1px solid #64748b;border-radius:4px;padding:6px 10px;margin:4px;cursor:pointer}
      #mora-sample-explorer nav button{display:block;text-align:left;overflow-wrap:anywhere}
      #mora-sample-explorer pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#0002;padding:10px}
      #mora-sample-explorer img{max-width:100%;max-height:240px}
      #mora-sample-explorer .sample-option{display:flex;gap:10px;align-items:center;padding:8px}
      #mora-sample-explorer fieldset>label{display:block;margin:8px 0}
      #mora-sample-explorer fieldset>label.sample-option{display:flex}
      #mora-sample-explorer input:not([type=radio]):not([type=checkbox]),#mora-sample-explorer textarea{display:block;box-sizing:border-box;width:100%;font:inherit;padding:8px}
      section#mora-sample-explorer{width:100%;height:auto;max-height:none}
      section#mora-sample-explorer .sample-layout{height:65vh}
      #mora-sample-explorer .sample-breadcrumb{font-size:.8em;overflow-wrap:anywhere}
      #mora-sample-explorer .sample-badge{font-weight:bold}
      #mora-sample-explorer table{border-collapse:collapse} #mora-sample-explorer td,#mora-sample-explorer th{border:1px solid #64748b;padding:6px}
      @media(max-width:650px){#mora-sample-explorer .sample-layout,section#mora-sample-explorer .sample-layout{grid-template-columns:1fr;height:auto}#mora-sample-explorer nav{max-height:32vh}}
    `, document.head);
    const session = {dialog,style,host:embedded ? options.host : null,owner:getUserId(),generation:generation(),abort:new AbortController(),focus:document.activeElement};
    active = session;
    node('h2', 'Sample bank', dialog).id = 'sample-explorer-title';
    node('p', 'Stage 9 · Made-up questions only. Answers are not saved.', dialog);
    if (!embedded) button('Close sample bank', dialog, close);
    const layout = node('div', undefined, dialog); layout.className = 'sample-layout';
    session.tree = node('nav', undefined, layout); session.tree.setAttribute('aria-label','Sample folders');
    session.panel = node('article', undefined, layout);
    node('p', 'Loading samples…', session.panel);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => { if (active === session) close(); });
    (embedded ? options.host : document.body).appendChild(dialog);
    if (!embedded) dialog.showModal();
    load(session);
    return true;
  }
  window.addEventListener('mora-auth-ready', checkAccess);
  window.addEventListener('popstate', close);
  window.MoraSampleExplorer = {open, close, checkAccess};
})();
