# CS Block Extraction Workflow

This workflow is for rebuilding CS1033 Programming Fundamentals past-paper data as typed block JSON. It is tooling only. Do not wire the Stage 3 renderer into the live quiz flow, and do not import CS data without manual approval.

The normal user-facing entry point is:

```powershell
python tools\cs_block_prompt_generator.py
```

Use `tools\pdf_image_extractor.py` only through the CS tool's image converter/cropper option, or directly if you need to debug the cropper.

## Simple Workflow

1. Run `python tools\cs_block_prompt_generator.py`.
2. Choose `Generate grouped Claude prompts`.
3. Enter paper details once.
4. Enter all groups one by one using `range | type | pages | note`.
5. Press Enter on a blank line.
6. Confirm the summary.
7. The tool writes all prompt files, `PROMPT_INDEX.md`, and `prompt_plan.json` at once.
8. Paste each prompt into Claude with only the relevant page images.
9. Save each Claude group output JSON.
10. Run `python tools\cs_block_prompt_generator.py` again.
11. Choose `Review a Claude group output JSON`.
12. Choose `Merge reviewed group output JSON files into one full paper JSON`.
13. Choose `Review a merged full paper JSON`.
14. Crop images with the image converter/cropper only if needed.
15. Preview manually before import.

Do not ask Claude to convert the full 80-question paper at once.

## Menu Options

```text
1. Generate grouped Claude prompts
2. Review a Claude group output JSON
3. Merge reviewed group output JSON files into one full paper JSON
4. Review a merged full paper JSON
5. Show workflow/help
6. Open image converter/cropper
0. Exit
```

## Generate Grouped Prompts

Option 1 asks for paper-level details once:

```text
PDF path:
Paper name:
Year:
Module name:
ID prefix:
Output prompt folder:
Page image folder, optional:
```

Then enter groups until a blank line:

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

If a group type is unknown, the tool warns and asks whether to continue using `mixed`.

After the blank line, the tool shows a summary such as:

```text
Group 1: Q1-Q4, shared_flowchart, pages 3-4, Fig. 1 flowchart
Group 2: Q8-Q10, shared_code, pages 5-6, recursive Search(A, i, k)
```

The tool writes files only after you confirm.

## Prompt Output Files

Prompt filenames use the group order, question range, and group type:

```text
001_Q001-Q004_shared_flowchart.md
002_Q008-Q010_shared_code.md
003_Q011-Q020_normal_code.md
```

The output folder also contains:

- `PROMPT_INDEX.md`, a human-readable list of paper details, prompt filenames, question ranges, group types, pages, notes, and what page images/PDF pages to attach to Claude.
- `prompt_plan.json`, a reusable plan containing paper details and groups so it can be edited or reused later.

Page images are the source of truth for layout, indentation, tables, flowcharts, shared figures, and option text. Parsed PDF text is only a helper.

## Review Group Output

Save each Claude response as a `.json` file with this top-level shape:

```json
{
  "questions": [],
  "defects": []
}
```

Then choose `Review a Claude group output JSON` in the CS tool. The review reports missing IDs, duplicate IDs, missing source pages, missing question numbers, option-count issues, code accidentally placed in text blocks, prose that mentions code-like terms, raw HTML-like tags in explanation blocks, flattened I/II/III statements, suspicious one-line Python code, missing image paths, and answer indexes outside the options array.

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
- raw HTML-like tags in `explanationBlocks`
- suspicious one-line code blocks where real code may have been flattened
- actual multi-line code or pseudocode inside a text block

Typical `WARNING` findings:

- option count not equal to 5
- prose mentions of code-like terms such as `Search(A, i, k)`, `A[i][j]`, `len(A)`, `N^2`, `i`, `j`, `IF`, `FOR`, `WHILE`, or `RETURN`
- I/II/III-looking text that may be flattened
- image blocks using legacy `imgAlt` instead of `alt`

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

Before writing anything, the tool reports total group files, total questions, total defects, duplicate IDs, duplicate question numbers, missing question numbers when an expected range is supplied, option count issues, answer index issues, raw HTML-like tags, code-looking text inside text blocks, and suspicious one-line code blocks.

The tool writes the merged JSON only after you confirm. It does not modify input files.

## Image Converter/Cropper

After merging and reviewing the full paper JSON, choose `Open image converter/cropper` from the CS tool if the paper has image blocks. Then provide the PDF path when the image tool asks for it.

The CS tool launches the existing cropper:

```powershell
python tools\pdf_image_extractor.py
```

For image text, prefer `alt`, not legacy `imgAlt`. The current block renderer/schema prefer `assetId` with a pack image registry entry that contains `alt`; direct image blocks may use `src` plus `alt`. The simplified CS crop workflow may temporarily use `img` plus `alt` placeholders before final schema conversion, but do not use `imgAlt` for typed image blocks.

Do not write actual crop output into `IMAGES/` during this tooling stage unless that specific test output has been approved.

## Preview And Import

Use the dev preview workflow to inspect rendered questions. Pay special attention to Python indentation, pseudo-code indentation, I/II/III statement grouping, shared figures, flowcharts, tables, and output blocks.

Only import reviewed CS data after manual approval. This stage improves grouped prompt generation; it does not start Stage 4.1 and does not restore CS to the live app.
