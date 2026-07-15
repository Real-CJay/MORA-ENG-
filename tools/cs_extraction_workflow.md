# CS Block Extraction Workflow

This workflow is for rebuilding CS1033 Programming Fundamentals past-paper data as typed block JSON. It is tooling only. Do not wire the Stage 3 renderer into the live quiz flow, and do not import CS data without manual approval.

The normal user-facing entry point is:

```powershell
python tools\cs_block_prompt_generator.py
```

Use `tools\pdf_image_extractor.py` only through the CS tool's image converter/cropper option, or directly if you need to debug the cropper.

## Simple Workflow

1. Run `python tools\cs_block_prompt_generator.py`.
2. Choose `Generate CS extraction package`.
3. Select one new empty folder for the paper, then enter paper details once. Only source and answer filenames are stored in AI-facing files.
4. Paste all groups using `questions | chunk_type | PDF pages | note`.
5. Press Enter on a blank line or type `done`, review the normalized summary, and confirm. `back` or `undo` reverses one immediate in-memory action; the first one after blank termination reopens group entry.
6. The tool creates `CS_EXTRACTION_MASTER.md`, `prompt_plan.json`, and one compact JSON file per group under `chunks/`.
7. Upload the master once to the ChatGPT or Claude Project. Attach the actual PDF/pages and the relevant chunk JSON for extraction.
8. Save each AI group output: question JSON first, then `====IMAGES====` if the group needs image crops.
9. Run `python tools\cs_block_prompt_generator.py` again to review and merge outputs.
10. Choose `Open image converter/cropper` only if the paper has image blocks, then provide the PDF path when asked.
11. Convert the reviewed/cropped extraction JSON to preview/schema v2.
12. Preview manually before import.

Do not ask Claude to convert the full 80-question paper at once.

## Menu Options

```text
1. Generate CS extraction package
2. Review a Claude group output JSON
3. Merge reviewed group output JSON files into one full paper JSON
4. Review a merged full paper JSON
5. Show workflow/help
6. Open image converter/cropper
7. Generate legacy standalone Markdown prompts
0. Exit
```

## Generate CS Extraction Package

Option 1 uses one output folder for one paper. For a new empty folder it asks for paper-level details once:

```text
Module name:
Paper title:
Year or batch:
ID prefix:
Source PDF filename:
Answer or marking-scheme filename, optional:
Page-number convention:
```

For an existing valid package, it reuses the master identity without asking again. It refuses legacy `prompt_plan.json` folders rather than migrating them.

Then paste groups until a blank line or `done`:

```text
range | type | pages | note
```

Example grouping for a CS paper:

```text
1-4 | shared_flowchart | pages 3-4 | Fig. 1 flowchart
8-10 | shared_code | pages 5-6 | recursive Search(A, i, k)
11-20 | normal_code | pages 6-9 | independent Python/code questions
51-55 | shared_code | pages 18-20 | Stack class
58-59 | shared_code | pages 21-22 | binary search code
60-61 | algorithm_trace | pages 22-23 | heap sort code
62-65 | shared_code | pages 23-25 | linked-list class
```

Supported group types:

```text
normal
normal_code
shared_flowchart
shared_code
algorithm_trace
code_table
statement_group
image_question
mixed
```

If a group type is unknown, the tool reports it and may suggest a close supported type, but never changes it automatically. All invalid pasted lines are shown together and valid groups remain available for correction.

After the blank line, the tool shows a summary such as:

```text
1. Q1-Q4
   Type: shared_flowchart
   PDF pages: 3-4
   Note: Fig. 1 flowchart
```

The package-generation confirmation defaults to Yes. The tool writes nothing before confirmation.

## Package Output Files

Each package contains:

```text
<paper folder>/
  CS_EXTRACTION_MASTER.md
  prompt_plan.json
  chunks/
    001_Q001-Q004_shared_flowchart.json
```

The master contains paper identity and only the extraction sections actually required by the package. It grows additively with stable markers and does not replace manual or existing generated content. Chunks contain only job-specific fields, always use `answerTypes: ["single_choice"]`, and never include local paths or parsed PDF text. `prompt_plan.json` tracks chunk IDs and statuses; it is not an AI instruction file.

The original PDF/pages are the source of truth for wording, layout, indentation, tables, flowcharts, and option text. Option 7 preserves the older standalone Markdown prompt workflow for legacy use only.

## Review Group Output

Save each Claude response with the question JSON first:

```json
{
  "questions": [],
  "defects": []
}
```

If the group uses images, append an image manifest after the JSON:

```text
====IMAGES====
FILENAME    : cs1033_2024_Q12_FIG1.png
PAGE        : 7
QUESTIONS   : Q12, Q13
UNIT        : N/A
FOLDER      : IMAGES/CS/Past Papers/23 Batch 2024/
DESCRIPTION : shared flowchart used by questions 12 and 13
```

Inside question JSON before cropping, image blocks should use filenames only:

```json
{ "type": "image", "img": "cs1033_2024_Q12_FIG1.png", "alt": "shared flowchart" }
```

