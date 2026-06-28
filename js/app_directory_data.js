// app_directory_data.js - Question Directory data helpers.
(function () {
  'use strict';

  const directoryData = window.MoraDirectoryData = window.MoraDirectoryData || {};
  const subjectData = window.MoraSubjectData;
  if (!subjectData) {
    throw new Error('MoraSubjectData must load before app_directory_data.js');
  }

  const sourceDefs = [
    ['pastUnit', 'Unit-wise Past Paper', 'pastUnit'],
    ['pastPaper', 'Full Past Paper', 'pastPaper'],
    ['targetNormal', 'Normal Target', 'targetNormal'],
    ['targetHard', 'Hard Target', 'targetHard']
  ];

  async function ensureDirectoryDataLoaded() {
    await Promise.allSettled(Object.keys(SUBJECTS).map(key => subjectData.ensureSubjectData(key)));
  }

  function directoryRecords() {
    const rows = [];
    Object.entries(SUBJECTS).forEach(([subjectKey, s]) => {
      sourceDefs.forEach(([prop, label, source]) => {
        (s[prop] || []).forEach(q => {
          rows.push({
            id: `${subjectKey}:${source}:${q.id}`,
            subjectKey,
            subjectLabel: s.label,
            color: s.color,
            source,
            sourceLabel: label,
            unit: q.unit,
            unitLabel: q.unit ? (s.units?.[q.unit] || `Unit ${q.unit}`) : '',
            year: q.year || '',
            q
          });
        });
      });
    });
    return rows;
  }

  directoryData.ensureDirectoryDataLoaded = ensureDirectoryDataLoaded;
  directoryData.directoryRecords = directoryRecords;

  window.ensureDirectoryDataLoaded = ensureDirectoryDataLoaded;
  window.directoryRecords = directoryRecords;
})();
