// app_quiz_utils.js - Small quiz utility helpers for classic app scripts.
(function () {
  'use strict';

  const quizUtils = window.MoraQuizUtils = window.MoraQuizUtils || {};

  function shuffle(arr) {
    let a = [...arr];
    for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }

  function shuffleQuestionOptions(q) {
    // Build an indexed list of options, shuffle them, update ans index
    const correctText = q.opts[q.ans];
    const indices = q.opts.map((_,i) => i);
    // Fisher-Yates on indices
    for (let i=indices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
    const newOpts = indices.map(i => q.opts[i]);
    const newAns = newOpts.indexOf(correctText);
    return {...q, opts: newOpts, ans: newAns};
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + String(sec).padStart(2, '0');
  }

  function unitClass(u) { return ['unit1','unit2','unit3','unit4','unit5','unit6','unit7','unit8'][u-1] || ''; }

  function clampQuestionCount(value, maxAvailable) {
    const max = Math.max(1, parseInt(maxAvailable, 10) || 1);
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) return Math.min(20, max);
    return Math.min(n, max);
  }

  quizUtils.shuffle = shuffle;
  quizUtils.shuffleQuestionOptions = shuffleQuestionOptions;
  quizUtils.formatTime = formatTime;
  quizUtils.unitClass = unitClass;
  quizUtils.clampQuestionCount = clampQuestionCount;

  window.shuffle = shuffle;
  window.shuffleQuestionOptions = shuffleQuestionOptions;
  window.formatTime = formatTime;
  window.unitClass = unitClass;
  window.clampQuestionCount = clampQuestionCount;
})();
