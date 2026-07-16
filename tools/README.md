# Mora Quiz Question Tools

Stage 1 adds a schema foundation and validator for future question packs. These tools do not run inside the current static app and do not modify existing `subject_data/*.js` chunks.

## Files

- `tools/validate_questions.py` validates schemaVersion 2 JSON packs and accepts legacy flat questions with migration warnings.
- `tools/quiz_manager.py` is the interactive content manager and validator-first JSON import preview/apply tool.
- `tools/export_legacy_subjects.py` exports existing lazy-loaded `subject_data/*.js` chunks into legacy JSON question packs.
- `tools/question_schema.md` documents the block-based schema.
- `tools/registry_check.py` validates `js/curriculum_registry.js` against subject metadata in `quiz_data.js`.
- `tools/registry_schema.md` documents the programme registry shape for semesters, departments, and shared modules.
- `examples/sample_questions.json` is a clean mixed-content demo pack.
- `examples/sample_with_errors.json` is an intentionally broken demo pack.

## Validate Packs

Run from the app root:

```powershell
python tools/validate_questions.py examples/sample_questions.json
```

Validate the intentionally broken fixture:

```powershell
python tools/validate_questions.py examples/sample_with_errors.json
```

Validate more than one pack at once:

```powershell
python tools/validate_questions.py examples/sample_questions.json examples/sample_with_errors.json
```

Optionally check local image files referenced by the image registry:

```powershell
python tools/validate_questions.py --images-root . examples/sample_questions.json
```

`--images-root` skips `http://` and `https://` image URLs. Relative image paths are checked against the root path you provide.

## Exit Codes

- `0`: no validation errors were found.
- `1`: at least one validation error was found, or a file could not be parsed/read.

Warnings do not fail the command. They are intended for migration hints and data-quality cleanup.

## Export Legacy Subject Chunks

Run from the app root:

```powershell
python tools/export_legacy_subjects.py
```

The exporter reads `subject_data/*.js`, extracts the `window.MORA_SUBJECT_CHUNKS["<subject>"]` assignment without executing JavaScript, and writes:

```text
content/question-packs/<subject>/<bucket>.json
```

Buckets exported for every subject:

- `pastUnit`
- `pastPaper`
- `targetHard`
- `targetNormal`

The exported packs keep each question in the legacy flat shape. The pack wrapper is only there so `tools/validate_questions.py` can validate the files before the Stage 3/4 adapter work.

Validate all exported packs manually:

```powershell
$packs = Get-ChildItem -Path content/question-packs -Recurse -Filter *.json | ForEach-Object { $_.FullName }
python tools/validate_questions.py $packs
```

## Validate Programme Registry

Run from the app root:

```powershell
python tools/registry_check.py
```

This checks that every subject points at a real semester, required Semester 1 modules are common, department-specific modules point at real departments, and archived/shared-module cases are visible in the report.

## Schema Notes

Only these block types are allowed for new schemaVersion 2 content:

- `text`
- `math`
- `image`
- `code`
- `table`

There is no `html` block type. Legacy HTML-like content must be handled by a future adapter as escaped plain text, not promoted into the schema.

## Quiz Manager

Start the interactive manager from the app root:

```powershell
python tools/quiz_manager.py
```

The no-argument flow keeps the existing subject, unit, question, short-note, and legacy question management menus. It reads and writes the current lazy chunk layout:

- `subject_data/<module>.js`
- `window.MORA_SUBJECT_CHUNKS["<module>"]`
- `pastUnit`
- `pastPaper`
- `targetHard`
- `targetNormal`

### Validator-first JSON import

JSON import uses `tools/validate_questions.py` before previewing anything. Validation errors refuse the import. Validation warnings are printed and included in the preview; warnings do not block a dry run or apply by themselves. If the official validator is missing or fails unexpectedly, the manager refuses the import.

The import flow is:

```text
load -> validate -> inspect -> collision checks -> preview -> explicit apply
```

Dry-run preview is the default. In interactive mode, no import is applied until the preview is shown and you confirm it. For repeatable command-line use:

