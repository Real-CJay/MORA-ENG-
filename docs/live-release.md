# Live repair release — 2026-09-05

The user authorized applying the reviewed migration, committing the repairs and deploying to the existing project. No extra project, database branch, paid feature or plan upgrade was created.

## Database

- Existing project: `MORA QUIZ` (`zjjvtqcuaqyccxdklvbs`). Migration receipt: `20260905130344_progress_receipts_and_rate_limits`.
- Preflight confirmed existing admin-escalation protection, revoked guest claiming, required unique keys, RLS and daily-activity trigger.
- Live `answer_history.selected` is integer, not the historical setup's text type. The migration explicitly casts indices and tests both variants. No live column type was changed.
- Migration applied successfully. Before/after row counts: 3,477 answers, 76 sessions, 3,459 performance rows; zero receipts initially. No historical totals were rebuilt.
- Verified authenticated save execution, denied anonymous save execution, server-only limiter execution and denied direct client reads of private tables.
- Executed answer/session replay, owner-mismatch rejection and quota assertions against the live functions inside a rolled-back transaction. Counts remained unchanged afterwards; no test receipts or limiter rows remained.
- Security advisors report two intentional informational notices for private RLS-enabled tables without client policies. Six pre-existing security-definer leaderboard-view errors and legacy function/Auth warnings remain outside this migration. This is not a blanket production-security certification.

## Client release

Database/API baseline committed as `1573184`; client repairs committed as `04ff920`. Existing deployment target: `mora-eng`, team `januparansindu-6726s-projects`, Hobby plan. Deployment is pending CLI authentication with access to that existing team; the initial CLI login could not access it. No deployment or Git push has occurred in this release attempt.

## Verification and boundaries

All 27 Node regression tests, including integer/text migration variants, pass. Earlier local verification passed 50 Python tests, browser answer persistence, exam timeout/double-submit, native IndexedDB account isolation, failed-download rejection and cached startup with the local server stopped and SDK network blocked. Mechanics figures are excluded by the user. Real email recovery and physical-device acceptance are not certified by these tests.

This release note supersedes earlier "no production SQL" statements in the local implementation report. No historical SQL setup scripts were replayed.
