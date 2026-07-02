// curriculum_registry.js - Semester/department/module registry helpers.
// Classic script only. Live quiz behavior still runs through quiz_data.js + quiz_app.js.
(function () {
  'use strict';

  const SEMESTERS = {
    sem1: {
      id: 'sem1',
      label: 'Semester 1',
      type: 'common',
      active: true,
      departments: null
    },

    // Semester 2 and beyond are added later, once real department names are confirmed.
    // Example only - do not add as real data yet:
    // sem2: {
    //   id: 'sem2',
    //   label: 'Semester 2',
    //   type: 'departmental',
    //   active: true,
    //   departments: {
    //     mechanical: { id: 'mechanical', label: 'Mechanical Engineering' },
    //     electrical: { id: 'electrical', label: 'Electrical Engineering' }
    //   }
    // }
  };

  const CURRICULUM_REQUIRED_MODULES = ['materials', 'mechanics', 'fluid', 'math'];

  function subjectRegistry() {
    if (typeof SUBJECTS !== 'undefined') return SUBJECTS;
    return window.SUBJECTS || {};
  }

  function getSemesters() {
    return Object.values(SEMESTERS)
      .map((semester, index) => ({ semester, index }))
      .sort((a, b) => {
        if (Boolean(a.semester.active) !== Boolean(b.semester.active)) {
          return a.semester.active ? -1 : 1;
        }
        return a.index - b.index;
      })
      .map(entry => entry.semester);
  }

  function getDepartments(semesterId) {
    const semester = SEMESTERS[semesterId];
    if (!semester || semester.type === 'common') return null;
    return Object.values(semester.departments || {});
  }

  function getModules(semesterId, departmentId) {
    if (!SEMESTERS[semesterId]) return [];
    return Object.values(subjectRegistry()).filter(subject => {
      if (!subject || subject.semesterId !== semesterId) return false;
      const departmentIds = Array.isArray(subject.departmentIds) ? subject.departmentIds : [];
      return departmentIds.includes('all') || Boolean(departmentId && departmentIds.includes(departmentId));
    });
  }

  function isArchived(semesterId) {
    const semester = SEMESTERS[semesterId];
    return Boolean(semester && !semester.active);
  }

  function registryAssert(condition, message) {
    if (!condition) {
      throw new Error(`Curriculum registry assertion failed: ${message}`);
    }
  }

  function runCurriculumRegistryAssertions() {
    const subjects = subjectRegistry();
    registryAssert(!!SEMESTERS.sem1, 'sem1 exists');
    registryAssert(SEMESTERS.sem1.type === 'common', 'sem1 is type common');
    registryAssert(SEMESTERS.sem1.departments === null, 'sem1 departments is null');
    registryAssert(getDepartments('sem1') === null, 'getDepartments("sem1") returns null');
    registryAssert(isArchived('sem1') === false, 'isArchived("sem1") returns false');

    CURRICULUM_REQUIRED_MODULES.forEach(moduleKey => {
      const subject = subjects[moduleKey];
      registryAssert(!!subject, `${moduleKey} module exists`);
      registryAssert(subject.semesterId === 'sem1', `${moduleKey} semesterId is sem1`);
      registryAssert(
        Array.isArray(subject.departmentIds) && subject.departmentIds.includes('all'),
        `${moduleKey} departmentIds includes all`
      );
    });

    const sem1ModuleKeys = new Set(getModules('sem1').map(module => module.key));
    CURRICULUM_REQUIRED_MODULES.forEach(moduleKey => {
      registryAssert(sem1ModuleKeys.has(moduleKey), `getModules("sem1") includes ${moduleKey}`);
    });
  }

  Object.assign(window, {
    SEMESTERS,
    CURRICULUM_REQUIRED_MODULES,
    getSemesters,
    getDepartments,
    getModules,
    isArchived,
    runCurriculumRegistryAssertions
  });

  runCurriculumRegistryAssertions();
})();
