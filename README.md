# Engineering Quiz App — Developer Guide

---

## Developer References

- [Quiz structure contract](docs/quiz-structure-contract.md)

---

## Folder Structure

```
quiz/
├── index.html                 ← Open this in a browser to run the app
├── quiz_style.css             ← All visual styling (colours, layout, components)
├── quiz_data.js               ← All question arrays + subject registry (SUBJECTS)
├── quiz_app.js                ← All app logic, state, rendering, quiz engine
│
├── images/                    ← Question images go here
│   └── example_fig1.png
│
├── quiz_manager.py            ← Add/edit subjects, units, questions interactively
|-- tools/
|   |-- export_legacy_subjects.py <- Export subject_data chunks to JSON packs
|   |-- validate_questions.py      <- Validate JSON question packs
|   `-- registry_check.py          <- Validate semester/module registry
│
└── claude_prompt_generator.py ← Build a Claude prompt to answer past paper PDFs
```

---

## Running the App

Important: run the app through a local web server. Do not open `index.html`
directly with a `file://` URL; service workers, manifest install support, and
app routing require `http://`, `https://`, or a deployed host.

On Windows, run `start.bat`, or run `python -m http.server 8000` in this folder
and open `http://localhost:8000/`.

Just open `index.html` in any modern browser. No server needed.

For images to load, all files must be in the **same folder** — you can't open
`index.html` from a different directory and expect `quiz_style.css` or images to load.

---

## File Roles — What to Upload to Claude

| You want to…                        | Upload this file      | Leave these alone     |
|-------------------------------------|-----------------------|-----------------------|
| Fix a UI bug / change the look      | `quiz_app.js`         | quiz_data.js          |
| Change colours, fonts, layout       | `quiz_style.css`      | quiz_app.js           |
| Add/edit a question manually        | use `quiz_manager.py` | —                     |
| Add a subject or unit               | use `quiz_manager.py` | —                     |
| Debug quiz logic / timer / scoring  | `quiz_app.js`         | quiz_data.js          |
| Change HTML structure (nav, modals) | `index.html`          | quiz_app.js           |

You almost never need to upload all files at once. This keeps Claude well within
its context window even as the app grows.

---

## Adding Questions — Full Workflow

### Step 1 — Generate a Claude prompt for your PDF

```
python claude_prompt_generator.py
```

Answer the questions:
- Which subject?
- Which bank? → Past Paper / Target Hard / Target Normal
- Single topic or whole batch (multiple topics in one PDF)?
- Year and batch number (e.g. Year: 2023, Batch: 22) → stored as `"2023 Batch 22"`
- Topic → Unit mapping (for whole-batch mode):
  ```
  Real Analysis      → Unit 1
  ODEs               → Unit 2
  Riemann Integration → Unit 3
  Vectors            → Unit 4
  Matrices           → Unit 5
  Complex Numbers    → Unit 6
  ```
- ID prefix (e.g. `math_b22_2023`)

This prints a ready-to-paste prompt.

### Step 2 — Get answers from Claude

1. Open a **new** Claude chat (fresh context)
2. Attach your PDF
3. Paste the prompt
4. Claude replies with a JSON array — save it as `questions.json`

### Step 3 — Import into the quiz

```
python quiz_manager.py
```

Navigate to: **Questions → [Subject] → Import from JSON**

Enter the path to `questions.json`, choose the bank and unit if needed.
Save → overwrites `quiz_data.js` in place.

---

## Question JSON Format

Every question Claude generates must follow this format exactly.

### Past Paper question

```json
{
  "id":   "math_b22_2023_Q2",
  "unit": 1,
  "year": "2023 Batch 22",
  "text": "Consider the series Σ (n!)² / (2n)!. Which is true?",
  "opts": [
    "The series converges.",
    "Series diverges.",
    "The series is alternating.",
    "Terms tend to 1/4 as n→∞.",
    "None of the above."
  ],
  "ans": 0,
  "exp": "Apply the Ratio Test: aₙ₊₁/aₙ → 1/4 < 1, so the series converges..."
}
```