Do not manually put full `IMAGES/...` paths into question JSON before cropping. Reuse the same filename for shared figures and list every matching question in `QUESTIONS`.

Then choose `Review a Claude group output JSON` in the CS tool. The review reports missing IDs, duplicate IDs, missing source pages, missing question numbers, option-count issues, code accidentally placed in text blocks, prose that mentions code-like terms, raw HTML-like tags in explanation blocks, flattened I/II/III statements, suspicious one-line Python code, missing image paths, image alt issues, question/image-manifest mismatches, and answer indexes outside the options array.

The existing direct review command still works:

```powershell
python tools\cs_extraction_review.py path\to\claude-output.json
```

## How To Interpret Review Results

Review findings are classified as:

```text
ERROR   = must fix before accepting
WARNING = manually inspect; may be okay
INFO    = informational
```

Typical `ERROR` findings:

- invalid JSON
- missing or duplicate IDs
- missing `source.page` or `source.questionNumber`
- no options
- answer index out of range
- image block missing an image path or asset reference
- image filename referenced by a question without a matching manifest entry
- manifest entry references a question that is missing from the JSON
- duplicate manifest filename rows with conflicting page/folder/description metadata
- raw HTML-like tags in `explanationBlocks`
- suspicious one-line code blocks where real code may have been flattened
- actual multi-line code or pseudocode inside a text block

Typical `WARNING` findings:

- option count not equal to 5
- prose mentions of code-like terms such as `Search(A, i, k)`, `A[i][j]`, `len(A)`, `N^2`, `i`, `j`, `IF`, `FOR`, `WHILE`, or `RETURN`
- I/II/III-looking text that may be flattened
- image blocks using legacy `imgAlt` instead of `alt`
- manifest filenames that are not used by any question
- shared image manifest rows that do not list every question using the image
- filename references that look like full paths before cropping

Some warnings are expected and acceptable when prose mentions code terms. For CS extraction, do not keep correcting forever if there are zero errors and the warnings are harmless prose. Always visually check hard groups like shared flowcharts, code tables, shared code blocks, algorithm traces, and I/II/III statements.

When review finds errors or warnings, the tool can generate a correction prompt. If you choose `Generate correction prompt`, it prints a ready-to-paste prompt that includes the file name, issue list, block paths, fixing rules, and strict JSON-only output instructions.

## Merge Group Outputs

Choose `Merge reviewed group output JSON files into one full paper JSON`. You can provide a folder containing group JSON files or semicolon-separated explicit file paths.

The merge keeps the shape:

```json
{
  "questions": [],
  "defects": []
}
```

If image manifest entries exist, the merged output keeps the JSON object first and appends a merged `====IMAGES====` block. The merge deduplicates image manifest rows by filename, combines question lists for shared images, and warns if duplicate filenames disagree on metadata.

Before writing anything, the tool reports total group files, total questions, total defects, total image manifest entries, duplicate IDs, duplicate question numbers, missing question numbers when an expected range is supplied, option count issues, answer index issues, raw HTML-like tags, code-looking text inside text blocks, suspicious one-line code blocks, and image manifest consistency issues.

The tool writes the merged JSON only after you confirm. It does not modify input files.

## Image Converter/Cropper

After merging and reviewing the full paper JSON, choose `Open image converter/cropper` from the CS tool if the paper has image blocks. Then provide the PDF path when the image tool asks for it.

The CS tool launches the existing cropper:

```powershell
python tools\pdf_image_extractor.py
```

The cropper reads the JSON plus `====IMAGES====` manifest, creates each manifest `FOLDER`, saves each `FOLDER/FILENAME`, and updates matching image references from filename-only values to full relative paths such as:

```json
{ "type": "image", "img": "IMAGES/CS/Past Papers/23 Batch 2024/cs1033_2024_Q12_FIG1.png", "alt": "shared flowchart" }
```

For image text, prefer `alt`, not legacy `imgAlt`. The simplified CS crop workflow may temporarily use `img` plus `alt` placeholders before final schema conversion.

Do not write actual crop output into `IMAGES/` during this tooling stage unless that specific test output has been approved.

## Preview And Import

After review and image cropping, convert the extractor shape to the preview/schema v2 shape:

```powershell
python tools\cs_extractor_to_preview_schema.py reviewed-cropped.json preview-pack.json --pretty
```

The converter writes a clean JSON pack with `schemaVersion: 2`, `body`, `options`, `answer`, and `explanation` fields for the dev renderer/validator. It converts CS extractor `blocks` to `body`, `opts` to schema option objects, numeric `ans` indexes to schema answer labels, `explanationBlocks` to `explanation`, code `text` to code `value`, and image refs to schema image assets.

Use the dev preview workflow to inspect rendered questions. Pay special attention to Python indentation, pseudo-code indentation, I/II/III statement grouping, shared figures, flowcharts, tables, and output blocks.

Only import reviewed CS data after manual approval. Do not add CS to the live app, do not create live `content/question-packs/cs/`, and do not copy crop output into live `IMAGES/CS/` until a later approved import stage.
