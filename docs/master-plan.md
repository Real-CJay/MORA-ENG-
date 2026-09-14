# Mora master roadmap

Approved direction recorded: 2026-09-09. This is the current roadmap; older
future-stage proposals are historical. Permanent guardrails remain in AGENTS.md.

Planning update approved: 2026-09-14 — gradual feature separation, R2 as the
planned image-upload provider, and bounded Stage 12 implementation units.
This approves the roadmap direction, not service activation or spending.

## Current position

- Baseline: main at `8686330`, including repairs `1573184`, `04ff920`, `f3dd264`.
- 7.0C: closed for the approved local audit/repair scope; see [closeout](stage-7-0c-closeout.md).
- Stage 8: implemented locally; see [sample bank and verification boundary](sample-bank-contract.md).
- Stage 9, including approved extensions 9.5–9.7: implemented locally; see [explorer and manual checks](stage-9-sample-explorer.md).
- Stage 10: scoped chat-controls pilot and approved minimize/mobile-split fixes implemented locally; see [dependencies and checks](stage-10-decomposition.md).
- Stage 11: implemented; curriculum migration applied to the existing live backend on 2026-09-14 to repair missing RPCs. See [verification and migration mapping](stage-11-curriculum.md). Frontend deployment remains separate.
- Stage 12.1: implemented locally; see [curriculum administration and checks](stage-12-1-curriculum-admin.md). No production migration or deployment performed.
- Next: Stage 12.2 (placements, ordering and publication). Remaining Stage 12 parts and Stages 13-19 remain unimplemented.
- Approved pre-Stage-10 maintenance: [tool compatibility checks and file inventory](tool-sync.md).
  This supports stage verification; it does not add or renumber a product stage.
- Production client revision and full hosted/device acceptance remain unverified.
- Manual CS preparation continues independently; Mechanics figures are excluded.
- Each stage remains a separate verified unit. Production SQL, deployment,
  spending, commits and pushes require separate authorization.

## Confirmed direction

The first store release remains **free and quiz-only**, but now includes:

- Admin-created semesters, departments, streams and modules.
- Student self-enrollment in **modules**, not teacher/batch classes.
- A dashboard showing only enrolled modules.
- Separate enrollment and paid-access concepts, so future purchases do not require replacing enrollment.

This makes curriculum management dynamic while retaining the existing web application. It reduces future redesign; it does not eliminate the later work of billing and protecting paid content.

## Architecture and cost direction

- Keep static HTML/CSS/JavaScript, classic scripts and the existing backend.
  Database-driven content is compatible with static hosting. No Node/React/Next
  rewrite, build-step migration or second application is planned.
- Introduce focused feature files with explicit interfaces as features are built.
  Keep curriculum administration, content loading, quizzes and later enrollment
  separate. Extract existing code only when the current feature needs it;
  do not turn decomposition into a prerequisite or impose file-length targets.
- Keep question banks and image payloads outside application logic. Preserve
  stable module/question IDs, existing saves and working offline behavior.
- Maintain a compact feature-to-file/test map using the existing compatibility
  manifest and feature documentation. AI should read the relevant interfaces,
  synthetic fixtures and dependencies, not scan entire banks. Focused checks
  supplement stage-wide regressions; reduced context is not reduced coverage.
- Use Supabase for accounts, curriculum, progress and content references. Plan
  R2 for new question-image uploads, retaining existing bundled images initially.
  This does not reduce the existing progress database's size; database capacity
  and object-storage capacity must be assessed separately.
- R2 is a planned provider, not an activated service or a guaranteed zero-cost
  solution. Before activation, verify current pricing, payment requirements,
  storage/request estimates and available cost controls. Alerts are not a hard
  spending cap. If a strict zero-spend requirement cannot be assured, report it
  and retain the current delivery path until the user chooses otherwise.
- Keep asset references independent of provider URLs. Resolve existing local
  paths and new asset IDs through a small delivery boundary; no mass rewrite of
  question banks. Never expose upload credentials in browser code.
- Before Stage 17's LMS work, reassess framework adoption only if measured UI
  duplication or state-management complexity warrants it. Any migration needs
  separate approval and a bounded pilot; the working quiz is not rewritten first.

## Curriculum and enrollment rules

Hierarchy:

**Semester → Department, where applicable → Stream, where applicable → Module**

- Available department names: **ENTC, CSE, Electrical, Material, Bio Medical, Chemical, Mechanical, Civil**.
- Mechanical’s streams: **Aeronautical, Mechatronics, Common Stream**.
- Keep common semesters/modules supported; do not automatically attach every department to every semester.
- Admins choose where departments, streams and modules belong.
- Shared modules have one identity and question bank, with multiple curriculum placements—not duplicated content.
- Preserve existing module keys, question IDs and progress through the transition.
- Admins can create, edit, order, publish and archive curriculum entries. Archive used entries rather than deleting associated history.
- Students can browse published modules across departments and enroll/unenroll. Unenrolling removes the dashboard entry, not progress or purchases.
- Enrollment requires an account; existing guest access to free quizzes remains available.
- Enrollment never grants premium access by itself.

