// curriculum_module_adapter.js - Validates curriculum selections before opening live modules.
// Classic script only. The adapter maps approved curriculum context to existing SUBJECTS keys.
(function () {
  'use strict';

  const CURRENT_LIVE_MODULE_KEYS = ['materials', 'mechanics', 'fluid', 'math'];

  function subjectRegistry() {
    if (typeof SUBJECTS !== 'undefined') return SUBJECTS;
    return window.SUBJECTS || {};
  }

  function normalizeId(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function liveContext() {
    return {
      subjects: subjectRegistry(),
      getSemesters: window.getSemesters,
      getDepartments: window.getDepartments,
      getModules: window.getModules,
      isArchived: window.isArchived
    };
  }

  function fail(error) {
    return { result: null, error };
  }

  function helpersAvailable(context) {
    return context
      && context.subjects
      && typeof context.subjects === 'object'
      && typeof context.getSemesters === 'function'
      && typeof context.getDepartments === 'function'
      && typeof context.getModules === 'function'
      && typeof context.isArchived === 'function';
  }

  function resolveModuleSelectionCore(selection, context) {
    if (!helpersAvailable(context)) {
      return fail('Curriculum registry helpers are unavailable.');
    }
    if (!selection || typeof selection !== 'object') {
      return fail('Selection object is required.');
    }

    const semesterId = normalizeId(selection.semesterId);
    const departmentId = normalizeId(selection.departmentId);
    const moduleKey = normalizeId(selection.moduleKey);

    if (!semesterId) return fail('semesterId is required.');
    if (!moduleKey) return fail('moduleKey is required.');

    const semesters = context.getSemesters();
    const semester = Array.isArray(semesters)
      ? semesters.find(item => item && item.id === semesterId)
      : null;
    if (!semester) return fail(`Unknown semester: ${semesterId}.`);
    if (context.isArchived(semesterId)) return fail(`Semester is archived: ${semesterId}.`);

    const subjectEntry = context.subjects[moduleKey];
    if (!subjectEntry) return fail(`Unknown module: ${moduleKey}.`);
    if (subjectEntry.key !== moduleKey) {
      return fail(`Module key mismatch for ${moduleKey}.`);
    }
    if (subjectEntry.semesterId !== semesterId) {
      return fail(`Module ${moduleKey} does not belong to semester ${semesterId}.`);
    }

    const moduleDepartmentIds = Array.isArray(subjectEntry.departmentIds)
      ? subjectEntry.departmentIds
      : [];
    const departments = context.getDepartments(semesterId);
    let modulesForSelection;

    if (departments === null) {
      if (!moduleDepartmentIds.includes('all')) {
        return fail(`Module ${moduleKey} is not available as a common module.`);
      }
      modulesForSelection = context.getModules(semesterId);
    } else {
      if (!Array.isArray(departments)) {
        return fail(`Department registry is invalid for semester ${semesterId}.`);
      }
      if (!departmentId) {
        return fail(`departmentId is required for semester ${semesterId}.`);
      }
      const departmentExists = departments.some(department => department && department.id === departmentId);
      if (!departmentExists) {
        return fail(`Unknown department ${departmentId} for semester ${semesterId}.`);
      }
      if (!moduleDepartmentIds.includes('all') && !moduleDepartmentIds.includes(departmentId)) {
        return fail(`Module ${moduleKey} is not available to department ${departmentId}.`);
      }
      modulesForSelection = context.getModules(semesterId, departmentId);
    }

    const moduleConfirmed = Array.isArray(modulesForSelection)
      && modulesForSelection.some(module => module && module.key === moduleKey);
    if (!moduleConfirmed) {
      return fail(`Registry helpers did not confirm module ${moduleKey} for the selected context.`);
    }

    return {
      result: {
        dataKey: moduleKey,
        subjectEntry
      },
      error: ''
    };
  }

  function resolveModuleSelection(selection) {
    const outcome = resolveModuleSelectionCore(selection, liveContext());
    resolveModuleSelection.lastError = outcome.error || '';
    return outcome.result;
  }
  resolveModuleSelection.lastError = '';

  function adapterAssert(condition, message) {
    if (!condition) {
      throw new Error(`Curriculum module adapter assertion failed: ${message}`);
    }
  }

  function assertRefuses(selection, message) {
    const outcome = resolveModuleSelectionCore(selection, liveContext());
    adapterAssert(outcome.result === null, message);
  }

  function createAdapterAssertionFixtureContext() {
    const subjects = {
      fixture_common: {
        key: 'fixture_common',
        semesterId: 'fixture_sem1',
        departmentIds: ['all']
      },
      fixture_dept: {
        key: 'fixture_dept',
        semesterId: 'fixture_sem2',
        departmentIds: ['mechanical']
      },
      fixture_archived_module: {
        key: 'fixture_archived_module',
        semesterId: 'fixture_archived',
        departmentIds: ['all']
      }
    };
    const semesters = [
      { id: 'fixture_sem1', label: 'Fixture Common', type: 'common', active: true, departments: null },
      {
        id: 'fixture_sem2',
        label: 'Fixture Departmental',
        type: 'departmental',
        active: true,
        departments: {
          mechanical: { id: 'mechanical', label: 'Mechanical' },
          civil: { id: 'civil', label: 'Civil' }
        }
      },
      { id: 'fixture_archived', label: 'Fixture Archived', type: 'common', active: false, departments: null }
    ];
    return {
      subjects,
      getSemesters: () => semesters,
      getDepartments: semesterId => {
        const semester = semesters.find(item => item.id === semesterId);
        if (!semester || semester.type === 'common') return null;
        return Object.values(semester.departments || {});
      },
      getModules: (semesterId, departmentId) => Object.values(subjects).filter(subject => {
        if (subject.semesterId !== semesterId) return false;
        const departmentIds = Array.isArray(subject.departmentIds) ? subject.departmentIds : [];
        return departmentIds.includes('all') || Boolean(departmentId && departmentIds.includes(departmentId));
      }),
      isArchived: semesterId => {
        const semester = semesters.find(item => item.id === semesterId);
        return Boolean(semester && !semester.active);
      }
    };
  }

  function runCurriculumModuleAdapterAssertions() {
    const context = liveContext();
    const subjects = context.subjects || {};

    CURRENT_LIVE_MODULE_KEYS.forEach(moduleKey => {
      const outcome = resolveModuleSelectionCore({ semesterId: 'sem1', moduleKey }, context);
      adapterAssert(!!outcome.result, `sem1 + ${moduleKey} resolves`);
      adapterAssert(outcome.result.dataKey === moduleKey, `${moduleKey} dataKey matches module key`);
      adapterAssert(outcome.result.subjectEntry === subjects[moduleKey], `${moduleKey} subjectEntry is existing SUBJECTS entry`);
    });

    const noDepartment = resolveModuleSelectionCore({ semesterId: 'sem1', departmentId: null, moduleKey: 'materials' }, context);
    adapterAssert(!!noDepartment.result, 'sem1 does not require a department');

    assertRefuses({ moduleKey: 'materials' }, 'missing semester refuses');
    assertRefuses({ semesterId: 'sem1' }, 'missing module refuses');
    assertRefuses({ semesterId: 'unknown_semester', moduleKey: 'materials' }, 'unknown semester refuses');
    assertRefuses({ semesterId: 'sem1', moduleKey: 'unknown_module' }, 'unknown module refuses');

    const fixtureContext = createAdapterAssertionFixtureContext();
    adapterAssert(
      resolveModuleSelectionCore({ semesterId: 'fixture_sem2', moduleKey: 'fixture_common' }, fixtureContext).result === null,
      'mismatched semester/module selection refuses'
    );
    adapterAssert(
      resolveModuleSelectionCore({ semesterId: 'fixture_sem2', moduleKey: 'fixture_dept' }, fixtureContext).result === null,
      'departmental semester requires department'
    );
    adapterAssert(
      resolveModuleSelectionCore({ semesterId: 'fixture_sem2', departmentId: 'civil', moduleKey: 'fixture_dept' }, fixtureContext).result === null,
      'module not available to selected department refuses'
    );
    adapterAssert(
      !!resolveModuleSelectionCore({ semesterId: 'fixture_sem2', departmentId: 'mechanical', moduleKey: 'fixture_dept' }, fixtureContext).result,
      'departmental module resolves for matching department'
    );
    adapterAssert(
      resolveModuleSelectionCore({ semesterId: 'fixture_archived', moduleKey: 'fixture_archived_module' }, fixtureContext).result === null,
      'archived semester refuses'
    );
  }

  Object.assign(window, {
    resolveModuleSelection,
    runCurriculumModuleAdapterAssertions
  });

  runCurriculumModuleAdapterAssertions();
})();
