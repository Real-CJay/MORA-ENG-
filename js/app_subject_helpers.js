// app_subject_helpers.js - Small subject helper functions for classic app scripts.
(function () {
  'use strict';

  const MoraSubjectData = window.MoraSubjectData;
  if (!MoraSubjectData) {
    throw new Error('MoraSubjectData must load before app_subject_helpers.js');
  }

  const subjectHelpers = window.MoraSubjectHelpers = window.MoraSubjectHelpers || {};
  const subjectCount = MoraSubjectData.subjectCount;

  function subjectCategoryCount(subjectKey, mode) {
    if (mode === 'target') return subjectCount(subjectKey, 'allTarget');
    return subjectCount(subjectKey, 'pastUnit') + subjectCount(subjectKey, 'pastPaper');
  }

  subjectHelpers.subjectCategoryCount = subjectCategoryCount;

  window.subjectCategoryCount = subjectCategoryCount;
})();
