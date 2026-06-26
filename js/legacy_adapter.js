const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const LEGACY_KEYS = new Set(['text', 'context', 'opts', 'ans', 'exp', 'img', 'imgAlt']);

function textBlock(value) {
  return { type: 'text', value: String(value ?? '') };
}

function sanitizeAssetId(value) {
  return String(value || 'legacy_image')
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'legacy_image';
}

function answerToLabel(answer, optionCount) {
  if (typeof answer === 'number' && Number.isInteger(answer)) {
    return LETTERS[answer] || String(answer);
  }

  const raw = String(answer ?? '').trim().toLowerCase();
  if (raw.length === 1 && LETTERS.includes(raw)) return raw;
  if (/^\d+$/.test(raw)) {
    const index = Number(raw);
    if (index >= 0 && index < optionCount) return LETTERS[index] || raw;
  }
  return raw;
}

export function isLegacyQuestion(question) {
  if (!question || typeof question !== 'object') return false;
  if (question.body || question.answer) return false;
  return Object.keys(question).some(key => LEGACY_KEYS.has(key));
}

function adaptOption(option, index) {
  const label = LETTERS[index] || String(index + 1);
  if (option && typeof option === 'object' && Array.isArray(option.body)) {
    return { label: String(option.label ?? label), body: option.body };
  }
  return {
    label,
    body: [textBlock(option)]
  };
}

function collectUnknownFields(question) {
  const unknown = {};
  for (const [key, value] of Object.entries(question)) {
    if (!LEGACY_KEYS.has(key)) unknown[key] = value;
  }
  return unknown;
}

export function adaptLegacyQuestion(question, options = {}) {
  if (!isLegacyQuestion(question)) return { question, images: {} };

  const id = String(question.id || `${options.subject || 'legacy'}_${options.index ?? 0}`);
  const images = {};
  const body = [];

  if (question.context !== undefined && question.context !== null && String(question.context).trim()) {
    body.push(textBlock(question.context));
  }
  body.push(textBlock(question.text ?? ''));

  const questionImageIds = [];
  if (question.img) {
    const assetId = sanitizeAssetId(`${id}_image`);
    images[assetId] = {
      src: String(question.img),
      alt: String(question.imgAlt ?? ''),
    };
    body.push({ type: 'image', assetId });
    questionImageIds.push(assetId);
  }

  const opts = Array.isArray(question.opts) ? question.opts : [];
  const type = question.type || 'mcq';
  const normalized = {
    id,
    subject: question.subject ?? options.subject,
    unit: question.unit,
    topic: question.topic,
    year: question.year,
    type,
    body,
    options: opts.map(adaptOption),
    answer: {
      mode: type === 'multi_select' ? 'multiple' : 'single',
      value: type === 'multi_select'
        ? (Array.isArray(question.ans) ? question.ans.map(item => answerToLabel(item, opts.length)) : [])
        : answerToLabel(question.ans, opts.length)
    },
    explanation: question.exp !== undefined && question.exp !== null ? [textBlock(question.exp)] : [],
    images: questionImageIds,
    legacy: { ...question },
    meta: {
      adaptedFrom: 'legacy-flat',
      unknownLegacyFields: collectUnknownFields(question)
    }
  };

  if (!normalized.subject) delete normalized.subject;
  if (normalized.unit === undefined) delete normalized.unit;
  if (normalized.topic === undefined) delete normalized.topic;
  if (normalized.year === undefined) delete normalized.year;
  if (!normalized.images.length) delete normalized.images;

  return { question: normalized, images };
}

export function normalizeQuestion(question, options = {}) {
  return adaptLegacyQuestion(question, options).question;
}

export function normalizePack(pack) {
  const images = { ...(pack?.images || {}) };
  const questions = Array.isArray(pack?.questions) ? pack.questions : [];
  const normalizedQuestions = questions.map((question, index) => {
    const result = adaptLegacyQuestion(question, {
      subject: pack?.subject,
      bucket: pack?.bucket,
      index
    });
    Object.assign(images, result.images);
    return result.question;
  });

  return {
    ...pack,
    images,
    questions: normalizedQuestions,
    stimuli: pack?.stimuli || {}
  };
}
