# Tool compatibility and release inventory

Approved maintenance before Stage 10; no app rewrite or deployment. The central
manifest is `tools/compatibility.json`. Git's commit ID identifies the complete
committed release, including unchanged files. We do not stamp every file with a
new version just because another part changed.

## Everyday commands (repository root)

```powershell
python -B tools/check_sync.py
python -B tools/check_sync.py --all
python -B tools/check_sync.py --file tools/claude_prompt_generator.py
python -B tools/check_sync.py --all --inventory --output .local-reports/sync-status.json
python -B tools/check_sync.py --verify-report .local-reports/sync-status.json
```

No new dependency is required by the checker (Python 3.11+ and Git). Executed
checks use Python/Node and the existing tools' dependencies where needed; install
`tools/requirements.txt` in your existing test environment if those are missing.
The script reports test failure/missing runtime rather than a false success.
Subprocess output is captured, never streamed with real question excerpts.

`--reviewed` acknowledges that the caller has reviewed the listed prompt/doc/
manifest changes. Use it only after doing that review. It does not override
failed tests, drift, unmapped files or the stage's required browser/manual checks.
The checker never commits, pushes, deploys, installs dependencies or edits sources.

## Reading the report

- PASS: the selected automated scope passed, not proof that every file is correct.
- FAIL: a relationship assertion/test failed, runtime was unavailable, or sources
  changed while tests ran. Exit 1; do not commit as verified.
- REVIEW NEEDED: prompt/docs/manifest changed and review was not acknowledged.
- UNMAPPED: a changed/requested file lacks a contract mapping. Exit 2 for either
  review/unmapped status; add meaningful coverage or escalate.
- `--verify-report`: CURRENT means snapshot matches; STALE means regenerate.
  This compares snapshots only, not a fresh test run. A CURRENT failed report
  remains failed. Ignored files/environment/deployed database state are outside
  this fingerprint and must be checked separately where relevant.

`releaseCommit` is HEAD; `workingTreeDirty` states whether the tested workspace
differs from that committed release. `comparisonBase` defaults to the manifest's
review baseline. Before later stages, advance that baseline deliberately to a
previous verified commit or supply `--base <commit>`; never advance it merely to
hide failures. Contract revisions change only when their contract changes, not
for every edit. Browser cache versions remain separate delivery metadata.

The generated JSON inventory includes each tracked/non-ignored untracked path,
content state, committed Git blob ID, last-changing commit/date, mapped contracts
and checks actually run. It shows modified/deleted/untracked/unmapped files rather
than calling them up-to-date. Last-change dates are Git committer dates, not review
dates. `workingTreeModifiedAt` is the filesystem modification time, also not a
review date. An old unchanged file can be compatible; a new file can be broken.

Reports are ignored local artifacts under `.local-reports/`. Existing files at
the requested report path are replaced on regeneration. `AI exports/` is excluded
from untracked test selection and fingerprinting, and is labelled excluded in
the inventory. Its content is not read. Ignored files, secrets and dependencies
are not inventoried. Do not publish the report: even filenames can be private.

## What is checked now

- Generator/validator question, answer and block-mode agreement; schema v2.
- Exact numeric uses numeric mode/tolerance 0, with a reachable synthetic example;
  generated guidance no longer suggests tolerance for every numeric answer.
- Preview answering and live-import acceptance remain different contracts.
- Existing CS intermediate extraction remains a separate, tested workflow.
- Dedicated curriculum registry metadata checks.
- Index/worker version agreement, required versioned assets and asset existence.
- Focused synthetic/runtime/offline/security regression suites and checker tests.

Mapping means relevant checks exist, not exhaustive coverage. The app still needs
its full stage test suite and manual acceptance. The checker reports only fixed
failure codes, suite names/counts and bounded path lists; complete details stay
in the optional JSON report. No per-file versions or enormous status lists need
to be loaded into AI context for normal work.

## Manually verify this maintenance

1. Run the default command: see affected suites and review paths, with no app UI changes.
2. Generate the inventory and open its JSON: confirm HEAD, dirty state, contract
   mappings and last-change data for a known file. Unmapped is not PASS coverage.
3. Run `--verify-report` immediately: expect CURRENT. After an approved source
   edit/commit, expect STALE until regenerated. Excluded exports do not affect it.
4. Run `python -B -m unittest discover -s tools/tests -p test_sync_check.py`:
   synthetic mutations verify exact-mode drift, mode disagreement, shell version
   mismatch, missing assets, unmapped paths, failed checks, concurrent edits and
   file-state/history handling. Real files are not mutated by these tests.

These checks run locally. They do not certify cloud deployment or guarantee the
output of an AI question generator, and are intentionally not called failsafe.
