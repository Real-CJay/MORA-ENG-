# Mora Quiz Question Tools

Stage 1 adds a schema foundation and validator for future question packs. These tools do not run inside the current static app and do not modify existing `subject_data/*.js` chunks.

## Files

- `tools/validate_questions.py` validates schemaVersion 2 JSON packs and accepts legacy flat questions with migration warnings.
- `tools/export_legacy_subjects.py` exports existing lazy-loaded `subject_data/*.js` chunks into legacy JSON question packs.
- `tools/question_schema.md` documents the block-based schema.
- `tools/registry_check.py` validates the semester/department subject registry in `quiz_data.js`.
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

This checks that every subject points at a real semester, department-specific modules point at real departments, and archived/shared-module cases are visible in the report.

## Schema Notes

Only these block types are allowed for new schemaVersion 2 content:

- `text`
- `math`
- `image`
- `code`
- `table`

There is no `html` block type. Legacy HTML-like content must be handled by a future adapter as escaped plain text, not promoted into the schema.
