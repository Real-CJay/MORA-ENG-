# Mora master roadmap

Approved direction recorded: 2026-09-09. This is the current roadmap; older
future-stage proposals are historical. Permanent guardrails remain in AGENTS.md.

## Current position

- Baseline: main at `8686330`, including repairs `1573184`, `04ff920`, `f3dd264`.
- 7.0C: closed for the approved local audit/repair scope; see [closeout](stage-7-0c-closeout.md).
- Stage 8: implemented locally; see [sample bank and verification boundary](sample-bank-contract.md).
- Stage 9, including approved extensions 9.5–9.7: implemented locally; see [explorer and manual checks](stage-9-sample-explorer.md).
- Stage 10: scoped chat-controls pilot implemented locally; see [dependencies, checks and known baseline limits](stage-10-decomposition.md).
- Next: Stage 11 (dynamic curriculum foundation). Stages 11-19 remain unimplemented.
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
- **12.2:** Shared-module placement, ordering, draft/publish/archive controls.
- **12.3:** Manual content upload, validation, preview and explicit publication.
- **12.4:** Enable newly published modules without editing JavaScript or redeploying the app.

Creating a module does not generate its questions. This stage must address content delivery too; database metadata alone cannot remove today’s hard-coded file dependency.

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

Escalations: persistent curriculum and content delivery are intentional architecture changes; approve their detailed design in Stage 11 before implementation.
