# Stage 11 — Dynamic curriculum foundation

The reviewed curriculum migration was applied to the existing MORA QUIZ project
on 2026-09-14 with explicit user authorization to fix missing curriculum RPCs.
Remote migration tracking: `20260914103259_dynamic_curriculum`; local source:
`20260913194332_dynamic_curriculum.sql`. These are the same migration; do not
replay it because the tool-assigned timestamp differs. No frontend push/deployment.
Admin editing/upload screens remain Stage 12; enrollment Stage 13.

Verification: isolated migration test passed; the live public PostgREST snapshot
returned HTTP 200, published visibility, revision 1 and four modules. Guest admin
snapshot returned HTTP 401. SQL role-based admin snapshot and no-op update passed
inside a rolled-back transaction, leaving catalog revision/content unchanged.
Actual signed-in browser editing remains a manual check. Security advisors found
no curriculum-specific warnings; unrelated legacy view/function/Auth notices
remain outstanding and were not changed by this repair.

## Contract

- `curriculum_semesters` → `curriculum_departments` → `curriculum_streams`.
- `curriculum_modules` holds one immutable module ID; `curriculum_placements`
  links it to a semester and optional department/stream. Shared placements never
  duplicate banks, question arrays, answers or progress keys.
- IDs are lowercase letters/digits/underscore/hyphen, start with a letter,
  maximum 64 characters. Labels, ordering and draft/published/archived status
  are editable. New rows default to draft; used records are archived, not deleted.
- Only the existing Semester 1/four bundled modules are seeded. Other semesters,
  departments and streams are not invented. Mechanical streams can be created
  through the later administration workflow.
- Composite foreign keys enforce placement ancestry; unique placement tuples
  prevent duplicate membership. The write RPC additionally enforces departmental
  semester kinds and published parent chains. Archiving a parent hides its
  descendants without deleting them. Republish parents before children.
- Module `content_kind` is `none` or `bundled`; bundled is restricted to the four
  existing keys. Metadata-only modules appear unavailable. No uploaded content,
  renderer, scoring, enrollment or purchase behavior is introduced.
- Safe colors are six-digit hex; icons are local choices. Labels/descriptions
  are escaped text. Per-placement ordering determines module order in a view.

## Backend API and permissions

`curriculum_snapshot(p_admin=false)` returns a consistent JSON snapshot with
`schemaVersion: 1`, `visibility`, `revision` and all five arrays. Public reads
include only published chains even when requested by an administrator. Admin
snapshots include drafts/archives but require protected `user_profiles.is_admin`.

`curriculum_write(p_entity,p_action,p_id,p_patch,p_revision)` accepts one create,
update or archive operation. Entity names are the five plural collection names.
It validates an allowlisted patch, locks the singleton revision and returns the
new revision only after the write succeeds. A stale revision raises
`CATALOG_CONFLICT`; reload and reconcile rather than retrying over newer edits.
Missing responses are not confirmation: read the snapshot before deciding
whether to retry. IDs cannot be patched. Direct client writes/deletes are denied,
including for admins; all edits must use this operation to maintain revisions.

RLS and explicit grants protect every table. Public wrappers are invokers;
private security-definer helpers use an empty search path and check admin status.
Keep `mora_private` out of PostgREST's exposed schemas. Existing role-escalation
and guest-analytics hardening must remain installed; this migration does not
replace or weaken it. Catalog revisions can reveal that an edit occurred, not
draft contents. Published metadata is public, not a paid-content security layer.

## Client and fallback

`MoraCurriculum.initialize/refresh/getStatus/applyPending` manages published
metadata; `adminSnapshot/write` provides confirmed online operations for future
admin screens. Existing `getSemesters/getDepartments/getModules/isArchived`
helpers remain; `getStreams` and an optional stream selection are added.

Validated published snapshots are cached under
`mora_curriculum_v1:<Supabase URL>`. Drafts never enter that cache. Startup and
reconnection refresh; stale account/navigation/request responses are ignored.
A five-second refresh timeout retains cached metadata (or bundled metadata when
no valid cache exists). Failure shows an explicit retry action, not a render loop.
A successful empty catalog stays empty. An absent migration preserves legacy
startup through the same fallback. Offline metadata may be stale until reconnect.

Refreshes during practice/exams are deferred until a safe screen boundary. They
do not replace existing question arrays. Archived/unavailable module starts are
refused; existing historical progress and downloaded assets are not erased.
Old module URLs remain valid for visible placements. Stream URLs add one segment:
`/semester/<semester>/<department>/<stream>/<module>`.

## Verification and manual checks

From the repository root (Node dependencies are local test-only):

```powershell
npm.cmd ci --prefix tests
node --test tests/*.test.cjs
python -B tools/check_sync.py --base eba6801 --reviewed
$env:MORA_TEST_PORT='4183'
node tests/serve.cjs --curriculum
```

Open `http://127.0.0.1:4183/curriculum-test`. The harness exists only on this
explicit local test-server route; no test controls are added to the production
app. It uses synthetic metadata and the real registry, adapter, module renderer
and URL resolver. It never loads real banks or calls Supabase/progress/AI APIs.

1. Reset fixture. Common semester shows four synthetic bundled modules and an
   unavailable Empty module. The latter cannot be opened.
2. Choose departmental semester → Mechanical → Mechatronics → Synthetic math.
   The displayed resolution has `dataKey: "math"`, the same identity as common math.
3. Go offline, then retry: the catalog stays usable and reports failure. Go
   online and retry: the error clears. The runtime suite separately checks cold
   cached registry initialization; this harness is not service-worker cached.
4. Archive as student: `ADMIN_REQUIRED`. Switch to admin, start simulated attempt,
   archive shared placement: it remains during the attempt. End attempt: it
   disappears from that stream, while common math remains. Reset to restore.
5. Repeat at narrow/mobile width. Optional automated browser assertions are in
   `tests/curriculum.browser.js` (run after a fresh Reset fixture).

Runtime tests cover cache corruption, missing RPC, empty catalog, invalid payloads,
stale responses, account changes, safe deferred refresh and old/stream URLs.
Isolated PGlite executes the exact SQL with guest/student/admin roles and tests
draft visibility, grants, invalid ancestry, duplicate placements, revision
conflicts, archives and unchanged synthetic progress. Browser checks use a mock
backend; database permissions are verified separately in the SQL suite.

## Database-first rollout (separate authorization required)

1. Back up and inspect the existing target's schema, protected profile flag,
   grants, exposed schemas and migration history. Follow the existing
   [database baseline](database-baseline.md); never replay historical setup files.
2. Apply only `supabase/migrations/20260913194332_dynamic_curriculum.sql` once
   through the target's migration tracking. Do not replay the prior receipt or
   limiter migration. This additive migration leaves progress tables unchanged.
3. Verify hosted guest/student published reads, denied admin RPCs, and admin
   draft reads/write/conflict behavior through Auth/PostgREST. Confirm only the
   original seeded catalog is published and private schema remains unexposed.
4. Deploy this client afterward (shell script version 88, worker cache v91).
   Check direct links, browser back/forward, account changes, cold offline startup
   and an update during an active exam on the actual deployment/device.
5. On client rollback, retain database tables and history. An older client uses
   bundled metadata and does not honor remote archives: do not use rollback to
   bypass content restrictions. Do not drop catalog records or caches blindly.

Local SQL tests do not certify hosted Auth, PostgREST, deployment policies or
device/service-worker behavior. Those release checks remain outstanding; no
additional hosted project or paid service is required by this local stage.
