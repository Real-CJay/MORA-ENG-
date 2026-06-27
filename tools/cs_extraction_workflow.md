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
3. Paste each prompt into Claude with the relevant page image(s).
4. Save each Claude group output JSON.
5. Run `python tools\cs_block_prompt_generator.py` again.
6. Choose `Review a Claude group output JSON`.
7. Choose `Merge reviewed group output JSON files into one full paper JSON`.
8. Choose `Review a merged full paper JSON`.
9. Crop images with `pdf_image_extractor.py` only if needed.
10. Preview manually before import.

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

The generator asks for:

- PDF path
- paper name/year tag
- module name
- ID prefix
- output folder for generated prompts
- page image folder, if available
- question group ranges

Use small groups such as:

```text
1-4 pages 1-2 | shared flowchart
8-10 p4 | shared recursive Search(A, i, k)
51-55 pages 12-13 | shared Stack class
56-57 p14 | shared transpose code
58-59 p15 | shared binary search code
60-61 p16 | shared heap sort code
62-65 pages 17-18 | shared linked-list code
```

Page images are the source of truth for layout, indentation, tables, flowcharts, shared figures, and option text. Parsed PDF text is only a helper.

## Review Group Output

Save each Claude response as a `.json` file with this top-level shape:

```json
{
  "questions": [],
  "defects": []
}
```

Then choose `Review a Claude group output JSON` in the CS tool. The review reports missing IDs, duplicate IDs, missing source pages, missing question numbers, option-count issues, code accidentally placed in text blocks, raw HTML-like tags in explanation blocks, flattened I/II/III statements, suspicious one-line Python code, missing image paths, and answer indexes outside the options array.

The existing direct review command still works:

```powershell
python tools\cs_extraction_review.py path\to\claude-output.json
```

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

Do not write actual crop output into `IMAGES/` during this tooling stage unless that specific test output has been approved.

## Preview And Import

Use the dev preview workflow to inspect rendered questions. Pay special attention to Python indentation, pseudo-code indentation, I/II/III statement grouping, shared figures, flowcharts, tables, and output blocks.

Only import reviewed CS data after manual approval. This stage simplifies the extraction workflow; it does not start Stage 4.1 and does not restore CS to the live app.
