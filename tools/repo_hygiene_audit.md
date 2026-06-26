# Repo Hygiene Audit

Audit-only pass. No app code, data files, assets, deployment files, or existing tools were edited.

## Baseline

- Baseline commit: `97c62f2`
- Normal `git status --short` at start: clean
- Tracked file count: 152

## Commands Run

```powershell
git status --short
git rev-parse --short HEAD
git ls-files
git status --short --untracked-files=all
git status --short --ignored
Get-Content -Path '.gitignore'
Get-Content -Path '.vercelignore' -ErrorAction SilentlyContinue
Get-ChildItem -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\.git\\' } | Sort-Object Length -Descending | Select-Object -First 50 ...
Select-String -Path <text files> -Pattern api_key,apikey,secret,service_role,OPENROUTER,GROQ,SUPABASE_ACCESS_TOKEN,sbp_,eyJ
Get-ChildItem -Recurse -File -Force -Filter extract_questions.py
Get-ChildItem -Recurse -File -Force -Filter merge_questions.py
Get-ChildItem -Recurse -File -Force -Filter merge_json.py
Get-ChildItem -Recurse -File -Force -Filter question_merger.py
Get-ChildItem -Recurse -File -Force -Filter old_extractor.py
Select-String -Path <text files> -Pattern extract_questions.py,merge_questions.py,merge_json.py,question_merger.py,old_extractor.py
git check-ignore -v -- .env .env.local .vercel supabase/.temp node_modules __pycache__ example.pyc .DS_Store Thumbs.db
Get-ChildItem -Recurse -File | Where-Object Length -eq 0
```

## Current Tracked Suspicious Files

The exact suspicious-name scan found no tracked files matching `old`, `backup`, `copy`, `temp`, `debug`, `test`, `merge`, `extract`, `draft`, or `unused`.

Two tracked files still deserve owner review because their names suggest generated/planning artifacts:

| File | Why It May Be Suspicious | Why It May Be Needed | Recommendation |
|---|---|---|---|
| `IMAGES/Mechanics/Past Papers/2016 Batch 15/ChatGPT Image Jun 5, 2026, 12_00_48 PM.png` | Generated-looking filename with timestamp; exact filename was not found in `subject_data/*.js`, `quiz_app.js`, `auth.js`, `index.html`, or `README.md`. | It may be a manually-created figure kept for a mechanics question but not referenced by exact filename yet. | `NEEDS OWNER DECISION` before archive/delete. |
| `assets/TRANSITION_IMAGES.txt` | Text note/list in assets; exact filename was not referenced by app files checked. | Could document expected transition images and be useful planning context. | `NEEDS OWNER DECISION`; maybe archive to docs if still useful. |

Additional tracked item to review:

| File | Why It May Be Suspicious | Why It May Be Needed | Recommendation |
|---|---|---|---|
| `api/januda.js` | Januda was previously moved toward Supabase Edge Function architecture, but this Vercel API function still exists. | It is currently referenced by `quiz_app.js:4493` via `fetch('/api/januda', ...)`, so deleting it would break current behavior unless the frontend has been changed first. | `NEEDS OWNER DECISION`; keep until Januda architecture is verified. |

## Untracked Files

`git status --short --untracked-files=all` produced no output at audit start.

Normal untracked files/folders: none.

Ignored local-only files/folders were present:

| Path | Source of Ignore | Notes | Recommendation |
|---|---|---|---|
| `-` | `.gitignore` | Root file named `-`; file header appears to be PNG binary. This is very likely an accidental/generated file. | `NEEDS OWNER DECISION`, likely `DELETE` after confirming it is not a needed asset. |
| `.env.local` | `.git/info/exclude` | Local env file; secret scan found a JWT-like value. It is not ignored by committed `.gitignore`. | `IGNORE`; add env patterns to `.gitignore`. |
| `.vercel/` | `.gitignore` | Local Vercel project metadata. | `IGNORE`. |
| `IMAGES/Mechanics/Past Papers/2016 Batch 15/1753578624_2023 Physics Marking Scheme.pdf` | `.gitignore` via `*.pdf` | Large source/reference PDF under protected image tree. | `ARCHIVE` or `NEEDS OWNER DECISION`; keep out of deployment. |
| `IMAGES/Mechanics/Past Papers/2016 Batch 15/2015_Batch_14_Enhanced.zip` | `.gitignore` via `*.zip` | Large archive/source zip under protected image tree. | `ARCHIVE` or `NEEDS OWNER DECISION`; keep out of deployment. |
| `admin_setup.sql` | `.gitignore` via `*.sql` | Local/admin setup SQL. | `ARCHIVE` or keep ignored; owner should decide whether schema history belongs in migrations. |
| `supabase_*.sql` | `.gitignore` via `*.sql` | Local Supabase setup/repair SQL scripts. | `ARCHIVE` or keep ignored; owner should decide whether any should become real migrations/docs. |
| `start.bat` | `.gitignore` | Local helper. | `IGNORE`. |