```powershell
python tools/quiz_manager.py --import-json examples/sample_questions.json --subject materials --bucket pastPaper
```

That command is a dry run. To apply after the same preview checks:

```powershell
python tools/quiz_manager.py --import-json path\to\pack.json --subject materials --bucket pastPaper --apply
```

Supported `--bucket` values:

- `pastUnit`
- `pastPaper`
- `targetHard`
- `targetNormal`

Optional explicit overlays are available and are shown in the preview before apply:

```powershell
python tools/quiz_manager.py --import-json path\to\pack.json --subject materials --bucket targetNormal --unit 2 --year 2027 --apply
```

### Preservation and refusals

Imported question IDs are preserved exactly. Missing IDs, duplicate IDs inside a pack, and IDs that collide anywhere in the live dataset refuse apply. The manager does not silently rename or repair IDs.

Current-schema question objects are preserved recursively, including block `body`, `explanation`, `options`, `answer`, `matchMode`, tolerance fields, `orderedMatch`, `extraAllowed`, `self_mark`/`manual` answers with `value: null`, unknown fields, Unicode, multiline strings, booleans, numbers, lists, and dictionaries. Legacy flat questions remain supported when wrapped in a valid schemaVersion 2 pack; the validator reports migration warnings.

The live chunk format stores bucket arrays of questions, not pack-level context. Packs with non-empty pack-level `stimuli` or `images` can be validated and previewed, but live apply is refused so that shared context is not silently discarded or inventively flattened. Resolve that storage/integration decision in a later approved stage.

Stage 7.0 upgrades tooling only. It does not import CS, create `subject_data/cs.js`, change curriculum data, or edit the web app.

## Python Tools Inventory

Python tools found: 11

The inventory below covers every `.py` file currently under `tools/`, including tests. Status and safety are based on the actual code paths, entry points, arguments, and file writes.

### claude_prompt_generator.py

Status: Active
Purpose: Builds universal Claude prompts for current schemaVersion 2 Mora Quiz question packs, with explicit legacy-compatible flat MCQ mode still available.
When to use: Use for general Materials, Mechanics, Fluid Mechanics, Mathematics, CS, or future-module question generation prompts before validation and quiz-manager dry-run. Use explicit `--legacy` only for older flat MCQ workflows that will be reviewed, wrapped, converted, or imported carefully.
Inputs: Interactive answers or CLI options for module/dataKey, display label, destination bucket, unit/topic, year/paper metadata, ID prefix, source scenario, pasted source text, marking scheme, expected question types, answer modes, and block/content types.
Outputs: Prints the generated prompt, optionally copies it to the clipboard, and optionally saves the prompt to a `.md` or `.txt` file.
Files it may modify: Optional user-chosen prompt `.md` or `.txt` file. Existing output files are not overwritten unless overwrite is explicitly approved.
Safety: Writes files after confirmation
Command: `python tools\claude_prompt_generator.py`
Important options: `--module`, `--module-label`, `--bucket`, `--unit`, `--topic`, `--year`, `--paper`, `--id-prefix`, `--context`, `--destination-note`, `--source-scenario`, `--source`, `--source-file`, `--marking-scheme`, `--question-types`, `--answer-modes`, `--block-types`, `--existing-ids`, `--legacy`, `--output`, `--overwrite`, `--copy`.
Dependencies: Python standard library; optional `pyperclip`; Windows clipboard helpers if available.
Related/overlapping tools: Overlaps with `cs_block_prompt_generator.py` for Claude prompt generation. Use this universal generator for direct schemaVersion 2 pack prompts across modules; use `cs_block_prompt_generator.py` when a CS paper needs grouped prompts, review, and merge workflow.
Current compatibility: Defaults to schemaVersion 2 pack instructions compatible with `validate_questions.py` and `quiz_manager.py` dry-run preview. Prompts may allow pack-level `stimuli`/`images`, but they explicitly warn that `quiz_manager.py` refuses live apply for non-empty pack-level shared context until a pack-aware adapter exists. Legacy flat output is explicit only.

