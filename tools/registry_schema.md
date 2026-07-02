# Mora Quiz Programme Registry Schema

Stage 6.0I moves the semester and department layer into `js/curriculum_registry.js`. It does not change question data, rendering, routes, storage keys, or the lazy-loaded `subject_data/*.js` chunks.

## Semesters

`SEMESTERS` lives in `js/curriculum_registry.js`.

```js
const SEMESTERS = {
  sem1: {
    id: 'sem1',
    label: 'Semester 1',
    type: 'common',
    active: true,
    departments: null,
  },

  // Semester 2 and beyond are added later, once real department names are confirmed.
};
```

Fields:

- `id`: stable semester id. It should match the object key.
- `label`: user-facing semester label.
- `type`: `common` for shared-module semesters, `departmental` for future semesters with department/stream selection.
- `active`: `true` for current semesters, `false` for archived semesters that remain browsable.
- `departments`: `null` when `type` is `common`; otherwise an object of confirmed department entries.

## Subjects

Each `SUBJECTS` entry keeps the existing subject fields and adds:

```js
semesterId: 'sem1',
departmentIds: ['all'],
```

Rules:

- `semesterId` must reference a real `SEMESTERS` entry.
- `departmentIds: ['all']` means the module is shared/common within that semester.
- For department-specific modules, use department ids from that semester, for example `['civil', 'mechanical']`.
- Shared module = one subject entry with multiple `departmentIds`, never duplicated question data.
- Existing Semester 1 subjects use `semesterId: 'sem1'` and `departmentIds: ['all']`.

## Helper Functions

`js/curriculum_registry.js` exposes pure helper functions:

- `getSemesters()` returns semesters with active semesters first.
- `getDepartments(semesterId)` returns department entries, or `null` when the semester has no department layer.
- `getModules(semesterId, departmentId)` returns visible subjects for the selected semester/department.
- `isArchived(semesterId)` returns whether a semester is archived.

## Navigation Sketch

Future Stage 6.0J should wire navigation to this registry without changing the subject-card renderer itself:

1. Home opens a semester picker.
2. If there is only one semester, skip the semester picker automatically.
3. If the chosen semester has no departments, skip the department picker automatically.
4. If the chosen semester has departments, show a department picker.
5. Show the existing module/subject cards for `getModules(semesterId, departmentId)`.
6. Show an archived badge when `isArchived(semesterId)` is true.

Old semesters must remain browsable. Setting `active: false` should affect labeling/order only, not remove access.

## Registry Checker

Run:

```powershell
python tools\registry_check.py
```

The checker reports:

- missing or duplicate semester ids
- duplicate department ids
- invalid semester `type`
- `type: common` with non-null `departments`
- `type: departmental` with `departments: null`
- subject `semesterId` values that reference missing semesters
- subject `departmentIds` that reference missing departments
- empty `departmentIds` lists
- archived semesters that still have all-shared modules, as a visibility confirmation warning

Example failing case:

```js
badModule: {
  key: 'badModule',
  label: 'Bad Module',
  semesterId: 'future_semester',
  departmentIds: ['unconfirmed_department'],
}
```

Because `unconfirmed_department` is not a department in the matching semester, `registry_check.py` reports an error:

```text
ERROR: SUBJECTS.badModule.departmentIds[0]: department 'unconfirmed_department' does not exist in semester 'future_semester'
```