## Large Files

Top 50 largest files in the working tree, excluding `.git` internals:

| Rank | Size MB | Path | Assessment |
|---:|---:|---|---|
| 1 | 32.951 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q8.png` | Expected image asset, but very large. |
| 2 | 20.412 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q20.png` | Expected image asset, but very large. |
| 3 | 16.862 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q15.png` | Expected image asset, but very large. |
| 4 | 13.198 | `IMAGES/Mechanics/Past Papers/2016 Batch 15/1753578624_2023 Physics Marking Scheme.pdf` | Ignored local PDF/source file; suspicious for repo/deploy hygiene. |
| 5 | 9.226 | `IMAGES/Mechanics/Past Papers/2016 Batch 15/2015_Batch_14_Enhanced.zip` | Ignored local archive; suspicious for repo/deploy hygiene. |
| 6 | 7.513 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q14.png` | Expected image asset, but large. |
| 7 | 4.882 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q9.png` | Expected image asset, but large. |
| 8 | 3.108 | `IMAGES/Fluid Mechanics/Past Papers/2025 Batch 24/pp_2025_Batch_24_FIG3.png` | Expected image asset. |
| 9 | 2.963 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q13.png` | Expected image asset. |
| 10 | 2.842 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q3.png` | Expected image asset. |
| 11 | 2.777 | `IMAGES/Fluid Mechanics/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG7.png` | Expected image asset. |
| 12 | 2.224 | `IMAGES/Fluid Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_FIG3.png` | Expected image asset. |
| 13 | 2.206 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q6.png` | Expected image asset. |
| 14 | 2.134 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q7.png` | Expected image asset. |
| 15 | 1.904 | `IMAGES/Fluid Mechanics/Past Papers/2016 Batch 15/pp_2016_Batch_15_FIG1.png` | Expected image asset. |
| 16 | 1.764 | `IMAGES/Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_FIG1.png` | Expected image asset. |
| 17 | 1.583 | `IMAGES/Fluid Mechanics/Past Papers/2022 batch 21/pp_2022_Batch_21_FIG3.png` | Expected image asset. |
| 18 | 1.581 | `IMAGES/Fluid Dynamics/Past Papers/2022 batch 21/pp_2022_Batch_21_FIG3.png` | Possible duplicate/old naming area: Fluid Dynamics vs Fluid Mechanics. Needs owner review before any move/delete. |
| 19 | 0.734 | `IMAGES/Mechanics/Past Papers/2016 Batch 15/ChatGPT Image Jun 5, 2026, 12_00_48 PM.png` | Generated-looking tracked image; exact reference not found in checked files. |
| 20 | 0.696 | `IMAGES/Fluid Mechanics/Past Papers/2025 Batch 24/pp_2025_Batch_24_Q18.png` | Expected image asset. |
| 21 | 0.579 | `content/question-packs/cs/pastPaper.json` | Expected generated/exported legacy pack. |
| 22 | 0.550 | `subject_data/cs.js` | Expected current runtime question chunk. |
| 23 | 0.547 | `IMAGES/Fluid Mechanics/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG5.png` | Expected image asset. |
| 24 | 0.527 | `IMAGES/Fluid Mechanics/Past Papers/2025 Batch 24/pp_2025_Batch_24_FIG2.png` | Expected image asset. |
| 25 | 0.506 | `IMAGES/CS/Past Papers/pp_2025_Batch_24_FIG2.png` | Expected image asset. |
| 26 | 0.470 | `IMAGES/Fluid Mechanics/Past Papers/2019 Batch 18/pp_2019_Batch_18_Q14.png` | Expected image asset. |
| 27 | 0.449 | `IMAGES/Mechanics/Past Papers/2020 Batch 19/pp_2020_Batch_19_FIG4.png` | Expected image asset. |
| 28 | 0.432 | `IMAGES/Mechanics/Past Papers/2020 Batch 19/pp_2020_Batch_19_Q13.png` | Expected image asset. |
| 29 | 0.401 | `IMAGES/Fluid Mechanics/Past Papers/2025 Batch 24/pp_2025_Batch_24_Q11.png` | Expected image asset. |
| 30 | 0.398 | `IMAGES/Fluid Mechanics/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG4.png` | Expected image asset. |
| 31 | 0.393 | `IMAGES/Mechanics/Past Papers/2020 Batch 19/pp_2020_Batch_19_Q20.png` | Expected image asset. |
| 32 | 0.387 | `IMAGES/Material/UNIT 5/q60-2020.png` | Expected image asset. |
| 33 | 0.368 | `IMAGES/CS/Past Papers/2018 Batch 17/pp_2018_Batch_17_FIG1.png` | Expected image asset. |
| 34 | 0.321 | `IMAGES/Mechanics/Past Papers/2020 Batch 19/pp_2020_Batch_19_FIG3.png` | Expected image asset. |
| 35 | 0.313 | `IMAGES/Fluid Mechanics/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG6.png` | Expected image asset. |
| 36 | 0.305 | `IMAGES/Fluid Mechanics/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG2.png` | Expected image asset. |
| 37 | 0.295 | `IMAGES/Fluid Mechanics/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG1.png` | Expected image asset. |
| 38 | 0.295 | `IMAGES/CS/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG1.png` | Expected image asset. |
| 39 | 0.280 | `IMAGES/Fluid Mechanics/Past Papers/2015 Batch 14/pp_2015_Batch_14_Q4.png` | Expected image asset. |
| 40 | 0.280 | `IMAGES/Fluid Mechanics/Past Papers/2016 Batch 15/pp_2016_Batch_15_Q3.png` | Expected image asset. |
| 41 | 0.279 | `IMAGES/Fluid Mechanics/Past Papers/2022 batch 21/pp_2022_Batch_21_FIG2.png` | Expected image asset. |
| 42 | 0.263 | `IMAGES/Fluid Dynamics/Past Papers/2022 batch 21/pp_2022_Batch_21_FIG2.png` | Possible duplicate/old naming area: Fluid Dynamics vs Fluid Mechanics. Needs owner review. |
| 43 | 0.262 | `subject_data/materials.js` | Expected current runtime question chunk. |
| 44 | 0.257 | `IMAGES/CS/Past Papers/2017 Batch 16/pp_2017_Batch_16_FIG1.png` | Expected image asset. |
| 45 | 0.249 | `IMAGES/Mechanics/Past Papers/2020 Batch 19/pp_2020_Batch_19_FIG1.png` | Expected image asset. |
| 46 | 0.246 | `IMAGES/Mechanics/Past Papers/2016 Batch 15/pp_2016_Batch_15_Q79.png` | Expected image asset. |
| 47 | 0.242 | `IMAGES/Mechanics/Past Papers/2020 Batch 19/pp_2020_Batch_19_Q19.png` | Expected image asset. |
| 48 | 0.240 | `IMAGES/Material/UNIT 5/q50-2021.png` | Expected image asset. |
| 49 | 0.229 | `quiz_app.js` | Expected app monolith; large complexity already known. |
| 50 | 0.225 | `assets/materials-transition.png` | Expected app asset. |

## Secret Scan Results

Values were redacted. These are pattern hits only; some are likely expected public config names or false positives.

| File:Line | Pattern | Assessment |
|---|---|---|
| `.env.local:2` | `eyJ` | Likely token/JWT-like local value. Keep ignored. Do not commit. |
| `auth.js:6` | `eyJ` | JWT-like value in frontend. Verify this is only a Supabase anon/public key, never service-role. |
| `index.html:177` | `GROQ` | Provider-name hit; review for accidental exposed provider key. |
| `index.html:181` | `GROQ` | Provider-name hit; review for accidental exposed provider key. |
| `index.html:183` | `GROQ` | Provider-name hit; review for accidental exposed provider key. |
| `index.html:190` | `OPENROUTER` | Provider-name hit; review for accidental exposed provider key. |
| `quiz_app.js:4004` | `GROQ` | Provider-name hit in frontend/app code. |
| `quiz_app.js:4395` | `GROQ` | Provider-name hit in frontend/app code. |
| `quiz_app.js:4417` | `GROQ` | Provider-name hit in frontend/app code. |
| `quiz_app.js:4422` | `GROQ` | Provider-name hit in frontend/app code. |
| `quiz_app.js:4428` | `GROQ` | Provider-name hit in frontend/app code. |
| `quiz_app.js:4434` | `GROQ` | Provider-name hit in frontend/app code. |
| `quiz_app.js:4488` | `GROQ` | Provider-name hit in frontend/app code. |
| `quiz_app.js:4489` | `GROQ` | Provider-name hit in frontend/app code. |
| `service-worker.js:27` | `OPENROUTER` | Provider-name hit, likely cache/version string or static reference. |
| `service-worker.js:28` | `GROQ` | Provider-name hit, likely cache/version string or static reference. |
| `api/januda.js:3` | `api_key` | Server-side env key name; not necessarily a committed secret. |
| `api/januda.js:4` | `OPENROUTER` | Server-side provider/env reference. |
| `api/januda.js:8` | `GROQ` | Server-side provider/env reference. |
| `api/januda.js:9` | `api_key` | Server-side env key name; not necessarily a committed secret. |
| `api/januda.js:10` | `GROQ` | Server-side provider/env reference. |
| `api/januda.js:29` | `GROQ` | Server-side provider/env reference. |
| `api/januda.js:31` | `apikey` | Variable/header-name hit; not necessarily a committed secret. |
| `api/januda.js:33` | `apikey` | Variable/header-name hit; not necessarily a committed secret. |
| `api/januda.js:46` | `apikey` | Variable/header-name hit; not necessarily a committed secret. |

Recommended follow-up: do a focused Januda/Supabase key review before public release. Pattern scan did not print any values, but `auth.js:6` and `.env.local:2` deserve explicit owner verification.

## Obsolete Tool Candidates

Checked for these old tools:

| Tool | Exists? | References Found | Recommendation |
|---|---:|---|---|
| `extract_questions.py` | No | `README.md:18`, `README.md:204`, `README.md:240`, `README.md:299`, `README.md:341` | `ARCHIVE/UPDATE DOCS`; README documents missing legacy workflow. |
| `merge_questions.py` | No | `README.md:19`, `README.md:256`, `README.md:305` | `ARCHIVE/UPDATE DOCS`; README documents missing legacy workflow. |
| `merge_json.py` | No | None | No cleanup needed unless found elsewhere. |
| `question_merger.py` | No | None | No cleanup needed unless found elsewhere. |
| `old_extractor.py` | No | None | No cleanup needed unless found elsewhere. |

Current tools that appear active/recent:

- `tools/validate_questions.py`
- `tools/export_legacy_subjects.py`
- `tools/registry_check.py`
- `tools/question_schema.md`
- `tools/registry_schema.md`
- `tools/README.md`

## Gitignore Review

Required patterns:

| Pattern | In committed `.gitignore`? | Notes |
|---|---:|---|
| `.env` | No | Add. |
| `.env.*` | No | Add; covers `.env.local`. |
| `.env.local` | No | Currently ignored only by `.git/info/exclude`, which is local and not shared. |
| `.vercel/` | Yes | Good. |
| `supabase/.temp/` | No | Add if using Supabase CLI locally. |
| `node_modules/` | No | Add before npm tooling expands. |
| `__pycache__/` | No | Add for Python tools. |
| `*.pyc` | No | Add for Python tools. |
| `.DS_Store` | Yes | Good. |
| `Thumbs.db` | Yes | Good. |

Recommended `.gitignore` additions:

```gitignore
.env
.env.*
node_modules/
supabase/.temp/
__pycache__/
*.pyc
```

## Classification Table

| Item | Classification | Rationale |
|---|---|---|
| `subject_data/*.js` | KEEP | Current runtime question chunks. Protected by this audit. |
| `content/question-packs/**` | KEEP | Stage 2 exported legacy packs; useful migration foundation. |
| `tools/validate_questions.py` | KEEP | Active schema validator. |
| `tools/export_legacy_subjects.py` | KEEP | Active Stage 2 exporter. |
| `tools/registry_check.py` | KEEP | Active registry validator. |
| `tools/*.md` schema/readme files | KEEP | Current migration docs. |
| `.env.local` | IGNORE | Local secret/config file; should be ignored in committed `.gitignore`. |
| `.vercel/` | IGNORE | Local Vercel metadata. |
| `start.bat` | IGNORE | Local helper, currently ignored. |
| `node_modules/` | IGNORE | Not present, but should be ignored proactively. |
| `__pycache__/`, `*.pyc` | IGNORE | Not present now, but Python tools can generate them. |
| root `*.sql` setup/repair files | ARCHIVE or NEEDS OWNER DECISION | Ignored local database/admin scripts. Decide whether any become formal migrations/docs. |
| `IMAGES/**/*.pdf`, `IMAGES/**/*.zip` | ARCHIVE or NEEDS OWNER DECISION | Ignored source/archive files; large and not needed for static deploy. |
| root file named `-` | DELETE or NEEDS OWNER DECISION | Ignored PNG-like binary with accidental filename. Confirm before removal. |
| `IMAGES/.../ChatGPT Image Jun 5, 2026, 12_00_48 PM.png` | NEEDS OWNER DECISION | Tracked generated-looking image; no exact reference found in checked app/content files. |
| `assets/TRANSITION_IMAGES.txt` | NEEDS OWNER DECISION | Tracked planning/reference file; no exact reference found. |
| `api/januda.js` | NEEDS OWNER DECISION | Still referenced by `quiz_app.js:4493`; do not delete unless Januda proxy target is changed. |
| README references to `extract_questions.py`/`merge_questions.py` | NEEDS OWNER DECISION | Docs mention missing legacy tools; likely stale README content. |
| top large PNG files in `IMAGES/` | KEEP, possible later optimization | They look like expected question assets, but several are very large. Do not optimize/regenerate without visual QA. |

## Known Limitations

- This was a filename/pattern/content audit, not a semantic proof of whether a file is used.
- Secret scan was regex-based and may include false positives; it did not use entropy scanning.
- Secret scan excluded binary image/archive files and did not inspect git history.
- Exact-reference checks can miss dynamically constructed paths.
- No files were deleted, moved, renamed, reformatted, optimized, or edited except this audit file.
- Large images were not visually inspected.
- Ignored files were listed but not opened deeply, except the root `-` file header which appears to be PNG binary.

## Exact Next Cleanup Prompt

```text
Implement Repo Hygiene Cleanup Stage 1 only.

Use tools/repo_hygiene_audit.md as the source of truth.

Scope:
- You may edit .gitignore only.
- You may edit README.md only to remove or update stale references to missing tools extract_questions.py and merge_questions.py.
- You may not delete, move, rename, optimize, or regenerate any app file, image, subject_data file, content/question-packs file, Supabase file, deployment file, or existing tool.
- Do not touch quiz_app.js or app behavior.

Tasks:
1. Add the recommended ignore patterns to .gitignore:
   .env
   .env.*
   node_modules/
   supabase/.temp/
   __pycache__/
   *.pyc
2. Update README.md so it no longer instructs users to run missing tools extract_questions.py or merge_questions.py. Replace that section with a short note pointing to tools/export_legacy_subjects.py and tools/validate_questions.py.
3. Do not delete the root '-' file, ignored SQL files, ignored PDF/ZIP files, ChatGPT-named image, TRANSITION_IMAGES.txt, or api/januda.js in this cleanup stage.
4. Run git status --short, git diff --check, and report changed files.

Output:
- files changed
- exact .gitignore additions
- README sections updated
- confirmation no protected files were touched
```