### cs_block_prompt_generator.py

Status: Active
Purpose: Main CS extraction workflow menu. Its default path creates one compact paper package, supports grouped JSON review/merge, shows workflow help, and launches image cropping.
When to use: Use before CS source extraction or review. For a new package, provide the source PDF path, batch number, and paper year; the tool derives the CS1033 identity and creates `AI exports/cs_packages/<batch>_Batch_<year>` only when that folder does not already exist.
Inputs: A full source PDF path, inferred-or-overridden batch/year values, multiline `questions | chunk_type | PDF pages | note` groups, reviewed group JSON files, and merge paths. Review/merge inputs remain unchanged.
Outputs: `CS_EXTRACTION_MASTER.md`, `prompt_plan.json`, and `chunks/*.json` for the default package workflow; merged JSON with optional image manifest and console review summaries for existing menu actions. Legacy standalone Markdown prompts remain option 7 only.
Files it may modify: One newly derived package folder after confirmation, user-selected merged JSON output, and legacy prompt output only when option 7 is selected. An existing derived package folder is refused without changes. It can launch `pdf_image_extractor.py`, which writes images and updated JSON.
Safety: Writes files after confirmation
Command: `python tools\cs_block_prompt_generator.py`
Important options: `--help`; interactive choices 0-7. Option 1 is the default extraction-package workflow. Option 7 is explicitly labelled legacy standalone Markdown generation.
Dependencies: Python standard library; optional `fitz`/PyMuPDF for legacy best-effort PDF text extraction; imports `cs_extraction_review.py`.
Related/overlapping tools: Wraps review behavior from `cs_extraction_review.py`; launches `pdf_image_extractor.py`; output can later be converted by `cs_extractor_to_preview_schema.py`.
Current compatibility: Package chunks use only `single_choice` answers and existing extractor-compatible content formats. The master records only the source filename, derived CS1033 identity, physical one-based PDF-page convention, and one concise JSON/defect example; chunks never include parsed source text, local paths, or paper metadata. The master grows additively with marked sections and `prompt_plan.json` is tracking-only. The original PDF/pages remain the source of truth.

### cs_extraction_review.py

Status: Active
Purpose: Reviews generated CS extraction JSON and optional `====IMAGES====` manifest for likely structural, code-block, image-manifest, answer-index, and source metadata problems.
When to use: Use after Claude group output, after merged CS output, or on a folder of JSON files before conversion/import planning.
Inputs: One or more JSON files or directories; optionally responds interactively when asked whether to print a correction prompt.
Outputs: Console findings grouped as ERROR/WARNING/INFO and optional correction prompt text.
Files it may modify: None.
Safety: Read-only
Command: `python tools\cs_extraction_review.py path\to\output.json`
Important options: None beyond one or more positional paths.
Dependencies: Python standard library.
Related/overlapping tools: Used by `cs_block_prompt_generator.py`; overlaps with `validate_questions.py` but checks extractor-specific quality rather than schemaVersion 2 validity.
Current compatibility: Current CS extraction reviewer; read-only and safe for pre-import review.

### cs_extractor_to_preview_schema.py

Status: Supporting
Purpose: Converts reviewed CS extractor JSON into a schemaVersion 2 Mora Quiz preview pack.
When to use: Use after extractor JSON has been reviewed and before running the official schema validator on a preview pack.
Inputs: Reviewed CS extraction JSON, output JSON path, optional subject, bucket, formatting, strictness, and manifest metadata choice.
Outputs: A schemaVersion 2 JSON pack at the explicit output path plus warning/summary text.
Files it may modify: The explicit output JSON path; parent directories may be created.
Safety: Destructive
Command: `python tools\cs_extractor_to_preview_schema.py input.json output.json`
Important options: `--subject`, `--bucket`, `--pretty`, `--strict`, `--include-manifest-metadata`.
Dependencies: Python standard library.
Related/overlapping tools: Complements `cs_extraction_review.py`; output should be checked with `validate_questions.py`; does not replace `quiz_manager.py`.
Current compatibility: Produces schemaVersion 2 preview packs. It does not create live subject data and does not import CS.

