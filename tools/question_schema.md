# Mora Quiz Question Pack Schema v2

Stage 1 defines a new block-based data foundation for future question packs. It does not migrate or rewrite existing `subject_data/*.js` chunks.

## Pack Shape

```json
{
  "schemaVersion": 2,
  "subject": "cs",
  "bucket": "pastPaper",
  "stimuli": {},
  "questions": [],
  "images": {}
}
```

`bucket` must be one of:

- `pastUnit`
- `pastPaper`
- `targetHard`
- `targetNormal`

## Image Registry

```json
{
  "assetId": {
    "src": "IMAGES/path/to/file.png",
    "alt": "Plain-language description",
    "sourcePage": 1
  }
}
```

`src` is required. `alt` and `sourcePage` are recommended.

## Stimuli

Stimuli are shared passages, figures, tables, or setup text that multiple questions can reference.

```json
{
  "CS1033_2024_FLOWCHART": {
    "title": "CS flowchart",
    "body": [
      { "type": "text", "value": "Use the flowchart to answer the questions." }
    ],
    "images": ["cs_flowchart_fig"]
  }
}
```

A question links a stimulus with `stimulusId`.

## Question Shape

```json
{
  "id": "CS1033_2024_Q001",
  "subject": "cs",
  "unit": "Algorithms",
  "topic": "Flowcharts",
  "year": "2024",
  "type": "mcq",
  "stimulusId": "CS1033_2024_FLOWCHART",
  "body": [
    { "type": "text", "value": "What is the output?" }
  ],
  "options": [
    { "label": "a", "body": [{ "type": "text", "value": "10" }] },
    { "label": "b", "body": [{ "type": "text", "value": "12" }] }
  ],
  "answer": { "mode": "single", "value": "b" },
  "explanation": [
    { "type": "text", "value": "Trace the flowchart step by step." }
  ],
  "source": { "pdf": "CS1033_2024.pdf", "page": 2, "qno": 1 },
  "images": [],
  "status": "published"
}
```

`subject` may inherit the pack-level subject, but authors should include it on new questions when practical.

## Question Types

- `mcq`
- `multi_select`
- `numeric`
- `short_answer`
- `structured`
- `written`
- `code_output`
- `matching`
- `image_based`

## Block Types

Blocks are used in question body, explanation, option body, and stimulus body.

```json
{ "type": "text", "value": "Inline math may use \\( ... \\) or $...$." }
{ "type": "math", "latex": "\\\\nu = \\\\mu / \\\\rho", "display": true }
{ "type": "image", "assetId": "fluid_diagram_1" }
{ "type": "code", "language": "python", "value": "print(2 + 3)" }
{ "type": "table", "header": true, "rows": [["Symbol", "Meaning"], ["v", "velocity"]] }
```

There is no `html` block type. Do not add one. Legacy raw HTML in old `exp` fields is handled separately by a future adapter and must not become a first-class schema escape hatch.

## Answer Modes

### Single

For `mcq`. `value` is one option label.

```json
{ "mode": "single", "value": "b" }
```

### Multiple

For `multi_select`. `value` is an array of option labels.

```json
{ "mode": "multiple", "value": ["a", "c"] }
```

### Numeric

For numeric-entry answers. `value` may be a number or an array of numbers.

```json
{ "mode": "numeric", "value": 0.000001, "tolerance": 0.02, "toleranceType": "relative" }
```

`toleranceType` defaults to `relative` if omitted. Use `absolute` near zero or when a fixed margin is intended.

If `value` is an array with two or more entries, `matchMode` is required.

```json
{
  "mode": "numeric",
  "value": [2, -2],
  "matchMode": "all",
  "tolerance": 0.01,
  "toleranceType": "absolute"
}
```

### Text

For short-answer questions. `value` may be one string or an array of strings.

`matchMode: "any"` means one blank with multiple accepted alternatives.

```json
{ "mode": "text", "value": ["EU", "European Union"], "matchMode": "any" }
```

`matchMode: "all"` means the student must supply all required entries.

```json
{ "mode": "text", "value": ["metre", "kilogram"], "matchMode": "all" }
```

`orderedMatch` and `extraAllowed` are only valid with `matchMode: "all"`.

### Self Mark / Manual

For structured, written, proof, or long working questions. The student answers on paper or in their own notes, reveals the model answer, then self-reports correctness in the app.

```json
{ "mode": "self_mark", "value": null }
```

There is no AI grading step.

## Legacy Support

The validator accepts old flat questions:

```json
{
  "id": "legacy_001",
  "unit": 1,
  "year": "2024",
  "text": "Question text",
  "opts": ["A", "B", "C"],
  "ans": "b",
  "exp": "Explanation",
  "type": "mcq",
  "img": "IMAGES/example.png",
  "imgAlt": "Example figure"
}
```

Legacy questions are not rewritten in Stage 1. The validator emits a migration warning.

## Validator Rules

Run:

```bash
python tools/validate_questions.py examples/sample_questions.json
```

Optional image file existence check:

```bash
python tools/validate_questions.py --images-root . examples/sample_questions.json
```

The validator exits with code `0` when there are no errors and non-zero when any error is found. Warnings do not fail validation.