### Past Paper question with an image

```json
{
  "id":     "math_b22_2023_Q15",
  "unit":   3,
  "year":   "2023 Batch 22",
  "img":    "math_b22_fig3.png",
  "imgAlt": "Figure 3: Phase diagram",
  "text":   "Using Figure 3, identify the eutectic point temperature.",
  "opts":   ["400°C", "600°C", "750°C", "900°C"],
  "ans":    2,
  "exp":    "The eutectic point is where the two liquidus lines meet..."
}
```

### Target Quiz question (hard bank)

```json
{
  "id":   "math_tgt_h_1",
  "hard": true,
  "text": "Which combination of Hume-Rothery rules governs...?",
  "opts": ["Option A", "Option B", "Option C", "Option D"],
  "ans":  2,
  "exp":  "The size rule states that..."
}
```

### Field reference

| Field    | Type    | Required for          | Notes                                        |
|----------|---------|-----------------------|----------------------------------------------|
| `id`     | string  | all questions         | Unique. Format: `subject_bank_n`             |
| `unit`   | integer | past paper only       | Matches unit numbers in SUBJECTS             |
| `year`   | string  | past paper only       | e.g. `"2023 Batch 22"` — shown as a tag     |
| `hard`   | boolean | target quiz only      | `true` = hard bank, `false` = normal bank    |
| `text`   | string  | all questions         | Full question text. Use `\n` for line breaks |
| `opts`   | array   | MCQ / true-false      | Option texts only, no A/B/C labels           |
| `ans`    | integer/string | all questions  | MCQ: 0-based index. Others: model answer     |
| `exp`    | string  | all questions         | Full explanation shown after answering       |
| `type`   | string  | non-MCQ only          | `"fill"`, `"written"`, `"numerical"`, etc.   |
| `img`    | string  | optional              | Filename in `images/` folder                 |
| `imgAlt` | string  | optional              | Alt text / figure caption                    |

---

## Adding Images to Questions

1. Put the image file in the `images/` folder (or same folder as `index.html`)
2. Use just the filename (or relative path) in the `img` field:

```json
"img": "images/math_b22_fig3.png"
```

Images are clickable in the quiz — clicking opens a fullscreen viewer with:
- Scroll-to-zoom / pinch-to-zoom
- Drag to pan when zoomed in
- Double-click to reset zoom
- Eye button to show/hide the question text
- Escape or click backdrop to close

---

## Managing Subjects and Units with quiz_manager.py

```
python quiz_manager.py
```

### Main menu options

```
1. Manage questions in a subject   → add, delete, import, list questions
2. Manage units in a subject       → rename, add, delete units
3. Export/validate legacy packs   -> use tools/export_legacy_subjects.py and tools/validate_questions.py
4. Rename a subject                → change label, description, icon
5. Add a new subject               → creates all arrays + SUBJECTS entry automatically
6. Delete a subject                → removes all arrays and questions permanently
7. Save & exit
```

### Example: adding a new subject

```
Main menu → 5. Add a new subject
  Subject key  : thermo
  Display label: Thermodynamics
  Emoji icon   : 🌡️
  Accent colour: #ef6c6c
  Description  : Heat transfer, laws of thermodynamics and entropy
  Unit 1: Zeroth and First Law
  Unit 2: Second Law and Entropy
  Unit 3: Heat Engines and Refrigeration
  (blank to finish)
```

quiz_manager creates `THERMO_PAST_UNIT`, `THERMO_PAST_PAPER`, `THERMO_TARGET_HARD`,
`THERMO_TARGET_NORMAL`, and the SUBJECTS entry automatically.

---

## Legacy Export and Validation

The old extract/merge helper workflow is no longer the documented path in this repo. Current question chunks live in `subject_data/*.js`, and Stage 2 exports them into JSON packs without changing the runtime data.

Export the legacy subject chunks:

```powershell
python tools/export_legacy_subjects.py
```

Validate exported packs manually:

