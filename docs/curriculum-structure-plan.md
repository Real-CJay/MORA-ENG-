# Mora Quiz Curriculum Structure Plan

Stage 6.0I establishes the curriculum registry without changing live quiz behavior. Mora Quiz remains a static HTML/CSS/JavaScript app with classic scripts, Supabase, lazy-loaded `subject_data/*.js`, and the existing `quiz_app.js` quiz engine.

## Correct Hierarchy

The curriculum hierarchy is:

```text
Semester -> Department/Stream if any -> Module/Subject -> Quiz Modes -> Questions
```

Semester is above module/subject because departments and shared modules are properties of a semester. A module can be common to everyone in one semester, department-specific in a later semester, or shared by multiple departments without duplicating question data.

Do not model this as `Subject -> Semester`.

## Current Live Data

Only Semester 1 is real registry data in this stage.

```text
Semester 1
`-- Common Modules
    |-- materials
    |-- mechanics
    |-- fluid
    `-- math
```

Computer Science remains quarantined. Do not add CS to `SUBJECTS`, `subject_data/`, live `content/question-packs/`, or live `IMAGES/CS/` until a later approved import stage. When CS eventually lands, it must land as `Semester 1 -> Common Modules -> Computer Science`.

## Registry Approach

The real curriculum registry lives in `js/curriculum_registry.js`.

The app keeps a flat module registry in `SUBJECTS` inside `quiz_data.js`. Each module keeps its stable key and carries curriculum metadata:

```js
{
  key: 'mechanics',
  semesterId: 'sem1',
  departmentIds: ['all']
}
```

`departmentIds: ['all']` means a common/shared module. A future value such as `['mechanical']` would mean visible only to that department. A future value such as `['civil', 'mechanical']` would mean shared by those departments while still using one module entry and one question dataset.

Shared modules must not duplicate question data.

## Locked Helpers

`js/curriculum_registry.js` exposes classic-script globals:

```text
getSemesters()
getDepartments(semesterId)
getModules(semesterId, departmentId?)
isArchived(semesterId)
```

Expected behavior:

- `getSemesters()` returns semesters, active first.
- `getDepartments('sem1')` returns `null` because Semester 1 is common.
- `getModules('sem1')` returns the current live modules from `SUBJECTS`.
- `isArchived('sem1')` returns `false`.

## Future Stages

Stage 6.0J should use the registry to introduce semester/common-module navigation without changing the quiz engine.

Stage 6.0K should adapt route/state identity around the hierarchy while preserving current subject/module quiz behavior.

Stage 6.0L should audit and adapt progress, save, offline, flag, and question-pack identity so shared modules do not collide or duplicate data.

Stage 6.0M should audit storage and migration risk before any production identity changes.

Stage 6.0N should validate future departmental semester data only after real department names are confirmed.

Stage 6.0O should handle any later live import paths, including CS, only after review and approval.

The existing quiz engine still owns setup screens, quiz modes, View All, Question Directory, exam mode, target practice, saving, offline behavior, and rendering. This registry is the curriculum layer above that engine, not a separate quiz system.
