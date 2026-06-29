# Mora Quiz Structure Contract

This document defines the current Mora Quiz subject, mode, bucket, and question
data contract. It is a reference for future subject imports, renderer work, and
CS re-import planning. It does not describe a migration log.

## 1. Subject Registry Contract

`SUBJECTS` lives in `quiz_data.js`.

The subject key is the stable runtime id. Examples currently include
`materials`, `mechanics`, `fluid`, and `math`. The key is used by routes,
progress storage, lazy subject loading, offline caching, and generated subject
data filenames.

Each subject key expects a matching lazy-loaded file:

```text
subject_data/<key>.js
```

That file must assign data for the same key through `window.MORA_SUBJECT_CHUNKS`.
Adding a new subject requires both:

- a registry entry in `SUBJECTS`
- a matching `subject_data/<key>.js` file

Counts come from loaded subject arrays when the subject data has been loaded.
Before loading, counts come from `SUBJECT_COUNTS` in `quiz_data.js`.

CS must not be added to `SUBJECTS` until converted CS data has been reviewed,
previewed, and approved in a separate stage.

## 2. Canonical Bucket Names

Only these bucket names are approved:

```text
pastUnit
pastPaper
targetNormal
targetHard
allTarget
```

`allTarget` is derived from `targetNormal + targetHard`. It is not a separate
source file and should not be authored independently.

Do not use `hardTarget`. Do not create alternate names for the same concepts.
New source files should align with bucket names wherever possible:

```text
content/question-packs/<subject>/pastUnit.json
content/question-packs/<subject>/pastPaper.json
content/question-packs/<subject>/targetNormal.json
content/question-packs/<subject>/targetHard.json
```

## 3. Route and Mode Contract

Current mode routes:

```text
/past-papers
/subjects/<subject>/past-papers/units
/subjects/<subject>/past-papers/full
/subjects/<subject>/target
/questions
/quiz/<subject>
```

Meanings:

- `/past-papers` opens the subject picker for past-paper practice.
- `/subjects/<subject>/past-papers/units` opens unit-wise past-paper setup.
- `/subjects/<subject>/past-papers/full` opens full-paper selection.
- `/subjects/<subject>/target` opens target quiz setup.
- `/questions` opens the Question Directory.
- `/quiz/<subject>` represents an active in-memory quiz.

Direct refresh limitation:

- Active quiz state is stored in memory.
- A browser refresh cannot reconstruct the exact active quiz session.
- Direct `/quiz/<subject>` refresh falls back to the subject home when there is
  no active in-memory quiz.
- Do not treat this as a bug unless a deliberate resume feature is designed and
  implemented later.

## 4. Live Flat Question Contract

The current live quiz renderer uses this flat question shape:

```js
{
  id,
  unit,
  year,
  text,
  context,
  img,
  imgAlt,
  opts,
  ans,
  exp,
  type,
  hard
}
```

Rules:

- `opts` is an array of option text.
- `ans` is a 0-based numeric index into `opts`.
- `img` is a full relative image path after crop/import.
- `imgAlt` is optional but preferred.
- `context` is optional supporting text shown above the question.
- `exp` is the explanation shown after answering.
- `hard` marks target hard questions.

The live renderer does not understand `blocks` or `explanationBlocks`.
The live renderer does not properly render code or table blocks as structured
content. Code-like content in live data is treated as text.

## 5. Block and Schema Question Contract

Extraction/tooling JSON and renderer-preview schema JSON are related but not the
same thing.

Extractor/tooling shape may contain:

```js
{
  id,
  year,
  source,
  blocks,
  opts,
  ans,
  explanationBlocks,
  defects
}
```

Preview/schema v2 shape may contain:

```js
{
  id,
  body,
  options,
  answer,
  explanation
}
```

Rules:

- Extractor JSON is not directly live-ready.
- Extractor JSON is not always renderer-preview-ready either.
- An adapter or converter stage is required between extraction and preview/live
  use. For CS preview work, use:

```powershell
python tools\cs_extractor_to_preview_schema.py input.json output.json --pretty
```

- Image references before cropping may be filename-only.
- Image references after cropping should be full relative paths.
- Code blocks must stay as code blocks, not be flattened into plain text.

## 6. Image Path Contract

Recommended image layout:

```text
IMAGES/<Subject or Subject Key>/Past Papers/<paper label>/<filename>.png
```

Recommended CS example:

```text
IMAGES/CS/Past Papers/2024 Batch 23/pp_2024_Batch_23_FIG1.png
```

Rules:

- Claude/tooling may start with filename-only references.
- The `====IMAGES====` manifest tells the cropper where to save files.
- The cropper updates image references to full relative paths.
- Live data must use full relative paths.
- Future caching/offline logic expects valid image paths.

## 7. Renderer Integration Rule

The live renderer is still in `quiz_app.js`.

`js/question_renderer.js` is preview-only for now. Do not wire it directly into
the live quiz flow.

Future renderer integration should be adapter-first and feature-flagged. It must
be tested against quiz start, answer selection, answer correctness, results,
exam mode, View All, Question Directory, image viewing, math rendering, progress
saving, and offline behavior.

## 8. Future CS Import Rule

Safe future CS path:

```text
1. Extract CS with block schema.
2. Review extraction JSON.
3. Crop images and update paths.
4. Convert to preview/schema v2 with `tools/cs_extractor_to_preview_schema.py`.
5. Preview using dev renderer.
6. Only after approval, generate live-compatible data or integrate renderer behind flag.
7. Add CS to registry only in a separate approved stage.
```

CS must remain absent from the live app until that path is intentionally
completed and approved.

## 9. What Not To Do

- Do not add `cs` to `SUBJECTS` without `subject_data/cs.js`.
- Do not import block-schema JSON directly into live data.
- Do not use `hardTarget`.
- Do not store filename-only images in live data.
- Do not modify app routing to hide direct refresh behavior without a proper
  resume plan.
- Do not wire the preview renderer into the live quiz flow without a feature
  flag and regression tests.
