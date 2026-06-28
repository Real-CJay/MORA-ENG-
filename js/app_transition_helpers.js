// app_transition_helpers.js - Subject transition config and preload helpers.
(function () {
  'use strict';

  const MoraSubjectData = window.MoraSubjectData;
  if (!MoraSubjectData) {
    throw new Error('MoraSubjectData must load before app_transition_helpers.js');
  }

  const rootAssetPath = MoraSubjectData.rootAssetPath;
  const transitionHelpers = window.MoraTransitionHelpers = window.MoraTransitionHelpers || {};

  const SUBJECT_TRANSITIONS = {
    materials: {
      title: 'No Engineering without Materials',
      image: 'assets/materials-transition.png',
      caption: 'Parallelepiped'
    },
    math: {
      title: 'Good Choice',
      image: 'assets/math-transition.png',
      caption: ''
    }
  };

  const TRANSITION_SEEN_KEY = 'mora_transition_seen_v1';

  function hasSeenTransition(subjectKey) {
    try {
      const seen = JSON.parse(localStorage.getItem(TRANSITION_SEEN_KEY) || '{}');
      return seen[subjectKey] === true;
    } catch(e) { return false; }
  }

  function markTransitionSeen(subjectKey) {
    try {
      const seen = JSON.parse(localStorage.getItem(TRANSITION_SEEN_KEY) || '{}');
      seen[subjectKey] = true;
      localStorage.setItem(TRANSITION_SEEN_KEY, JSON.stringify(seen));
    } catch(e) {}
  }

  const _subjectTransitionImageCache = {};

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function preloadImage(src) {
    if (!src) return Promise.resolve();
    if (_subjectTransitionImageCache[src]) return _subjectTransitionImageCache[src];
    _subjectTransitionImageCache[src] = new Promise(resolve => {
      const img = new Image();
      img.onload = async () => {
        try {
          if (img.decode) await img.decode();
        } catch(e) {}
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = src;
    });
    return _subjectTransitionImageCache[src];
  }

  function preloadSubjectTransitionAssets() {
    Object.values(SUBJECT_TRANSITIONS).forEach(item => preloadImage(rootAssetPath(item.image)));
  }

  transitionHelpers.SUBJECT_TRANSITIONS = SUBJECT_TRANSITIONS;
  transitionHelpers.TRANSITION_SEEN_KEY = TRANSITION_SEEN_KEY;
  transitionHelpers.hasSeenTransition = hasSeenTransition;
  transitionHelpers.markTransitionSeen = markTransitionSeen;
  transitionHelpers.wait = wait;
  transitionHelpers.preloadImage = preloadImage;
  transitionHelpers.preloadSubjectTransitionAssets = preloadSubjectTransitionAssets;

  window.SUBJECT_TRANSITIONS = SUBJECT_TRANSITIONS;
  window.TRANSITION_SEEN_KEY = TRANSITION_SEEN_KEY;
  window.hasSeenTransition = hasSeenTransition;
  window.markTransitionSeen = markTransitionSeen;
  window.wait = wait;
  window.preloadImage = preloadImage;
  window.preloadSubjectTransitionAssets = preloadSubjectTransitionAssets;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(preloadSubjectTransitionAssets, 250), { once: true });
  } else {
    setTimeout(preloadSubjectTransitionAssets, 250);
  }
})();
