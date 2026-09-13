# Proposed lightweight compatibility tracking

Requested and approved 2026-09-13. This document preserves the proposal; the
implemented workflow is in [tool-sync.md](tool-sync.md). The user additionally
approved an on-demand inventory of all tracked/non-ignored untracked files.
Existing stage numbers and architecture remain unchanged. The standing
pre-stage commit rule is recorded separately in AGENTS.md.

## Recommended approach

Use Git for file history and one small machine-readable compatibility manifest
for behavior shared by the app, tools, prompts and synthetic samples. Do not put
the current release number in every file: unchanged files are not outdated, and
matching version labels do not demonstrate compatibility.

The manifest groups producer/consumer paths by contract, records supported
capabilities and points to focused checks. Initial groups should cover question
schema, preview answering, live-import compatibility, curriculum registry and
offline asset versions. Do not equate schema-v2 validity, sample interaction and
live support. They deliberately differ today.

For example, exact numeric answers use numeric mode with tolerance 0, not a new
numeric_exact schema type. A sync check should connect generator guidance,
validator acceptance, comparator behavior and the catalog's exact sample.

## Proposed check workflow

1. Determine changed tracked paths from Git, including renames/deletions. Read
   the manifest to find affected producers, consumers, docs and focused tests.
2. Check those relationships and run the relevant synthetic tests; changes with
   no mapped coverage are reported as UNMAPPED, not silently accepted.
3. Print a compact result: PASS, FAIL, REVIEW NEEDED or UNMAPPED, contract name,
   relevant paths and test counts. Never print real question text or secrets.
4. Treat prose/prompt changes as requiring review as well as assertions; a
   version label or passing test cannot certify an AI generator's future output.
5. Before the next stage: run required stage checks plus affected sync checks,
   update the small status record with evidence, and commit exact approved files.

For troubleshooting any tracked file, compute its last-changing commit on demand.
The checker may show how it relates to a requested release, but an older commit
is a clue, not a fault. Avoid storing duplicate per-file versions or a generated
whole-repository hash inventory. Untracked files remain explicitly unverified.

Maintain schema/contract versions only for actual contract changes. Keep existing
PWA cache versions for browser delivery; verify index/worker agreement rather
than treating cache versions as proof that authoring tools are compatible.

## Initial reconciliation, if approved

- Explain exact numeric answers and tolerance 0 in generation guidance/schema docs.
- Preserve preview-only versus live-import boundaries in all relevant tools.
- Verify known question/answer modes across generators, validators and samples.
- Add the manifest and a stdlib-only checker, with synthetic failure tests that
  demonstrate drift detection. No new paid service, runtime dependency or rewrite.
- Document one short command for normal checks and one file-focused diagnostic.

## Alternative and approval

Alternative: a manually maintained sync checklist in Markdown. It is cheaper to
start, but cannot automatically catch regressions. The manifest plus focused
tests is recommended. Neither option requires tagging every file.

Implementation was approved, including exact-numeric prompt reconciliation.
The generated inventory and focused checks do not claim every file or tool is
fully verified; unmapped and manual-only areas remain explicitly identified.
