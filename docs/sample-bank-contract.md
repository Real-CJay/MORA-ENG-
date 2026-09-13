# Stage 8 - synthetic bank and safe validation

## Boundary and catalog

Entry point: `examples/synthetic/catalog.json`. Six live-compatible questions,
ten preview-only questions across nine types, ten invalid mutations and one synthetic SVG replace
real content in routine AI maintenance context. The user reviews academic
correctness. AI inspection of real banks, figures, exports, screenshots or
historical question excerpts requires explicit permission.

The catalog is version 1 and synthetic-only. `packFiles.live`/`.preview` resolve
relative to the catalog; both reuse schema-v2 envelopes. `invalidCasesFile` is
a test-only mutation list, not an importable pack. `coverage` maps feature cases
to IDs; tests check actual features as well as references.

`semesters` contain common/departmental placements referencing `moduleId`,
nullable `departmentId` and `streamId`. `departments` define labels/streams.
`modules` own unit metadata and groups with bucket, unit/paper labels and
`questionIds`; `previewQuestionIds` references preview-only samples. Shared
placements reference one module/bank. Never duplicate data or author `allTarget`;
derive it from normal/hard groups.

Samples include common Semester 1; departmental Semester 2 with ENTC, CSE,
Electrical, Material, Bio Medical, Chemical, Mechanical and Civil; Mechanical
streams Aeronautical, Mechatronics and Common Stream; a shared and an empty
module. These are not real curriculum entries.

Question IDs start `__dev_synthetic_` (the existing synthetic guard); module IDs
start `__sample_`. No student quiz entry point loads these packs. The made-up SVG
is `IMAGES/__samples/stage8-diagram.svg`, matching existing image-path rules.
Samples are not for live import and contain no secrets. Static files do not
become private merely because the viewer is admin-only. Stage 9 loads them only
on demand inside its admin sample workspace, never into student quizzes.

## Coverage checklist

| Case | Feature/assertion |
| --- | --- |
| minimal | Flat MCQ; optional explanation/image/context omitted |
| rich | Context, safe HTML, explanation, source, local image and alt |
| math | Four LaTeX delimiters; math options; first correct index |
| duplicate_options | Identical labels with different canonical identities |
| hard | Target-hard flag, second unit, last answer index, null image |
| hybrid | Flat fallback/scoring plus existing optional aliases for all five block types |
| nine preview types | mcq, multi_select, numeric, short_answer, structured, written, code_output, matching, image_based |
| exact numeric sample | Separate numeric_exact example using existing numeric mode with tolerance 0; both exact roots required |
| six preview modes | single, multiple, numeric, text, self_mark, manual |
| generated variants | Numeric/text scalar/arrays, any/all, tolerance modes, ordered/extra matches |
| shared references | Two preview questions share a stimulus; multiple placements share one module |
| invalid cases | Wrong/string answer index, unit/module/options, image paths/placeholders, unsafe HTML, preview body |
| reporter tests | Global ID collisions, missing/unregistered chunks, malformed JSON/nested types, redaction and output caps |

Tests: `tools/tests/test_sample_bank.py` and `tests/samples.test.cjs`. Node tests
exercise real shuffle/history helpers on every live sample and verify original
data preservation, legacy ambiguity and production-entry-point isolation.

Live flat MCQs require nonempty text, two or more string opts and integer
zero-based ans, plus valid IDs/module/unit/images. Schema validation alone is
not live compatibility. Preview types do not gain live scoring support. Hybrid
blocks use only existing bridge settings/surfaces; none are expanded here.

This checklist covers format axes, not every application state. Existing
runtime/security/outbox/offline tests remain necessary for timing, account
ownership, concurrency, navigation and saves. Add a synthetic regression when
a new behavior/edge case is introduced; do not impose a fixed sample count.

## Safe commands (Python 3.11+, repository root)

```powershell
python -B -m unittest discover -s tools/tests -p test_sample_bank.py
python -B tools/validate_content_safe.py examples/synthetic/preview.json
python -B tools/validate_content_safe.py --live-repo --max-issues 20
# Counts only:
python -B tools/validate_content_safe.py --live-repo --max-issues 0
```

JSON packs receive schema checks only. `--live-repo` also checks the existing
live gate, registered modules/units, global IDs and local images. It uses the
existing non-executing JSON chunk parser: no imports, exports, JS execution or
content writes. `-B` avoids bytecode caches. `--root` supplies an alternate
repository/image root for synthetic tests.

JSON output (`reportVersion: 1`) includes counts, check scope and bounded issues:
severity, fixed code, safe field, question index/ID, optional module/bucket.
Malformed IDs are hashed and registry keys redacted; filenames, raw messages
and exception text are never echoed. Valid IDs intentionally remain metadata:
do not put prose/secrets in IDs. `inputIndex` identifies argument order; live
reports use sorted chunk filenames and canonical bucket order.

The output limit is global and prioritizes errors. Counts and `omittedIssues`
remain accurate even at zero. Exit 0 means no errors; exit 1 means errors or
incomplete/unreadable validation. Warnings do not fail. Unknown rules produce
SCHEMA_RULE/LIVE_RULE, never raw messages. Schema-only never means can_apply;
the existing import gate is still authoritative.

Common codes: PREVIEW_ONLY, LIVE_ANSWER_INDEX, LIVE_OPTIONS, MODULE_MISMATCH,
UNIT_UNKNOWN, GLOBAL_DUPLICATE_ID, IMAGE_UNRESOLVED, IMAGE_PLACEHOLDER,
LIVE_IMAGE_PATH, UNSAFE_CONTENT, VALIDATION_ABORTED. Findings can overlap
between schema and live checks; counts are not distinct affected questions.

## Stage disposition

Local acceptance on 2026-09-09: 29 Node tests and 61 Python tests passed;
registry check passed (one semester/four modules, zero errors/warnings), new
JavaScript test syntax passed, and `git diff --check` passed. Existing isolated
test dependencies were reused; no fresh dependency installation was needed.

No admin viewer, production renderer changes, curriculum migration or real
question edits. Stage 9 builds the viewer and adds browser-rendering/interaction
checks. Schema/helper tests do not certify the future viewer.

2026-09-09 safe scan: 840 real questions, 48 image-related diagnostics confined
to Mechanics (6 IMAGE_PLACEHOLDER, 35 IMAGE_UNRESOLVED, 7 LIVE_IMAGE_PATH), and
2,050 legacy/schema warnings. Exit 1 correctly signals that backlog. Real
content was not exposed to AI or modified; Mechanics image repair is excluded.
