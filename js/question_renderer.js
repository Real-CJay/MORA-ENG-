const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function createEl(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function appendText(parent, text) {
  parent.appendChild(document.createTextNode(String(text ?? '')));
}

function getBlockText(block) {
  if (typeof block === 'string' || typeof block === 'number') return String(block);
  return String(block?.value ?? block?.text ?? '');
}

function getLatex(block) {
  return String(block?.latex ?? block?.value ?? block?.text ?? '');
}

function getAnswerMode(question) {
  const mode = question?.answer?.mode;
  if (mode) return mode;
  if (question?.type === 'multi_select') return 'multiple';
  if (question?.type === 'mcq' || question?.type === 'image_based') return 'single';
  return null;
}

const KATEX_READY_TIMEOUT_MS = 2500;
let katexRenderReadyPromise = null;
let textMathReadyPromise = null;

function hasKatexRenderer() {
  return typeof window !== 'undefined'
    && window.katex
    && typeof window.katex.render === 'function';
}

function hasTextMathRenderer() {
  return typeof window !== 'undefined'
    && typeof window.renderMathInElement === 'function';
}

function waitForRenderer(predicate) {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (predicate()) return Promise.resolve(true);

  return new Promise(resolve => {
    const start = Date.now();
    const interval = window.setInterval(() => {
      if (predicate()) {
        window.clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start >= KATEX_READY_TIMEOUT_MS) {
        window.clearInterval(interval);
        resolve(false);
      }
    }, 50);
  });
}

function waitForKatexRenderer() {
  if (hasKatexRenderer()) return Promise.resolve(true);
  if (!katexRenderReadyPromise) {
    katexRenderReadyPromise = waitForRenderer(hasKatexRenderer).finally(() => {
      if (!hasKatexRenderer()) katexRenderReadyPromise = null;
    });
  }
  return katexRenderReadyPromise;
}

function waitForTextMathRenderer() {
  if (hasTextMathRenderer()) return Promise.resolve(true);
  if (!textMathReadyPromise) {
    textMathReadyPromise = waitForRenderer(hasTextMathRenderer).finally(() => {
      if (!hasTextMathRenderer()) textMathReadyPromise = null;
    });
  }
  return textMathReadyPromise;
}

function renderTextMath(node) {
  try {
    window.renderMathInElement(node, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  } catch {
    // Keep the original safe text if auto-render fails.
  }
}

function renderTextMathIfAvailable(node) {
  if (hasTextMathRenderer()) {
    renderTextMath(node);
    return;
  }

  waitForTextMathRenderer().then(available => {
    if (available) renderTextMath(node);
  });
}

function resolveImage(block, context) {
  const registries = [
    context?.images,
    context?.imageRegistry,
    context?.pack?.images,
    context?.question?.imageRegistry,
    context?.question?.imagesRegistry
  ].filter(Boolean);

  if (block?.assetId) {
    for (const registry of registries) {
      if (registry && registry[block.assetId]) {
        return { assetId: block.assetId, ...registry[block.assetId] };
      }
    }
    return { assetId: block.assetId, missing: true };
  }

  if (block?.src) return { src: block.src, alt: block.alt, caption: block.caption, sourcePage: block.sourcePage };
  return { missing: true };
}

function renderSourceCaption(parent, imageDef) {
  const bits = [];
  if (imageDef.caption) bits.push(String(imageDef.caption));
  if (imageDef.sourcePage !== undefined && imageDef.sourcePage !== null) {
    bits.push(`Source page ${imageDef.sourcePage}`);
  }
  if (!bits.length) return;

  const caption = createEl('figcaption', 'mq-image-caption');
  caption.textContent = bits.join(' - ');
  parent.appendChild(caption);
}

function renderImageBlock(block, parent, context) {
  const imageDef = resolveImage(block, context);
  const figure = createEl('figure', 'mq-image-block');

  if (imageDef.missing || !imageDef.src) {
    const warning = createEl('div', 'mq-render-warning');
    warning.textContent = imageDef.assetId
      ? `Missing image asset: ${imageDef.assetId}`
      : 'Missing image source.';
    figure.appendChild(warning);
    parent.appendChild(figure);
    return;
  }

  const img = createEl('img', 'mq-image');
  img.src = imageDef.src;
  img.alt = String(imageDef.alt ?? block?.alt ?? '');
  img.loading = 'lazy';
  figure.appendChild(img);
  renderSourceCaption(figure, imageDef);
  parent.appendChild(figure);
}

function renderMathBlock(block, parent) {
  const displayMode = block?.display !== false;
  const wrapper = createEl(displayMode ? 'div' : 'span', displayMode ? 'mq-math-display' : 'mq-math-inline');
  const latex = getLatex(block);

  function renderKatex() {
    if (!hasKatexRenderer()) return false;
    try {
      window.katex.render(latex, wrapper, { displayMode, throwOnError: false });
      return true;
    } catch {
      wrapper.textContent = latex;
      return false;
    }
  }

  if (!renderKatex()) {
    wrapper.textContent = latex;
    waitForKatexRenderer().then(available => {
      if (available) renderKatex();
    });
  }

  parent.appendChild(wrapper);
}

export function renderCodeBlock(block, options = {}) {
  const wrapper = createEl('div', 'mq-code-block');
  const top = createEl('div', 'mq-code-toolbar');
  const language = String(block?.language ?? '').trim();
  const label = createEl('span', 'mq-code-language', language || 'code');
  const copyButton = createEl('button', 'mq-copy-button', 'Copy');
  copyButton.type = 'button';
  top.append(label, copyButton);

  const pre = createEl('pre', 'mq-code-pre');
  const code = createEl('code', language ? `language-${language}` : '');
  const source = String(block?.value ?? block?.code ?? '');
  code.textContent = source;
  pre.appendChild(code);

  copyButton.addEventListener('click', async () => {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      copyButton.textContent = 'Unavailable';
      setTimeout(() => { copyButton.textContent = 'Copy'; }, 1200);
      return;
    }

    try {
      await navigator.clipboard.writeText(source);
      copyButton.textContent = 'Copied!';
    } catch {
      copyButton.textContent = 'Copy failed';
    }
    setTimeout(() => { copyButton.textContent = 'Copy'; }, 1200);
  });

  wrapper.append(top, pre);

  if (options.highlight && typeof window !== 'undefined' && window.hljs && typeof window.hljs.highlightElement === 'function') {
    try {
      window.hljs.highlightElement(code);
    } catch {
      // Keep plain escaped code if highlighting fails.
    }
  }

  return wrapper;
}

function renderTableBlock(block, parent) {
  const rows = Array.isArray(block?.rows) ? block.rows : [];
  const table = createEl('table', 'mq-table');
  const useHeader = Boolean(block?.header) && rows.length > 0;
  const bodyRows = useHeader ? rows.slice(1) : rows;

  if (useHeader) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    for (const cell of rows[0]) {
      const th = document.createElement('th');
      th.textContent = String(cell ?? '');
      tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
  }

  const tbody = document.createElement('tbody');
  for (const row of bodyRows) {
    const tr = document.createElement('tr');
    const cells = Array.isArray(row) ? row : [row];
    for (const cell of cells) {
      const td = document.createElement('td');
      td.textContent = String(cell ?? '');
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  parent.appendChild(table);
}

export function renderBlock(block, parent, context = {}, options = {}) {
  if (block === null || block === undefined) return;
  if (typeof block === 'string' || typeof block === 'number') {
    const paragraph = createEl('p', 'mq-text-block');
    paragraph.textContent = String(block);
    renderTextMathIfAvailable(paragraph);
    parent.appendChild(paragraph);
    return;
  }

  const type = block.type;
  if (type === 'text') {
    const paragraph = createEl(block.inline ? 'span' : 'p', 'mq-text-block');
    paragraph.textContent = getBlockText(block);
    renderTextMathIfAvailable(paragraph);
    parent.appendChild(paragraph);
  } else if (type === 'math') {
    renderMathBlock(block, parent);
  } else if (type === 'image') {
    renderImageBlock(block, parent, context);
  } else if (type === 'code') {
    parent.appendChild(renderCodeBlock(block, { highlight: options.role === 'explanation' }));
  } else if (type === 'table') {
    renderTableBlock(block, parent);
  } else {
    const warning = createEl('div', 'mq-render-warning');
    warning.textContent = `Unsupported block type: ${String(type ?? 'unknown')}`;
    parent.appendChild(warning);
  }
}

export function renderBlocks(blocks, parent, context = {}, options = {}) {
  if (!Array.isArray(blocks)) return;
  for (const block of blocks) renderBlock(block, parent, context, options);
}

function optionLabel(option, index) {
  return String(option?.label ?? LETTERS[index] ?? String(index + 1)).trim();
}

function optionBlocks(option) {
  if (typeof option === 'string' || typeof option === 'number') return [{ type: 'text', value: String(option) }];
  if (Array.isArray(option?.body)) return option.body;
  if (Array.isArray(option?.blocks)) return option.blocks;
  if (option?.value !== undefined || option?.text !== undefined) return [{ type: 'text', value: getBlockText(option) }];
  return [{ type: 'text', value: '' }];
}

function normalizeSelectedSet(values) {
  return new Set((Array.isArray(values) ? values : []).map(value => String(value)));
}

function renderOptions(question, parent, context, multiple) {
  const options = Array.isArray(question.options) ? question.options : [];
  const groupName = `mq-${question.id || Math.random().toString(36).slice(2)}`;
  const fieldset = createEl('fieldset', 'mq-options');
  const legend = createEl('legend', 'mq-sr-only', multiple ? 'Select all correct options' : 'Select one option');
  fieldset.appendChild(legend);
  const inputs = [];

  options.forEach((option, index) => {
    const labelValue = optionLabel(option, index);
    const row = createEl('label', 'mq-option');
    const input = document.createElement('input');
    input.type = multiple ? 'checkbox' : 'radio';
    input.name = groupName;
    input.value = labelValue;
    input.dataset.optionLabel = labelValue;
    inputs.push(input);

    const marker = createEl('span', 'mq-option-marker', labelValue.toUpperCase());
    const body = createEl('span', 'mq-option-body');
    renderBlocks(optionBlocks(option), body, context, { role: 'option' });
    row.append(input, marker, body);
    fieldset.appendChild(row);
  });

  parent.appendChild(fieldset);

  return () => {
    if (multiple) return inputs.filter(input => input.checked).map(input => input.value);
    const checked = inputs.find(input => input.checked);
    return checked ? checked.value : null;
  };
}

function parseNumberInput(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function numericEquals(student, expected, answer = {}) {
  if (!Number.isFinite(student) || !Number.isFinite(expected)) return false;
  const tolerance = Number(answer.tolerance ?? 0);
  if (!Number.isFinite(tolerance) || tolerance < 0) return false;
  const diff = Math.abs(student - expected);
  if (tolerance === 0) return diff === 0;

  const type = answer.toleranceType || 'relative';
  if (type === 'absolute') return diff <= tolerance;
  if (expected === 0) return diff <= tolerance;
  return diff <= Math.abs(expected) * tolerance;
}

function normalizeAnswerArray(value) {
  return Array.isArray(value) ? value : [value];
}

function sequenceMatches(required, entries, comparator, extraAllowed) {
  if (!extraAllowed && entries.length !== required.length) return false;
  let entryIndex = 0;
  for (const needed of required) {
    let found = false;
    while (entryIndex < entries.length) {
      if (comparator(entries[entryIndex], needed)) {
        found = true;
        entryIndex += 1;
        break;
      }
      if (!extraAllowed) return false;
      entryIndex += 1;
    }
    if (!found) return false;
  }
  return true;
}

function unorderedDistinctMatches(required, entries, comparator, extraAllowed) {
  if (!extraAllowed && entries.length !== required.length) return false;
  if (entries.length < required.length) return false;
  const used = new Set();

  function backtrack(requiredIndex) {
    if (requiredIndex >= required.length) return true;
    for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
      if (used.has(entryIndex)) continue;
      if (!comparator(entries[entryIndex], required[requiredIndex])) continue;
      used.add(entryIndex);
      if (backtrack(requiredIndex + 1)) return true;
      used.delete(entryIndex);
    }
    return false;
  }

  return backtrack(0);
}

function matchAllDistinct(required, entries, comparator, answer = {}) {
  const cleanEntries = entries.filter(entry => entry !== null && entry !== '');
  const extraAllowed = Boolean(answer.extraAllowed);
  if (answer.orderedMatch) return sequenceMatches(required, cleanEntries, comparator, extraAllowed);
  return unorderedDistinctMatches(required, cleanEntries, comparator, extraAllowed);
}

export function checkNumericAnswer(answer, studentValues) {
  const required = normalizeAnswerArray(answer?.value).map(Number).filter(Number.isFinite);
  const entries = normalizeAnswerArray(studentValues).map(value => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    return parseNumberInput(value);
  });

  if ((answer?.matchMode || 'any') === 'all') {
    return matchAllDistinct(required, entries, (student, expected) => numericEquals(student, expected, answer), answer);
  }

  const first = entries.find(entry => entry !== null);
  return first !== undefined && required.some(expected => numericEquals(first, expected, answer));
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function checkTextAnswer(answer, studentValues) {
  const required = normalizeAnswerArray(answer?.value).map(normalizeText).filter(Boolean);
  const entries = normalizeAnswerArray(studentValues).map(normalizeText).filter(Boolean);
  const comparator = (student, expected) => student === expected;

  if ((answer?.matchMode || 'any') === 'all') {
    return matchAllDistinct(required, entries, comparator, answer);
  }

  const first = entries[0];
  return Boolean(first && required.some(expected => comparator(first, expected)));
}

function renderInputs(question, parent, kind) {
  const answer = question.answer || {};
  const values = normalizeAnswerArray(answer.value);
  const matchAll = answer.matchMode === 'all';
  const count = matchAll ? Math.max(values.length, 1) : 1;
  const wrapper = createEl('div', `mq-${kind}-inputs`);
  const inputs = [];

  function addInput(index, optional = false) {
    const label = createEl('label', 'mq-input-label');
    const labelText = matchAll
      ? `${optional ? 'Extra answer' : 'Answer'} ${index + 1}`
      : 'Answer';
    const span = createEl('span', null, labelText);
    const input = document.createElement('input');
    input.type = kind === 'numeric' ? 'number' : 'text';
    if (kind === 'numeric') input.step = 'any';
    input.autocomplete = 'off';
    inputs.push(input);
    label.append(span, input);
    wrapper.appendChild(label);
  }

  for (let index = 0; index < count; index += 1) addInput(index);

  if (matchAll && answer.extraAllowed) {
    const addButton = createEl('button', 'mq-secondary-button', 'Add another answer');
    addButton.type = 'button';
    addButton.addEventListener('click', () => addInput(inputs.length, true));
    wrapper.appendChild(addButton);
  }

  parent.appendChild(wrapper);
  return () => inputs.map(input => input.value);
}

function createCheckButton(parent, label = 'Check answer') {
  const actions = createEl('div', 'mq-actions');
  const button = createEl('button', 'mq-check-button', label);
  button.type = 'button';
  actions.appendChild(button);
  parent.appendChild(actions);
  return button;
}

function renderExplanation(question, parent, context) {
  const panel = createEl('section', 'mq-explanation');
  panel.hidden = true;
  const title = createEl('h4', 'mq-explanation-title', 'Explanation');
  const body = createEl('div', 'mq-explanation-body');
  renderBlocks(question.explanation || [], body, context, { role: 'explanation' });
  panel.append(title, body);
  parent.appendChild(panel);
  return panel;
}

function renderResult(parent, result) {
  parent.replaceChildren();
  const message = createEl('div', result.isCorrect ? 'mq-result mq-result-correct' : 'mq-result mq-result-incorrect');
  if (result.isCorrect === null) {
    message.className = 'mq-result';
    message.textContent = result.message || 'Answer recorded.';
  } else {
    message.textContent = result.isCorrect ? 'Correct.' : 'Not quite.';
  }
  parent.appendChild(message);
}

function renderStimulus(question, root, context) {
  if (!question.stimulusId) return;
  const stimulus = context?.stimuli?.[question.stimulusId] || context?.pack?.stimuli?.[question.stimulusId];
  const section = createEl('section', 'mq-stimulus');
  const title = createEl('h3', 'mq-stimulus-title', stimulus?.title || `Stimulus: ${question.stimulusId}`);
  section.appendChild(title);

  if (!stimulus) {
    const warning = createEl('div', 'mq-render-warning', `Missing stimulus: ${question.stimulusId}`);
    section.appendChild(warning);
  } else {
    renderBlocks(stimulus.body || [], section, context, { role: 'stimulus' });
    if (Array.isArray(stimulus.images)) {
      for (const assetId of stimulus.images) renderImageBlock({ type: 'image', assetId }, section, context);
    }
  }
  root.appendChild(section);
}

function renderSelfMark(question, parent, explanationPanel, state) {
  const revealButton = createCheckButton(parent, 'Show model answer');
  const resultBox = createEl('div', 'mq-result-host');
  parent.appendChild(resultBox);

  revealButton.addEventListener('click', () => {
    if (state.answered) return;
    explanationPanel.hidden = false;
    const actions = revealButton.parentElement;
    actions.replaceChildren();
    for (const value of ['Correct', 'Partially correct', 'Incorrect']) {
      const button = createEl('button', 'mq-self-mark-button', value);
      button.type = 'button';
      button.addEventListener('click', () => {
        if (state.answered) return;
        state.answered = true;
        state.selfMark = value;
        for (const item of actions.querySelectorAll('button')) item.disabled = true;
        renderResult(resultBox, { isCorrect: null, message: `Marked as: ${value}` });
      });
      actions.appendChild(button);
    }
  });

  return {
    getAnswer: () => state.selfMark,
    checkAnswer: () => ({ answered: state.answered, isCorrect: null, value: state.selfMark })
  };
}

function renderAutoGraded(question, parent, context, explanationPanel, state) {
  const answer = question.answer || {};
  const mode = getAnswerMode(question);
  let getAnswer;

  if (mode === 'single') getAnswer = renderOptions(question, parent, context, false);
  else if (mode === 'multiple') getAnswer = renderOptions(question, parent, context, true);
  else if (mode === 'numeric') getAnswer = renderInputs(question, parent, 'numeric');
  else if (mode === 'text') getAnswer = renderInputs(question, parent, 'text');
  else {
    const note = createEl('div', 'mq-render-warning', `Unsupported answer mode: ${String(mode ?? 'missing')}`);
    parent.appendChild(note);
    getAnswer = () => null;
  }

  const checkButton = createCheckButton(parent);
  const resultBox = createEl('div', 'mq-result-host');
  parent.appendChild(resultBox);

  function checkAnswer() {
    const value = getAnswer();
    let isCorrect = false;

    if (mode === 'single') {
      isCorrect = value !== null && String(value) === String(answer.value);
    } else if (mode === 'multiple') {
      const selected = normalizeSelectedSet(value);
      const expected = normalizeSelectedSet(answer.value);
      isCorrect = selected.size === expected.size && [...expected].every(item => selected.has(item));
    } else if (mode === 'numeric') {
      isCorrect = checkNumericAnswer(answer, value);
    } else if (mode === 'text') {
      isCorrect = checkTextAnswer(answer, value);
    }

    state.answered = true;
    state.result = { answered: true, isCorrect, value };
    explanationPanel.hidden = false;
    renderResult(resultBox, state.result);
    return state.result;
  }

  checkButton.addEventListener('click', checkAnswer);
  return { getAnswer, checkAnswer };
}

export function renderQuestion(container, question, context = {}, options = {}) {
  if (!container || typeof container.replaceChildren !== 'function') {
    throw new TypeError('renderQuestion requires a DOM container.');
  }

  const state = { answered: false, result: null, selfMark: null };
  const root = createEl('article', 'mq-question');
  const localContext = { ...context, question };

  if (options.questionNumber !== undefined) {
    const eyebrow = createEl('div', 'mq-question-number', `Question ${options.questionNumber}`);
    root.appendChild(eyebrow);
  }

  renderStimulus(question, root, localContext);

  const body = createEl('section', 'mq-question-body');
  renderBlocks(question.body || [], body, localContext, { role: 'body' });
  root.appendChild(body);

  const answerArea = createEl('section', 'mq-answer-area');
  root.appendChild(answerArea);

  const explanationPanel = renderExplanation(question, root, localContext);
  const mode = getAnswerMode(question);
  let api;

  if (mode === 'self_mark' || mode === 'manual') {
    api = renderSelfMark(question, answerArea, explanationPanel, state);
  } else {
    api = renderAutoGraded(question, answerArea, localContext, explanationPanel, state);
  }

  container.replaceChildren(root);
  return {
    root,
    state,
    getAnswer: api.getAnswer,
    checkAnswer: api.checkAnswer,
    showExplanation() {
      explanationPanel.hidden = false;
    }
  };
}
