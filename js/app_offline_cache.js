// app_offline_cache.js - Non-UI offline cache helpers.
(function () {
  'use strict';

  const offlineCache = window.MoraOfflineCache = window.MoraOfflineCache || {};
  const subjectData = window.MoraSubjectData;
  if (!subjectData) {
    throw new Error('MoraSubjectData must load before app_offline_cache.js');
  }

  async function _cacheSubjectData(subjectKey) {
    const src = subjectData.rootAssetPath(`subject_data/${subjectKey}.js?v=${subjectData.SUBJECT_DATA_VERSION}`);
    if (navigator.serviceWorker?.controller) {
      await new Promise(resolve => {
        const ch = new MessageChannel();
        ch.port1.onmessage = () => resolve();
        navigator.serviceWorker.controller.postMessage(
          { type: 'CACHE_SUBJECT', url: src, subjectKey },
          [ch.port2]
        );
        setTimeout(resolve, 8000);
      });
    } else {
      await fetch(src).catch(() => {});
    }
  }

  async function _cacheImages(urls) {
    if (!urls.length) return;
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CACHE_IMAGES', urls });
    } else {
      await Promise.allSettled(urls.map(u => fetch(u).catch(() => {})));
    }
  }

  offlineCache.cacheSubjectData = _cacheSubjectData;
  offlineCache.cacheImages = _cacheImages;

  window._cacheSubjectData = _cacheSubjectData;
  window._cacheImages = _cacheImages;
})();