### export_legacy_subjects.py

Status: Supporting
Purpose: Exports current lazy `subject_data/*.js` chunks into schemaVersion 2 wrapper packs containing legacy flat questions.
When to use: Use for backups, review packs, or migration/reference exports from existing live chunks.
Inputs: Existing `subject_data/*.js` files and optional source/output/validator paths.
Outputs: `content/question-packs/<subject>/<bucket>.json` files and optional validator report.
Files it may modify: The configured output directory, defaulting to `content/question-packs`.
Safety: Destructive
Command: `python tools\export_legacy_subjects.py`
Important options: `--source-dir`, `--out-dir`, `--validator`, `--skip-validation`.
Dependencies: Python standard library; invokes the configured validator through the current Python executable unless validation is skipped.
Related/overlapping tools: Output is validated by `validate_questions.py`; overlaps with `quiz_manager.py` only in that both understand live chunks.
Current compatibility: Current live chunks are JSON-compatible and export correctly; exported legacy questions intentionally produce migration warnings.

### pdf_image_extractor.py

Status: Supporting
Purpose: Reads Claude output plus `====IMAGES====`, crops figures from a source PDF using an OpenCV window, saves image files, and writes updated JSON with image paths.
When to use: Use only when reviewed extraction output references figures that must be cropped from the original PDF.
Inputs: Interactive Claude output file, optional CS package folder detected from that JSON path, original PDF path, editable image/JSON output folders, and manual crop selections.
Outputs: Cropped image files and updated JSON output with image references changed to saved relative paths.
Files it may modify: Image files below the selected image output folder and JSON below the selected JSON output folder, only after cropping confirmation. A CS package defaults to `<package>/images` and `<package>/JSON`.
Safety: Writes files after confirmation
Command: `python tools\pdf_image_extractor.py`
Important options: None; this is an interactive script.
Dependencies: `opencv-python`/`cv2`, `pymupdf`/`fitz`, `numpy`, `Pillow`.
Related/overlapping tools: Can be launched from `cs_block_prompt_generator.py`; image references from universal prompts should still be cropped/handled with this tool directly when needed, then reviewed and validated afterward.
Current compatibility: Supports legacy `img` plus block/body/explanation image fields. It is an image/file updater, not a schema validator.

### quiz_manager.py

Status: Active
Purpose: Interactive content manager plus validator-first JSON import preview/apply tool for current Mora Quiz chunks.
When to use: Use for current live content management after validation and manual review, or for dry-run import previews.
Inputs: `quiz_data.js`, `subject_data/<module>.js`, schemaVersion 2 JSON packs, interactive menu choices, or CLI import arguments.
Outputs: Interactive previews, dry-run reports, pending/save operations, and optional live updates after explicit confirmation or `--apply`.
Files it may modify: `quiz_data.js`, `subject_data/<module>.js`, short-note manifest/files, and copied short-note HTML files.
Safety: Writes files after confirmation
Command: `python tools\quiz_manager.py`
Important options: `--quiz-data`, `--import-json`, `--subject`, `--bucket`, `--unit`, `--year`, `--hard`, `--apply`.
Dependencies: Python standard library; calls/reuses `tools/validate_questions.py`.
Related/overlapping tools: Uses `validate_questions.py`; consumes packs produced or reviewed by other tools when they are live-compatible; overlaps with legacy add/delete subject utilities inside the same script.
Current compatibility: Current live chunk compatible for question-level schema fields and legacy flat questions. Applies are refused for non-empty pack-level `stimuli` or `images`; chosen direction is to keep those schema packs in `content/question-packs/` for a future pack-aware import/runtime adapter.

### registry_check.py

