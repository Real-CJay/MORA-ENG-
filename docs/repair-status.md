# Approved repair implementation status

For the subsequently authorized live database application and commit/deployment status, see [live release](live-release.md). The implementation-only statements below describe the earlier local pass.

Current position (2026-09-09): the repairs were pushed and merged into `main` at `8686330`; 7.0C's approved local audit scope is closed. See the [closeout](stage-7-0c-closeout.md) for fresh checks and the [master roadmap](master-plan.md) for remaining stages. Historical "current" counts and limitations below describe the earlier pass; the later release record supersedes them, including the 27-test Node total and subsequent local offline checks.

Baseline: `stage-7-0c-general-extraction-tool-audit`, `79d105f`. The extraction-tool audit remains 7.0C. These are separately scoped approved repairs, not new numbered stages. No commits, staging, pushes, deployment or production SQL execution were performed.

## Implemented locally

- Security: escaped account/admin names and chat math-restoration text; bound destructive confirmation without interpolated JavaScript; restricted avatar colors to supported six-digit hex values. Existing formatting and renderer surfaces remain unchanged.
- Authentication/privacy: session-required signup, confirmation instructions, recovery completion and invalid-link handling, account-generation guards, and partial profile updates that preserve privacy settings.
- Database/progress: reviewed SQL tracking exceptions and migration; transactional account-owned IndexedDB outbox; stable server receipts; acknowledged-only removal; reconnect/auth retries; immutable cross-tab guest import manifest; account/module-scoped flags; pending-answer overlay; original ownerless queue/flags retained with explicit JSON export. No historical counters were reconstructed.
- Quiz: shared guarded completion for manual submit/timeout; immediate exam scoring/results; timestamp timing with pauses; count limits only in applicable modes; complete full papers; canonical shuffled option identity with explicit version. Ambiguous historical answer labels display as unavailable.
- Navigation: stale screen/history/account response guards, direct-route module history, stable module-load errors with explicit retry.
- Offline: message-port acknowledgements, actual data/image cache outcomes, no success marker after partial failure, separate successful app-shell navigation, required bridge/renderer/SDK cache coverage, practice/exam update protection. App asset version is 83; worker cache is v86; subject data version is unchanged.
- AI: bounded and typed input, controlled upstream timeouts/errors, same providers and guest access, shared atomic database quotas with fail-closed behavior. Origin is not authentication.
- Extraction: final post-override live gate, apply-boundary recheck, manual-add compatibility gate, module/unit/ID/local-image checks, schema-v2 preview retained but incompatible live writes rejected, pinned Python dependencies and corrected compatibility documentation.

## Verification

Reproducible local commands (Node 24; Python 3.11+):

```powershell
npm ci --prefix tests --ignore-scripts
$env:NODE_PATH = (Resolve-Path tests/node_modules).Path
node --test tests/*.test.cjs
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r tools/requirements.txt
.\.venv\Scripts\python.exe -B -m unittest discover -s tools/tests
.\.venv\Scripts\python.exe -B tools/registry_check.py
git diff --check
```

Current automated results: 26 Node tests and 50 Python tests pass; 31 JavaScript/CJS files pass syntax checks; `git diff --check` passes. Registry check passes with four subjects, one semester, zero errors/warnings. Node tests cover isolated SQL execution/grants, two-account replay, lost acknowledgements, concurrent enqueue/tabs/import manifests, offline answer visibility, shuffled identity, guarded completion/timing, full-paper count isolation, partial profile edits, reordered page responses, malicious HTML/colors, shared AI limiting, and failed cache acknowledgements.

Local Chrome UI checks used `node tests/serve.cjs` with live Supabase requests blocked. Home/module/setup navigation and a 20-question guest practice attempt were exercised, including answer selection and results. These are smoke checks, not hosted authentication or full production end-to-end verification. The automation's offline toggle did not establish a reliably offline browser state; cold-offline acceptance remains unverified.

## Remaining release gates / blocked work

- Follow [database baseline and release order](database-baseline.md). Hosted staging must verify the complete schema/triggers/RLS, two real accounts, signup with/without confirmation, recovery emails and expired links, privacy, receipt RPCs, interrupted/partial guest imports, and server configuration. Local mocks cannot certify those integrations.
- Browser/device acceptance still needs the full matrix: reordered direct/back-forward navigation, unavailable modules, cold offline install/download, partial image downloads, updates in active practice/exams, full-paper count isolation, manual/timeout/double submission, and background-tab timing. Automated regressions cover several underlying paths, not every physical browser/device combination.
- Mechanics 2019 figures cannot be restored without the verified source paper. Existing `"None"` values and missing figure references were not silently normalized: absence versus missing required content is not established. No question IDs, answers, curriculum or live subject chunks were changed.
- Original ownerless offline entries remain unassigned. The account menu exports their recovery copy. Legacy guest-import success markers are not undone automatically because earlier imports may already have affected cloud totals.
- Anonymous guest analytics are separate legacy telemetry and are not claimed to have exactly-once delivery. Authenticated imports and new progress use receipt-backed operations.

## Deviations

No scope expansion. Supabase SDK is pinned to the verified 2.115.0 release so cold offline installation can cache an exact dependency. Test dependencies are isolated from the production app; there is no framework/build-step change.
