# Stage 9 — Admin sample explorer

Implemented locally, 2026-09-11; extensions 9.5–9.7 approved and implemented
2026-09-13. No database migration or deployment performed.

## What changed

- Admin Dashboard has a top **Statistics | Sample bank | Settings** tab bar.
  Samples open inline; each section loads independently. Tab selection survives
  a settings refresh, but account changes clear it and temporary answers.
- One catalog supplies semesters, departments (including Electrical), Mechanical
  streams, shared modules, quiz modes, units/papers and synthetic questions.
- Both live-compatible and preview-only examples have local answer/reset controls.
  Preview-only still means unsupported for live import/scoring. Answer/explanation,
  raw fields and coverage tags are available. Existing block rendering and pure
  numeric/text comparison helpers are reused, without the renderer's own controls.
- Samples load on demand. Failed loads show an explicit Retry button. Account
  changes close the workspace and reject pending loads; refreshed admin access
  is checked. No progress, session, analytics, outbox or purchase calls are added.
- The explorer script is in the offline shell; sample packs are not automatically
  downloaded. Cold offline sample use can show the stable loading error.
- Static synthetic files are public, not confidential. UI gating is not file security.

## Type completeness (sample interaction only)

| Types | Available interaction | Boundary |
| --- | --- | --- |
| mcq, image_based | Radio selection and check/reset | Image-based sample is image plus choices, not hotspot picking |
| multi_select | Checkboxes; exact selected set | Partial selection is incorrect |
| numeric | Numeric fields, any/all and existing tolerance rules | Not symbolic algebra |
| short_answer | Text fields, accepted alternatives, any/all | Trimmed, case-insensitive comparison; not semantic grading |
| code_output | Type expected output and compare as text | No code execution; same text normalization |
| matching | Type one pair per field, order-independent for this sample | Partial: no visual pair selector/drag-and-drop; data contract not redesigned |
| structured | Free-text response plus model comparison | Partial: no separate subpart inputs/marks |
| written | Free-text response plus model comparison | Manual only; no automatic mark |

The last three limitations are visible on their question panels. New dedicated
pairing/subpart contracts and new live scoring types need separate approval.

## Manually check the implemented feature

Use the updated checkout with `node tests/serve.cjs`, then open
http://127.0.0.1:4173. Your hosted site changes only after deployment.

1. Sign in as your existing admin, open **Admin Dashboard → Sample bank**.
2. Expand **Semester 1 (samples) → Common modules → Sample Engineering →
   Unit-wise past papers → Sample unit 1 → minimal**.
3. Check without choosing: expect a selection prompt. Choose A: incorrect.
   Choose B: correct. Reset: selection/feedback disappear.
4. Open **Full papers → Sample paper A → rich**: inspect its triangle, bold text,
   answer/explanation and raw fields. Open **math** for rendered equations.
5. Under **Target normal**, try duplicate_options: only the second “Same” is correct.
6. Open **Preview-only formats** and try each type. Numeric: enter `2` and `-2`;
   short_answer: `two`; code_output: `2`; matching: `a-1` and `b-2` (either order).
   MCQ/image: A; multi-select: A and B. Expect Correct; change an answer to see
   Incorrect. Reset clears inputs and feedback. Empty responses prompt for input.
   Structured/written: type a response and Compare with model answer; expect the
   model to open, with an explicit notice that no automatic grade was assigned.
   **numeric_exact** is a separate entry: `2` and `-2` must pass; `2.005` and
   `-2` must fail. Its comparison line shows tolerance 0. The original numeric
   tolerance example and generation prompt remain unchanged.
7. Expand Semester 2: inspect Electrical and Mechanical's three streams. CSE's
   empty sample module shows “No sample questions.”
8. Switch to Settings or Statistics and back: sample answers are reset. Only the
   selected section is shown; arrow keys/Home/End navigate the focused tab bar.
   Statistics failure must not prevent opening samples/settings; Retry is explicit.
   Your real progress and quiz counts are unchanged.
   Sign out or switch accounts: the explorer disappears; students cannot open it.
9. Try a narrow mobile viewport. Disable network before an uncached sample load:
   expect a stable error, then reconnect and Retry successfully.

## Verification evidence and limits

- 32 Node tests passed, including admin integration and mocked statistics rendering.
- 61 Python tests passed with the existing isolated dependency directory.
- 57 explorer plus 14 admin-tab real-browser assertions passed in a local synthetic-only harness: access
  denial, hierarchy, correct/incorrect/reset, canonical duplicate answers, image,
  HTML/LaTeX, all nine preview formats, account/role cleanup, late fetch rejection,
  stable failure/retry, synthetic GET-only requests and unchanged browser storage.
  Tabs also cover delayed/rejected statistics, keyboard navigation, settings
  refresh selection, independent sections and account/role changes.
- Desktop and 390px mobile screenshots inspected; browser error log empty.
- JavaScript syntax checks and git diff whitespace checks passed.
- Actual hosted login/admin policy and deployment were not exercised. Harness
  accounts are in-memory mocks; no live account or backend was changed.

To reproduce browser assertions (agent-browser installed or cached):

```powershell
node tests/serve.cjs --samples
# In a second terminal:
npm.cmd exec --offline -- agent-browser --session mora-stage9 open http://127.0.0.1:4173/sample-explorer-test
Get-Content -Raw tests/sample-explorer.browser.js | npm.cmd exec --offline -- agent-browser --session mora-stage9 eval --stdin
Get-Content -Raw tests/admin-tabs.browser.js | npm.cmd exec --offline -- agent-browser --session mora-stage9 eval --stdin
npm.cmd exec --offline -- agent-browser --session mora-stage9 close
```

The harness is available only with the explicit local server flag; it is not
linked by production. No production auth bypass, sample editor, real bank or
curriculum modification is part of this stage.

If 4173 is occupied, leave that server alone: set `$env:MORA_TEST_PORT='4183'`
before starting the harness and use 4183 in its URL. Browser checks for this
extension used 4183; the existing user server on 4173 was left running.
