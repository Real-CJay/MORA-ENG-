// app_subject_loader.js - Subject data loading and offline state helpers.
(function () {
  'use strict';

  const subjectData = window.MoraSubjectData = window.MoraSubjectData || {};

  const SUBJECT_DATA_VERSION = '82';
  const OFFLINE_V2_KEY = 'mora_offline_v2';
  const _subjectLoadPromises = {};
  const _subjectLoadErrors = {};

  function _offlineData() {
    try { return JSON.parse(localStorage.getItem(OFFLINE_V2_KEY) || '{}'); }
    catch(e) { return {}; }
  }

  function _saveOfflineData(d) {
    try { localStorage.setItem(OFFLINE_V2_KEY, JSON.stringify(d)); } catch(e) {}
  }

  function isUnitOffline(subjectKey, unitId) {
    return (_offlineData()[subjectKey]?.units || []).includes(Number(unitId));
  }

  function isPaperOffline(subjectKey, year) {
    return (_offlineData()[subjectKey]?.papers || []).includes(String(year));
  }

  function _markOfflineItem(type, subjectKey, id, on) {
    const d = _offlineData();
    if (!d[subjectKey]) d[subjectKey] = { units: [], papers: [] };
    const arr = type === 'unit' ? 'units' : 'papers';
    const val = type === 'unit' ? Number(id) : String(id);
    if (on) {
      if (!d[subjectKey][arr].includes(val)) d[subjectKey][arr].push(val);
    } else {
      d[subjectKey][arr] = d[subjectKey][arr].filter(x => x !== val);
    }
    _saveOfflineData(d);
  }

  function _hasAnyOffline(subjectKey) {
    const d = _offlineData()[subjectKey];
    return !!(d && (d.units?.length > 0 || d.papers?.length > 0));
  }

  function subjectCount(subjectKey, bucket) {
    const s = SUBJECTS[subjectKey];
    if (!s) return 0;
    const live = Array.isArray(s[bucket]) ? s[bucket].length : 0;
    if (s._questionsLoaded || live > 0) return live;
    return SUBJECT_COUNTS?.[subjectKey]?.[bucket]?.count || 0;
  }

  function subjectTotalCount(subjectKey) {
    return subjectCount(subjectKey, 'pastUnit')
      + subjectCount(subjectKey, 'pastPaper')
      + subjectCount(subjectKey, 'allTarget');
  }

  function isSubjectLoaded(subjectKey) {
    const s = SUBJECTS[subjectKey];
    return !!(s && (s._questionsLoaded || subjectTotalCount(subjectKey) === 0));
  }

  function applySubjectData(subjectKey, data) {
    const s = SUBJECTS[subjectKey];
    if (!s || !data) return false;
    s.pastUnit = Array.isArray(data.pastUnit) ? data.pastUnit : [];
    s.pastPaper = Array.isArray(data.pastPaper) ? data.pastPaper : [];
    s.targetHard = Array.isArray(data.targetHard) ? data.targetHard : [];
    s.targetNormal = Array.isArray(data.targetNormal) ? data.targetNormal : [];
    s.allTarget = [...s.targetHard, ...s.targetNormal];
    s._questionsLoaded = true;
    delete _subjectLoadErrors[subjectKey];
    return true;
  }

  function ensureSubjectData(subjectKey) {
    const s = SUBJECTS[subjectKey];
    if (!s) return Promise.reject(new Error('Unknown subject'));
    if (isSubjectLoaded(subjectKey)) return Promise.resolve(s);
    if (_subjectLoadPromises[subjectKey]) return _subjectLoadPromises[subjectKey];

    _subjectLoadPromises[subjectKey] = new Promise((resolve, reject) => {
      const existing = window.MORA_SUBJECT_CHUNKS?.[subjectKey];
      if (existing) {
        applySubjectData(subjectKey, existing);
        resolve(s);
        return;
      }

      const script = document.createElement('script');
      script.src = rootAssetPath(`subject_data/${subjectKey}.js?v=${SUBJECT_DATA_VERSION}`);
      script.async = true;
      script.onload = () => {
        const chunk = window.MORA_SUBJECT_CHUNKS?.[subjectKey];
        if (applySubjectData(subjectKey, chunk)) resolve(s);
        else {
          const err = new Error('Question data was empty or invalid.');
          _subjectLoadErrors[subjectKey] = err.message;
          reject(err);
        }
      };
      script.onerror = () => {
        const err = new Error('Could not load question data. Check your connection and try again.');
        _subjectLoadErrors[subjectKey] = err.message;
        reject(err);
      };
      document.head.appendChild(script);
    }).catch(err => {
      delete _subjectLoadPromises[subjectKey];
      throw err;
    });

    return _subjectLoadPromises[subjectKey];
  }

  function ensureAllSubjectData() {
    return Promise.allSettled(Object.keys(SUBJECTS).map(key => ensureSubjectData(key)));
  }

  function rootAssetPath(src) {
    if (!src || /^(https?:|data:|blob:|file:)/i.test(src)) return src;
    if (location.protocol === 'file:') return src;
    return '/' + String(src).replace(/^\/+/, '');
  }

  function getSubjectLoadError(subjectKey) {
    return _subjectLoadErrors[subjectKey] || '';
  }

  Object.assign(subjectData, {
    SUBJECT_DATA_VERSION,
    OFFLINE_V2_KEY,
    _offlineData,
    _saveOfflineData,
    isUnitOffline,
    isPaperOffline,
    _markOfflineItem,
    _hasAnyOffline,
    _subjectLoadPromises,
    _subjectLoadErrors,
    subjectCount,
    subjectTotalCount,
    isSubjectLoaded,
    applySubjectData,
    ensureSubjectData,
    ensureAllSubjectData,
    rootAssetPath,
    getSubjectLoadError
  });

  Object.assign(window, {
    _offlineData,
    _saveOfflineData,
    isUnitOffline,
    isPaperOffline,
    _markOfflineItem,
    _hasAnyOffline,
    subjectCount,
    subjectTotalCount,
    isSubjectLoaded,
    applySubjectData,
    ensureSubjectData,
    ensureAllSubjectData,
    rootAssetPath
  });
})();
