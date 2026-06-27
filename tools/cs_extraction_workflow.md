# CS Block Extraction Workflow

This workflow is for rebuilding CS1033 Programming Fundamentals past-paper data as typed block JSON. It is tooling only. Do not wire the Stage 3 renderer into the live quiz flow, and do not import CS data without manual approval.

## 1. Prepare Page Images

Export page images or page crops for the small group you want Claude to read. Page images are preferred for code-heavy or layout-heavy questions because Claude can see indentation, tables, flowcharts, and shared figures.

Use the PDF as the document source, but treat page images as the source of truth during extraction. Parsed PDF text is only a helper.

## 2. Generate Grouped Claude Prompts

Run from the app root:

```powershell
python tools\cs_block_prompt_generator.py
```

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

Do not ask Claude to convert the full 80-question paper at once.

## 3. Attach Only Relevant Images

Open a new Claude chat for each group. Attach only the relevant page image(s) or crops for that prompt. If the prompt includes parsed text, use it only as a helper and resolve conflicts from the page image.

## 4. Paste One Prompt Per Group

Paste one generated prompt for the group. Claude should return JSON only, with this top-level shape:

```json
{
  "questions": [],
  "defects": []
}
```

Use typed blocks for the question body and explanations. Do not add an `html` block type. Keep HTML-like source text escaped/plain unless it has been manually converted into typed blocks.

## 5. Save Claude Output JSON

Save each Claude response as a `.json` file. Keep the group files separate until they have passed review.

## 6. Run CS Extraction Review

Run:

```powershell
python tools\cs_extraction_review.py path\to\claude-output.json
```

The review script reports missing IDs, duplicate IDs, missing source pages, missing question numbers, option-count issues, code accidentally placed in text blocks, raw HTML-like tags in explanation blocks, flattened I/II/III statements, suspicious one-line Python code, missing image paths, and answer indexes outside the options array.

The script does not modify files.

## 7. Crop Image Blocks If Needed

If the JSON contains image blocks, run:

```powershell
python tools\pdf_image_extractor.py
```

Use it to crop the referenced figures from the PDF after saving Claude output. The extractor keeps old top-level `img` support and can update `img` inside `blocks` and `explanationBlocks`.

Do not write actual crop output into `IMAGES/` during this tooling stage unless that specific test output has been approved.

## 8. Preview Visually

Use the dev preview workflow to inspect rendered questions. Pay special attention to Python indentation, pseudo-code indentation, I/II/III statement grouping, shared figures, flowcharts, tables, and output blocks.

## 9. Import Only After Approval

Only import reviewed CS data after manual approval. This stage creates the safer extraction workflow; it does not start Stage 4.1 and does not restore CS to the live app.
