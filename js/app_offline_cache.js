// A download is complete only when the controlling worker acknowledges caching.
(function () {
  'use strict';
  const subjectData = window.MoraSubjectData;
  if (!subjectData) throw new Error('MoraSubjectData must load first');
  function requestCache(message) {
    return new Promise((resolve, reject) => {
      const controller = navigator.serviceWorker?.controller;
      if (!controller) return reject(new Error('Offline storage is not ready. Reload while online and try again.'));
      const channel = new MessageChannel();
      const finish = (error, value) => {
        clearTimeout(timer);
        channel.port1.close();
        if (error) reject(error); else resolve(value);
      };
      const timer = setTimeout(() => finish(new Error('Offline download timed out. Please retry.')), 60000);
      channel.port1.onmessage = event => {
        if (event.data?.ok === true) finish(null, event.data);
        else finish(new Error('Some required files could not be saved offline. Please retry.'));
      };
      controller.postMessage(message, [channel.port2]);
    });
  }
  function cacheSubjectData(subjectKey) {
    const url = subjectData.rootAssetPath(`subject_data/${subjectKey}.js?v=${subjectData.SUBJECT_DATA_VERSION}`);
    return requestCache({ type: 'CACHE_SUBJECT', url, subjectKey });
  }
  function cacheImages(urls) {
    return urls.length ? requestCache({ type: 'CACHE_IMAGES', urls }) : Promise.resolve();
  }
  window.MoraOfflineCache = { cacheSubjectData, cacheImages };
  window._cacheSubjectData = cacheSubjectData;
  window._cacheImages = cacheImages;
})();
