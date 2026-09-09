# Stage 7.0C - extraction-tool audit closeout

Date: 2026-09-09. Baseline: `main` at `8686330`; tracked files were clean and
untracked `AI exports/` was preserved. This closeout changes documentation only.

## What I did

Reconciled the approved extraction-tool audit with the already merged repairs.
The repair units remain separate from the original stage identity:

| Commit | Completed work |
| --- | --- |
| `1573184` | Reviewed database baseline, progress receipts and shared AI limits |
| `04ff920` | Account-owned saves, auth/privacy, completion, navigation and offline fixes |
| `f3dd264` | Live-import compatibility, dependencies, tests and repair documentation |
| `8686330` | Merge of PR #1 into main |

## Extraction audit disposition

| Requirement | Evidence / disposition |
| --- | --- |
| Schema-v2 extraction and preview retained | Python tests cover preview and pack round-tripping without claiming live compatibility |
| Incompatible imports blocked before writes | `live_question_blockers`, `prepare_import_plan`, `apply_import_plan`; schema-only and pack-level rejection tests pass |
| Final overrides, module/unit validity and global IDs checked | Import preparation validates final questions and existing IDs; invalid-payload tests pass |
| Changed previews revalidated before writes | Apply builds a fresh plan; changed-payload/image tests pass |
| Local images verified | Gate validates path/root/file existence; tests use temporary synthetic assets |
| Manual additions use the same gate | Manual-add flow calls `live_question_blockers`; source checked, interactive UI not rerun |
| Python dependencies and command reproducibility documented | `tools/requirements.txt`; discovery passes in the existing isolated environment |

Verification rerun for this closeout:

- Node: **27/27 passed**, using existing isolated test dependencies.
- Python: **50/50 passed**, using the existing isolated Python environment.
- Registry: **1 semester, 4 subjects, zero errors/warnings**.
- No real question bank, figure or extraction output was inspected. No live
  writes, deployments, content imports, migrations, staging or commits were run.
- Browser/device tests and clean dependency installation were not repeated for
  this documentation-only closeout. Historical test results do not certify
  complete hosted acceptance.

## Remaining boundaries

- 7.0C is closed for the approved local audit/repair scope, not blanket
  production-security or app-store readiness.
- The live migration was already applied as recorded in `live-release.md`;
  do not replay it. Production client revision remains unverified.
- Hosted email recovery, account/privacy and full device/offline acceptance
  remain Stage 14 release gates. Previously reported database advisor findings
  are not declared fixed.
- CS preparation/review remains with the user. Live import requires separate
  compatibility approval. Mechanics figures are excluded.
- Stage 8 has not been implemented by this closeout.

## Deviations

None. No application behavior, real curriculum or content changed.

## Escalations

None for this closeout. Future architecture, production and cost approval gates
remain in the [master roadmap](master-plan.md).