Status: Active
Purpose: Validates `js/curriculum_registry.js` against subject metadata in `quiz_data.js` without executing JavaScript.
When to use: Use after curriculum registry or subject metadata changes, and before stages that depend on module/semester/departments.
Inputs: Curriculum registry path and subject registry path.
Outputs: Console report with semester/subject counts, errors, warnings, and PASS/FAIL result.
Files it may modify: None.
Safety: Read-only
Command: `python tools\registry_check.py`
Important options: `--curriculum`, `--subjects`.
Dependencies: Python standard library.
Related/overlapping tools: Complements `validate_questions.py`; checks curriculum/module metadata, not question-pack schema.
Current compatibility: Current Stage 6 registry checker for `sem1` and the four live modules.

### test_quiz_manager.py

Status: Supporting
Purpose: Standard-library tests for `quiz_manager.py` import safety, schema preservation, validation refusal, ID collision checks, and temp apply behavior.
When to use: Use after editing `tools/quiz_manager.py`.
Inputs: Test runner invocation; internally creates temporary quiz roots and fixture packs.
Outputs: `unittest` pass/fail report.
Files it may modify: Temporary directories only; it should not write live repo question data.
Safety: Read-only
Command: `python -m unittest discover -s tools\tests -p "test_quiz_manager.py" -v`
Important options: Standard `unittest` discovery options.
Dependencies: Python standard library; imports `tools/quiz_manager.py` and copies `tools/validate_questions.py` into temp fixtures.
Related/overlapping tools: Supports `quiz_manager.py`; does not replace manual smoke tests.
Current compatibility: Current Stage 7.0 regression coverage for the upgraded manager.

### test_claude_prompt_generator.py

Status: Supporting
Purpose: Standard-library tests for `claude_prompt_generator.py` schemaVersion 2 defaults, module flexibility, explicit legacy mode, block/answer guidance, file overwrite safety, clipboard fallback, and CLI help.
When to use: Use after editing `tools/claude_prompt_generator.py` or README guidance that depends on its supported behavior.
Inputs: Test runner invocation; internally imports `tools/claude_prompt_generator.py` and creates temporary files for overwrite checks.
Outputs: `unittest` pass/fail report.
Files it may modify: Temporary directories only; it should not write live repo question data.
Safety: Read-only
Command: `python -m unittest discover -s tools\tests -p "test_claude_prompt_generator.py" -v`
Important options: Standard `unittest` discovery options.
Dependencies: Python standard library; imports `tools/claude_prompt_generator.py`.
Related/overlapping tools: Supports `claude_prompt_generator.py`; complements manual checks of generated prompts.
Current compatibility: Current Stage 7.0A regression coverage for the universal prompt generator.

### validate_questions.py

Status: Active
Purpose: Official validator for schemaVersion 2 question packs; also accepts legacy flat questions with warnings.
When to use: Use before any import preview/apply and after conversion/export tools create packs.
Inputs: One or more JSON pack paths and optional image root for local image existence checks.
Outputs: Console report with question count, validation errors, warnings, and PASS/FAIL result.
Files it may modify: None.
Safety: Read-only
Command: `python tools\validate_questions.py examples\sample_questions.json`
Important options: `--images-root`.
Dependencies: Python standard library.
Related/overlapping tools: Called by `quiz_manager.py`; used by `export_legacy_subjects.py`; complements `cs_extraction_review.py`.
Current compatibility: Authoritative schemaVersion 2 validator for current tooling; warnings do not fail validation.

## Recommended Daily Content Workflow

Use this sequence for the safest current content path:

