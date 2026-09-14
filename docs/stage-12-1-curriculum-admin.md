# Stage 12.1 — Curriculum admin interface

Implemented locally; no hosted SQL, deployment, R2 activation or content uploads.
Live use needs Stage 11's separately authorized migration. No new migration is
introduced. Stage 12.2 adds placement/order/publication/archive controls; R2
image uploads remain 12.3 and dynamic content delivery remains 12.4.

Backend update, 2026-09-14: Stage 11's migration is now applied to the existing
live project and the public curriculum endpoint returns HTTP 200. See the
[migration mapping and verification](stage-11-curriculum.md). The local app can
now use that backend; this does not deploy the frontend. Use `/admin` in the
normal app for real access, not `/curriculum-admin-test` (synthetic only).

## Feature map and boundaries

- `js/app_curriculum_admin.js`: classic-script `MoraCurriculumAdmin` with
  `open({host})`, `close()`, `canLeave()` and `checkAccess()`. Owns the hierarchy,
  forms and temporary admin snapshot. No direct database, storage or save calls.
- `js/app_admin_tabs.js`: Curriculum tab, lifecycle cleanup and unsaved-edit
  confirmation. Existing Statistics, Sample bank and Settings remain unchanged.
- `quiz_app.js`: route/render discard guards. Browser back cancellation restores
  the admin URL; account changes always clear private state without confirmation.
- Existing `MoraCurriculum.adminSnapshot()` and `write()` provide authenticated
  snapshot/revision operations. Existing SQL controls authorization; UI gating
  is not the security boundary. No user-metadata authorization or service keys.

The folder hierarchy shows existing placements. All modules is the independent
module catalog; creating a module does not place it in a semester. New records
receive a generated entity-prefix/UUID identity and default to draft. Parents,
semester kind after creation, IDs and status are read-only. Only labels and
module descriptions can be edited; published edits require explicit confirmation.
Archived records are read-only. No sample entries are added to real curriculum.

Save sends changed fields only and uses the snapshot revision. Duplicate submit
and offline writes are blocked. Conflicts retain values and require reload/review.
Uncertain outcomes also require a fresh snapshot: matching saved values reconcile
without another write, otherwise the user explicitly reviews and resubmits with
the same ID. Outstanding requests may still finish after timeout or leaving;
there is no automatic retry or assumption of rollback. Inputs are locked while
awaiting reconciliation. Read/write waits are bounded to ten seconds in this UI.

Drafts and form values live in memory only. They are cleared on leaving, account
change or access revocation. App/tab navigation and page unload warn about unsaved
edits; account/security cleanup cannot be cancelled. Public registry caches remain
published-only. No changes to question IDs, banks, scoring or progress.

## Manual verification (safe synthetic route)

From the repository root:

```powershell
$env:MORA_TEST_PORT='4183'
node tests/serve.cjs --curriculum-admin --samples
```

Open `http://127.0.0.1:4183/curriculum-admin-test` → **Curriculum**.
This explicit harness uses the actual components and registry with in-memory
synthetic RPC responses. It does not contact Supabase or load real question banks.

1. New semester → enter a label and choose departmental → Save. It appears as a
   draft with a generated ID. Expand it → New department → Save; expand that
   department → New stream → Save. No predefined departments are auto-created.
2. All modules → New module → label/description → Save. It is draft, unplaced,
   and has no content. Select it again and change its label; its ID stays fixed.
3. Open Synthetic math from either existing placement. Change its label and Save.
   Cancel the public-change confirmation: nothing changes. Repeat and confirm:
   every appearance references the same renamed module.
4. All modules → Archived fixture: fields/Save are disabled. No publish, archive,
   placement, ordering or upload controls are present in this stage.
5. Enter an unsaved edit, then select Settings. Cancel keeps the form; accepting
   discards it. Arrow keys/Home/End navigate the tab bar. Test at mobile width.
6. Toggle offline: Save is disabled. Return online; explicit retry works. Student
   and Guest buttons deny access and clear private forms. Reset fixture reloads
   the synthetic state. It does not affect real curriculum or progress.

Browser regression script: `tests/curriculum-admin.browser.js`. It additionally
simulates conflicts, lost acknowledgements, failed reads, duplicate submissions,
malicious labels and account/tab changes during requests. Existing sample/admin
tab regressions remain in `tests/admin-tabs.browser.js` using `/sample-explorer-test`.

```powershell
node --test tests/*.test.cjs
python -B tools/check_sync.py --base 91db07f --reviewed
git diff --check
```

The Node suite includes real Stage 11 SQL execution in isolated PGlite with
guest/student/admin permissions. Browser RPCs are mocks, not proof of hosted
Auth/PostgREST behavior. Hosted verification remains a release gate after separate
migration/deployment approval; never test creation against production accidentally.

After authorized deployment, use Admin Dashboard → Curriculum. Existing published
label changes affect public metadata immediately after a confirmed save; draft
creation does not make content available to students. Shell assets use version 89
and the service worker uses cache v92.