## Stages

### 7.0C — Close the extraction-tool audit

Reconcile completed repairs, outstanding audit requirements and outdated release documentation. Do not repeat completed migrations or fixes. Manual CS preparation continues separately.

### 8 — Synthetic bank and validation boundary

- **8.1:** Define the question contract and coverage checklist.
  - **8.1.a:** Live-compatible cases.
  - **8.1.b:** Preview-only and invalid cases.
- **8.2:** Create compact synthetic questions and figures.
- **8.3:** Add content-safe validation reports.
- **8.4:** Include common semesters, departments, Mechanical streams and shared-module examples without changing real curriculum.

AI uses synthetic content by default; real content inspection requires permission.
This includes real banks, figures, exports and historical reports containing
question excerpts. Validators may process real content without printing it.
Use `tools/validate_content_safe.py`; do not stream verbose real-bank validator
output into the AI conversation. Academic correctness is reviewed by the user.
Coverage is driven by a checklist, not a fixed number of questions.

### 9 — Admin sample explorer

- **9.1:** Plain expandable curriculum tree.
- **9.2:** Question preview, synthetic fields and coverage notes.
- **9.3:** Isolated answering/reset for live-compatible samples.
- **9.4:** Verify admin access and absence of real progress, analytics or purchase effects.
- **9.5:** Interactive sample-only answering/check/reset for defined preview modes;
  manual model comparison for structured/written responses. Never persist answers
  or enable these types in live quizzes merely because the sample works.
- **9.6:** Identify complete, partial and missing interactions. Matching uses typed
  pairs; structured uses free text without subpart marks. Dedicated pairing and
  subpart-grading designs remain unestablished, not silently treated as complete.
  Code-output answers are compared as text; code is never executed.
- **9.7:** Separate admin Statistics, Sample bank and Settings tabs in a top bar.
  Render navigation before statistics load, reject stale responses, isolate
  errors/retry, and support keyboard/mobile use. Keep this UI unit separate from
  sample answer logic; no new settings or database behavior.

The sample hierarchy includes quiz modes and units/papers beneath modules.
Use one catalog with shared references, not duplicated sample banks. Sample
assets contain no secrets; an admin-only interface does not make static files
private. Use on-demand loading and explorer-local answer state. No content
editor/uploads, new live scoring types or sample entries in student content.
Clear explorer state on account changes and reject stale loads.

### 10 — Scoped code decomposition

- **10.1:** Document feature dependencies.
- **10.2:** Extract chat-window controls as a pilot.
- **10.3:** Continue only where useful, one verified feature at a time.

Do not make complete decomposition a prerequisite for the new curriculum work. No hard line-count target or full rewrite.

### 11 — Dynamic curriculum foundation

- **11.1:** Define persistent curriculum records, placements and stable identifiers.
- **11.2:** Add administrator-only writes and published-catalog reads.
- **11.3:** Adapt the dedicated curriculum registry interface to persistent data while preserving existing quiz consumers.
- **11.4:** Plan and test existing-data compatibility, cached catalog behavior and unavailable-module handling.

