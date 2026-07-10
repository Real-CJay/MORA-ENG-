(function () {
  'use strict';

  const bridge = window.MoraQuestionRenderBridge = window.MoraQuestionRenderBridge || {};
  const RENDERER_MODULE_PATH = '/js/question_renderer.js';
  const bridgeScriptUrl = document.currentScript?.src || '';
  let rendererModulePromise = null;
  let activeQuestionPlan = null;
  const viewAllQuestionPlans = new Map();
  const resultReviewQuestionPlans = new Map();
  const directoryQuestionPlans = new Map();
  const examQuestionPlans = new Map();

  function isEnabled() {
    return window._appSettings?.block_renderer_enabled === true;
  }

  function rendererModuleUrl() {
    if (window.location?.protocol === 'file:') {
      return new URL('question_renderer.js', bridgeScriptUrl || window.location.href).href;
    }
    return RENDERER_MODULE_PATH;
  }

  function loadRendererModule() {
    if (!rendererModulePromise) {
      rendererModulePromise = import(rendererModuleUrl()).catch(error => {
        rendererModulePromise = null;
        throw error;
      });
    }
    return rendererModulePromise;
  }

  function getTextValue(block) {
    return block?.value ?? block?.text ?? '';
  }

  function resolveAssetPath(src) {
    if (!src || typeof src !== 'string') return src;
    if (typeof window.rootAssetPath === 'function') return window.rootAssetPath(src);
    return src;
  }

  function normalizeBlock(block) {
    if (block === null || block === undefined) return null;
    if (typeof block === 'string' || typeof block === 'number') {
      return { type: 'text', value: String(block) };
    }
    if (typeof block !== 'object') {
      return { type: 'text', value: String(block) };
    }

    const type = block.type || (block.code !== undefined ? 'code' : (block.img || block.src || block.assetId ? 'image' : 'text'));
    if (type === 'image') {
      const normalized = { ...block, type: 'image' };
      const src = block.src || block.img || block.path;
      if (src) {
        normalized.src = resolveAssetPath(String(src));
        delete normalized.img;
        delete normalized.path;
      }
      if (block.imgAlt && !normalized.alt) normalized.alt = block.imgAlt;
      return normalized;
    }
    if (type === 'text') return { ...block, type: 'text', value: getTextValue(block) };
    if (type === 'code') return { ...block, type: 'code', value: block.value ?? block.code ?? '' };
    if (type === 'math') return { ...block, type: 'math', latex: block.latex ?? block.value ?? block.text ?? '' };
    if (type === 'table') return { ...block, type: 'table' };
    return { ...block, type };
  }

  function normalizeBlocks(blocks) {
    if (!Array.isArray(blocks)) return [];
    return blocks.map(normalizeBlock).filter(Boolean);
  }

  function bodyBlocksFor(question) {
    return normalizeBlocks(question?.body || question?.blocks || question?.questionBlocks);
  }

  function explanationBlocksFor(question) {
    return normalizeBlocks(question?.explanation || question?.explanationBlocks);
  }

  function hasBlockContent(question) {
    return bodyBlocksFor(question).length > 0 || explanationBlocksFor(question).length > 0;
  }

  function imageRegistryFor(question) {
    const registry = {};
    const sources = [
      question?.imageRegistry,
      question?.imagesRegistry,
      Array.isArray(question?.images) ? null : question?.images
    ];
    for (const source of sources) {
      if (!source || typeof source !== 'object') continue;
      Object.assign(registry, source);
    }
    return registry;
  }

  function emptyPlan() {
    return { enabled: false, hasBody: false, hasExplanation: false, key: '' };
  }

  function buildQuestionPlan(question, key) {
    if (!question || !hasBlockContent(question)) return null;
    const bodyBlocks = bodyBlocksFor(question);
    const explanationBlocks = explanationBlocksFor(question);
    const images = imageRegistryFor(question);
    return {
      key,
      question,
      bodyBlocks,
      explanationBlocks,
      context: {
        question,
        images,
        imageRegistry: images
      }
    };
  }

  function planSummary(plan) {
    if (!plan) return emptyPlan();
    return {
      enabled: true,
      key: plan.key,
      hasBody: plan.bodyBlocks.length > 0,
      hasExplanation: plan.explanationBlocks.length > 0
    };
  }

  function prepareActiveQuestion(question) {
    activeQuestionPlan = null;
    if (!isEnabled()) return emptyPlan();
    activeQuestionPlan = buildQuestionPlan(question, String(question?.id || 'active-question'));
    return planSummary(activeQuestionPlan);
  }

  function clearViewAllQuestions() {
    viewAllQuestionPlans.clear();
  }

  function prepareViewAllQuestion(question, key) {
    if (!isEnabled()) return emptyPlan();
    const plan = buildQuestionPlan(question, String(key || question?.id || 'view-all-question'));
    if (!plan) return emptyPlan();
    viewAllQuestionPlans.set(plan.key, plan);
    return planSummary(plan);
  }

  function prepareQuestionPlan(planMap, question, key, fallbackKey) {
    if (!isEnabled()) return emptyPlan();
    const plan = buildQuestionPlan(question, String(key || question?.id || fallbackKey));
    if (!plan) return emptyPlan();
    planMap.set(plan.key, plan);
    return planSummary(plan);
  }

  function clearResultReviewQuestions() {
    resultReviewQuestionPlans.clear();
  }

  function prepareResultReviewQuestion(question, key) {
    return prepareQuestionPlan(resultReviewQuestionPlans, question, key, 'result-review-question');
  }

  function clearDirectoryQuestions() {
    directoryQuestionPlans.clear();
  }

  function prepareDirectoryQuestion(question, key) {
    return prepareQuestionPlan(directoryQuestionPlans, question, key, 'directory-question');
  }

  function clearExamQuestions() {
    examQuestionPlans.clear();
  }

  function prepareExamQuestion(question, key) {
    return prepareQuestionPlan(examQuestionPlans, question, key, 'exam-question');
  }

  function mountForPlan(root, plan, role, scope = '') {
    if (!plan) return null;
    const scopeSelector = scope ? `[data-mora-block-scope="${scope}"]` : '';
    const candidates = root?.querySelectorAll(`[data-mora-block-render="${role}"]${scopeSelector}`) || [];
    for (const candidate of candidates) {
      if (candidate.dataset.moraBlockKey === plan.key) return candidate;
    }
    return null;
  }

  function mountFor(root, role) {
    return mountForPlan(root, activeQuestionPlan, role);
  }

  async function renderIntoMount(mount, blocks, role, rendererModule, plan = activeQuestionPlan) {
    if (!mount || !blocks.length || !plan || typeof rendererModule?.renderBlocks !== 'function') return false;
    const temp = document.createElement('div');
    rendererModule.renderBlocks(blocks, temp, plan.context, { role });
    mount.replaceChildren(...Array.from(temp.childNodes));
    mount.dataset.moraBlockRendered = 'true';
    return true;
  }

  async function hydrateActiveQuestion(root = document) {
    if (!isEnabled() || !activeQuestionPlan) return false;
    try {
      const rendererModule = await loadRendererModule();
      const renderedBody = await renderIntoMount(mountFor(root, 'body'), activeQuestionPlan.bodyBlocks, 'body', rendererModule, activeQuestionPlan);
      const renderedExplanation = await renderIntoMount(mountFor(root, 'explanation'), activeQuestionPlan.explanationBlocks, 'explanation', rendererModule, activeQuestionPlan);
      return renderedBody || renderedExplanation;
    } catch (error) {
      if (window._appSettings?.debug_renderer_bridge === true) {
        console.warn('Mora block renderer bridge fell back to flat rendering.', error);
      }
      return false;
    }
  }

  async function hydrateViewAll(root = document) {
    if (!isEnabled() || !viewAllQuestionPlans.size) return false;
    try {
      const rendererModule = await loadRendererModule();
      let rendered = false;
      for (const plan of viewAllQuestionPlans.values()) {
        const renderedBody = await renderIntoMount(
          mountForPlan(root, plan, 'body', 'view-all'),
          plan.bodyBlocks,
          'body',
          rendererModule,
          plan
        );
        const renderedExplanation = await renderIntoMount(
          mountForPlan(root, plan, 'explanation', 'view-all'),
          plan.explanationBlocks,
          'explanation',
          rendererModule,
          plan
        );
        rendered = rendered || renderedBody || renderedExplanation;
      }
      return rendered;
    } catch (error) {
      if (window._appSettings?.debug_renderer_bridge === true) {
        console.warn('Mora View All block renderer bridge fell back to flat rendering.', error);
      }
      return false;
    }
  }

  async function hydrateQuestionPlans(root, planMap, scope, label) {
    if (!isEnabled() || !planMap.size) return false;
    try {
      const rendererModule = await loadRendererModule();
      let rendered = false;
      for (const plan of planMap.values()) {
        const renderedBody = await renderIntoMount(
          mountForPlan(root, plan, 'body', scope),
          plan.bodyBlocks,
          'body',
          rendererModule,
          plan
        );
        const renderedExplanation = await renderIntoMount(
          mountForPlan(root, plan, 'explanation', scope),
          plan.explanationBlocks,
          'explanation',
          rendererModule,
          plan
        );
        rendered = rendered || renderedBody || renderedExplanation;
      }
      return rendered;
    } catch (error) {
      if (window._appSettings?.debug_renderer_bridge === true) {
        console.warn(`Mora ${label} block renderer bridge fell back to flat rendering.`, error);
      }
      return false;
    }
  }

  function hydrateResultReview(root = document) {
    return hydrateQuestionPlans(root, resultReviewQuestionPlans, 'results-review', 'results review');
  }

  function hydrateDirectory(root = document) {
    return hydrateQuestionPlans(root, directoryQuestionPlans, 'directory', 'Question Directory');
  }

  function hydrateExam(root = document) {
    return hydrateQuestionPlans(root, examQuestionPlans, 'exam', 'exam');
  }

  Object.assign(bridge, {
    isEnabled,
    hasBlockContent,
    prepareActiveQuestion,
    hydrateActiveQuestion,
    clearViewAllQuestions,
    prepareViewAllQuestion,
    hydrateViewAll,
    clearResultReviewQuestions,
    prepareResultReviewQuestion,
    hydrateResultReview,
    clearDirectoryQuestions,
    prepareDirectoryQuestion,
    hydrateDirectory,
    clearExamQuestions,
    prepareExamQuestion,
    hydrateExam
  });
})();
