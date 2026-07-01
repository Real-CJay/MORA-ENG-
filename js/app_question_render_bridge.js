(function () {
  'use strict';

  const bridge = window.MoraQuestionRenderBridge = window.MoraQuestionRenderBridge || {};
  const RENDERER_MODULE_PATH = '/js/question_renderer.js';
  const bridgeScriptUrl = document.currentScript?.src || '';
  let rendererModulePromise = null;
  let activeQuestionPlan = null;

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

  function prepareActiveQuestion(question) {
    activeQuestionPlan = null;
    if (!isEnabled() || !question || !hasBlockContent(question)) {
      return { enabled: false, hasBody: false, hasExplanation: false, key: '' };
    }

    const bodyBlocks = bodyBlocksFor(question);
    const explanationBlocks = explanationBlocksFor(question);
    const key = String(question.id || 'active-question');
    activeQuestionPlan = {
      key,
      question,
      bodyBlocks,
      explanationBlocks,
      context: {
        question,
        images: imageRegistryFor(question),
        imageRegistry: imageRegistryFor(question)
      }
    };

    return {
      enabled: true,
      key,
      hasBody: bodyBlocks.length > 0,
      hasExplanation: explanationBlocks.length > 0
    };
  }

  function mountFor(root, role) {
    if (!activeQuestionPlan) return null;
    const candidates = root?.querySelectorAll(`[data-mora-block-render="${role}"]`) || [];
    for (const candidate of candidates) {
      if (candidate.dataset.moraBlockKey === activeQuestionPlan.key) return candidate;
    }
    return null;
  }

  async function renderIntoMount(mount, blocks, role, rendererModule) {
    if (!mount || !blocks.length || typeof rendererModule?.renderBlocks !== 'function') return false;
    const temp = document.createElement('div');
    rendererModule.renderBlocks(blocks, temp, activeQuestionPlan.context, { role });
    mount.replaceChildren(...Array.from(temp.childNodes));
    mount.dataset.moraBlockRendered = 'true';
    return true;
  }

  async function hydrateActiveQuestion(root = document) {
    if (!isEnabled() || !activeQuestionPlan) return false;
    try {
      const rendererModule = await loadRendererModule();
      const renderedBody = await renderIntoMount(mountFor(root, 'body'), activeQuestionPlan.bodyBlocks, 'body', rendererModule);
      const renderedExplanation = await renderIntoMount(mountFor(root, 'explanation'), activeQuestionPlan.explanationBlocks, 'explanation', rendererModule);
      return renderedBody || renderedExplanation;
    } catch (error) {
      if (window._appSettings?.debug_renderer_bridge === true) {
        console.warn('Mora block renderer bridge fell back to flat rendering.', error);
      }
      return false;
    }
  }

  Object.assign(bridge, {
    isEnabled,
    hasBlockContent,
    prepareActiveQuestion,
    hydrateActiveQuestion
  });
})();