```powershell
$packs = Get-ChildItem -Path content/question-packs -Recurse -Filter *.json | ForEach-Object { $_.FullName }
python tools/validate_questions.py $packs
```

The exported packs intentionally keep each question in the legacy flat shape. The adapter/renderer work happens in a later stage.

---

## Question Banks — Where Things Go

Each subject has three question banks in `quiz_data.js`:

```
MATH_PAST_UNIT      → unit-wise past paper mode (filtered by unit number)
MATH_PAST_PAPER     → full paper mode (filtered by year, e.g. "2023 Batch 22")
MATH_TARGET_HARD    → target quiz, hard difficulty
MATH_TARGET_NORMAL  → target quiz, normal difficulty
ALL_MATH_TARGET     → spread of hard + normal (auto-computed, don't edit)
```

### Which bank to use?

| You have…                                | Bank              | Unit field | Year field   |
|------------------------------------------|-------------------|------------|--------------|
| Past paper, sorted by topic/unit         | `PAST_UNIT`       | required   | optional     |
| Past paper, full paper by exam session   | `PAST_PAPER`      | optional   | required     |
| Challenging analysis questions           | `TARGET_HARD`     | none       | none         |
| Recall/application questions             | `TARGET_NORMAL`   | none       | none         |

Questions can exist in both PAST_UNIT and PAST_PAPER if they fit both modes.

---

## Python Tools — Quick Reference

### quiz_manager.py
- **Input**: `quiz_data.js`
- **Output**: saves back to `quiz_data.js` (or new file)
- **Purpose**: all CRUD operations on subjects, units, questions

### tools/export_legacy_subjects.py
- **Input**: `subject_data/*.js`
- **Output**: `content/question-packs/<subject>/<bucket>.json`
- **Purpose**: export current lazy-loaded legacy chunks into JSON packs

### tools/validate_questions.py
- **Input**: schema v2 packs or exported legacy packs
- **Output**: terminal validation report
- **Purpose**: catch data-shape errors before runtime adapter work

### claude_prompt_generator.py
- **Input**: interactive questions
- **Output**: a prompt string (printed + optionally saved to `.txt`)
- **Purpose**: build the Claude prompt for answering past paper PDFs
- **Note**: attach your PDF in the Claude chat, paste the prompt, save the JSON reply

---

## Naming Conventions

| Thing           | Convention                          | Example                     |
|-----------------|-------------------------------------|-----------------------------|
| Question ID     | `subject_bank_unit_n`               | `math_pp_u2_1`              |
| Year tag        | `"YYYY Batch NN"`                   | `"2023 Batch 22"`           |
| ID prefix       | `subject_batchYY_YYYY`              | `math_b22_2023`             |
| Image files     | `subject_batch_figN.ext`            | `math_b22_fig3.png`         |
| Subject key     | lowercase, no spaces                | `thermo`, `cs`, `fluid`     |
| Unit numbers    | integers starting from 1            | `1`, `2`, `3` …             |

---

## Troubleshooting

**App shows blank page**
→ Check browser console (F12). Usually a missing file or a JS syntax error.
→ Make sure all four files are in the same folder.

**Images not showing**
→ Verify the filename in `img` matches exactly (case-sensitive on Linux/Mac).
→ Check the image is in the same folder as `index.html` (or `images/` subfolder).

**Exported packs fail validation**
-> Run `python tools/export_legacy_subjects.py` again and review the validator report. Legacy-format warnings are expected; validation errors need data review.

**quiz_manager.py: UnicodeDecodeError on JSON import**
→ The JSON file has special characters (math symbols). This is fixed in the current
  version — `open(json_path, encoding='utf-8')`.

**Questions not in order in full-paper mode**
→ Make sure each question has a `year` field matching the paper card name exactly.
→ Full-paper mode plays questions in array order — import them in exam order.

**New subject doesn't appear in the app**
→ quiz_manager saves to `quiz_data.js`. Make sure `index.html` loads `quiz_data.js`
  (check the `<script src="quiz_data.js">` tag at the bottom of `index.html`).