1. Source material: collect the PDF, marking scheme, source pages, and any page images/crops needed for review.
2. Question generation/conversion: for general current-schema packs, use `python tools\claude_prompt_generator.py` or its CLI options to create a schemaVersion 2 prompt. For CS papers, use `python tools\cs_block_prompt_generator.py` option 1 and provide the source PDF path, batch, and paper year. The tool derives one new `AI exports/cs_packages/<batch>_Batch_<year>` folder, uploads `CS_EXTRACTION_MASTER.md` once, and uses compact chunks with the source PDF/pages. Multiline paste and one-step `back`/`undo` remain available. Use `python tools\cs_extractor_to_preview_schema.py input.json output.json` only after reviewed CS extractor output needs conversion to schemaVersion 2.
3. Image extraction/handling if needed: use `python tools\pdf_image_extractor.py` only when a reviewed output includes `====IMAGES====` entries and real PDF crops are required.
4. Review generated extraction output: use `python tools\cs_extraction_review.py path\to\output.json` or the review menu inside `cs_block_prompt_generator.py`.
5. Schema validation: run `python tools\validate_questions.py path\to\pack.json`; optionally add `--images-root .` when local image existence should be checked.
6. Quiz manager dry-run: run `python tools\quiz_manager.py --import-json path\to\pack.json --subject <module> --bucket <bucket>` and read the preview.
7. Manual review: verify IDs, destination bucket, units/years, overrides, warnings, and files that would change. If the pack has pack-level `stimuli` or `images`, keep it as a reviewed pack under `content/question-packs/` for the future pack-aware adapter; do not force live apply.
8. Explicit apply: only for live-approved, live-compatible packs, rerun with `--apply` or confirm from interactive mode.
9. App smoke test: open the app, load the affected module/mode, check question display, answer behavior, results/review, images, and persistence.

Stage 7.0 does not import CS. Do not create `subject_data/cs.js` during this workflow.

## Tools Not to Run Casually

- `tools/quiz_manager.py`: can delete individual questions, delete all questions in a subject, delete all questions in all subjects, rename/add/delete subjects, merge legacy `_removed.html` data, edit short notes, update `quiz_data.js`, and overwrite `subject_data` chunks after confirmation/save.
- `tools/export_legacy_subjects.py`: writes or overwrites exported packs under `content/question-packs` by default. Use a separate `--out-dir` for experiments.
- `tools/pdf_image_extractor.py`: writes cropped image files into project image folders and writes updated JSON output. Existing filenames can be overwritten by crop saves.
- `tools/cs_extractor_to_preview_schema.py`: writes the explicit output path immediately; it can overwrite an existing preview pack without asking.
- `tools/cs_block_prompt_generator.py`: option 1 creates one new derived CS package folder after confirmation and refuses an existing derived folder without overwriting it; option 7 can still write legacy standalone prompt files. It can also write merged JSON and launch the image cropper.
- `tools/claude_prompt_generator.py`: default output is only a prompt and is safe, but `--output --overwrite` can replace an existing prompt file. Its explicit `--legacy` mode asks for old flat JSON arrays, so do not treat legacy-mode output as current-schema import-ready data. Its schemaVersion 2 prompts may allow pack-level `stimuli`/`images`; those packs are valid for review but are refused by `quiz_manager.py` live apply until pack-aware storage exists.

## Overlapping Tools

- `validate_questions.py`, `cs_extraction_review.py`, and `registry_check.py` all check correctness, but at different layers. Normally use `validate_questions.py` for schema packs, `cs_extraction_review.py` for CS extractor output quality before conversion, and `registry_check.py` for curriculum/subject metadata.
- `quiz_manager.py`, `export_legacy_subjects.py`, and `cs_extractor_to_preview_schema.py` all move question data between formats. Normally use `quiz_manager.py` for live-compatible preview/apply, `export_legacy_subjects.py` for exporting existing live chunks to packs, and `cs_extractor_to_preview_schema.py` for converting reviewed CS extractor JSON into preview schema packs.
- `cs_block_prompt_generator.py` and `claude_prompt_generator.py` both prepare AI extraction instructions. Normally use `claude_prompt_generator.py` for universal schemaVersion 2 pack prompts across modules. Use `cs_block_prompt_generator.py` option 1 for a CS paper package with one reusable master, compact chunks, CS-specific review, merge, and optional image cropping. Its option 7 and `claude_prompt_generator.py --legacy` remain only for older workflows.
- `cs_block_prompt_generator.py` and `cs_extraction_review.py` both review CS outputs. The menu tool is convenient for the guided workflow; the standalone review script is better for direct file/folder review and repeatable checks.
- `pdf_image_extractor.py` can be launched by `cs_block_prompt_generator.py`, but it is still the same cropper. Run it directly when universal prompts or non-CS packs need image handling.