Permissions must be enforced in the backend, not just by hidden buttons. [Supabase access-control guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 12 — Admin curriculum and content management

- **12.1:** Semester/department/stream/module management.
  - **12.1.a:** Map the current admin/registry interfaces and tests. Add a focused
    curriculum admin feature behind the existing admin tabs; retain Statistics,
    Sample bank and Settings. No general dashboard redesign or visual polish.
  - **12.1.b:** Add a simple hierarchy browser and create/edit forms using Stage
    11's authenticated catalog operations. Support common semesters and optional
    departments/streams; do not automatically seed the agreed department names.
  - **12.1.c:** Default new entries to draft. Show metadata-only modules as lacking
    content; preserve immutable identities. Reject stale account responses, show
    offline/error states and confirm successful writes before reporting success.
- **12.2:** Shared-module placement, ordering, draft/publish/archive controls.
  - **12.2.a:** Place an existing module in multiple valid curriculum locations
    without copying its bank. Provide ordering and explicit publication controls.
  - **12.2.b:** Explain ancestor/publication requirements, show revision conflicts
    with reload/review instead of silent overwrite, and confirm archive effects.
    Never delete progress or purchases when archiving a curriculum entry.
- **12.3:** Manual content upload, validation, preview and explicit publication.
  - **12.3.a:** Define and approve the versioned content/asset contract before
    implementation: immutable asset IDs, module manifests, bounded file sizes,
    allowed formats and live-compatible answer fields. Decide question-pack
    storage separately; R2 image approval does not silently choose it.
  - **12.3.b:** After separate activation/cost approval, introduce R2 image uploads
    through a server-verified admin operation. Keep credentials server-side,
    validate uploads and resolve asset references on an approved delivery origin.
    Preserve bundled-image support; do not bulk-migrate existing banks.
  - **12.3.c:** Validate content and resolved assets before preview/publication.
    Keep schema-v2 preview support distinct from live scoring support. Reject
    incompatible formats, missing images and duplicate question IDs. Academic
    review remains the user's responsibility; AI tests use synthetic fixtures.
  - **12.3.d:** Treat upload and publication as separate steps. Failed/interrupted
    uploads must not publish incomplete content; retries must not duplicate it.
    Publish an immutable validated version via a revision-checked metadata change.
    Retain the previous version for recovery; cleanup requires explicit scope.
- **12.4:** Enable newly published modules without editing JavaScript or redeploying the app.
  - **12.4.a:** Add a focused, validated content loader using the approved manifest
    contract. Preserve existing bundled loading, module/progress identities and
    active attempt snapshots. Never execute uploaded JavaScript as content.
  - **12.4.b:** Update import tools, previews, URL resolution and offline downloads
    together. Confirm required assets before marking a download complete; test
    cross-origin caching, unavailable content, explicit retry and version changes.
  - **12.4.c:** Keep drafts inaccessible through public delivery. Design separate
    delivery policies for published free content and future premium content;
    do not make premium assets public or implement payments in this stage.

Creating a module does not generate its questions. This stage must address content delivery too; database metadata alone cannot remove today’s hard-coded file dependency.

Execute 12.1, 12.2, 12.3 and 12.4 as separate bounded implementation/checkpoint
prompts, not one large rewrite. Commit each completed, verified approved unit
before starting the next, with exact-file staging and synchronized tooling/docs.
Each handoff includes manual actions and expected results. No automatic push,
production SQL, deployment, R2 activation or spending is authorized by this plan.

Next implementation unit: **12.2**, using synthetic/local backend
verification first. Stage 11's production migration remains a prerequisite for
live admin use, not a reason to create another hosted project. Before starting
12.3, resolve the content-storage and cost-control decisions explicitly.

Stage 12 acceptance: admin/student/guest permissions; unchanged existing admin
tabs; hierarchy and shared IDs; draft confidentiality; revision conflicts;
failed/retried uploads; incompatible imports rejected; existing and newly
published modules; account/navigation races; preserved saves; offline downloads;
desktop/mobile manual checks. No real content inspection is implied.

### 13 — Enrollment and personal dashboard

- **13.1:** Separate enrollment catalog with curriculum filters.
- **13.2:** Enroll/unenroll with duplicate protection.
- **13.3:** Dashboard limited to enrolled modules, with an enrollment prompt when empty.
- **13.4:** Preserve progress across unenrollment, renaming and shared placements.

Enrollment records are account-owned and distinct from future purchase permissions.

### 14 — Quiz release readiness

Verify repaired flows, dynamic curriculum, enrollment and offline behavior. Integrate manually reviewed CS content only when ready and live-compatible; otherwise release existing modules.

### 15 — Mobile approach and cost approval

Evaluate mobile packaging, test Android/iOS feasibility, and approve architecture and costs before implementation.

### 16 — Free quiz store release

Build the approved mobile packages; complete privacy, account deletion, accessibility, device/beta testing and authorized store submissions.

### 17 — Notes and lessons

Add searchable notes, tutorials and video resources using the established curriculum and enrollment structure.

### 18 — Paid modules and subscriptions

Define free/premium boundaries; implement protected delivery, verified purchases, restoration, expiry/refunds and applicable store billing. No paid content should depend on secrecy of public files or Drive links.

### 19 — Coding practice

Add exercises and an editor first. Separately approve automated execution, security and operating costs.

## Verification and approval gates

- Test admin versus student permissions, cross-account enrollment isolation, duplicate requests and account switching.
- Test shared modules, archived entries, empty modules, offline catalog recovery and preservation of historical progress.
- Keep samples excluded from real enrollment and student content.
- Use additive, reversible migrations tested locally before separately authorized production application.
- Each stage needs its own bounded implementation prompt and acceptance checks; later stages are roadmap commitments, not implementation-ready technical specifications.

Deviations from the earlier draft: Electrical is included; curriculum/enrollment precede launch and later stages are renumbered accordingly. This roadmap records approval, not implementation.

Stage 11's persistent curriculum design was approved and implemented locally. Content delivery remains Stage 12 and needs its own detailed implementation plan.
