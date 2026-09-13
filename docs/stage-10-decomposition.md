# Stage 10 — Scoped decomposition

Implemented locally on 2026-09-14, from `e628371`. Not deployed.

## 10.1 — Feature dependencies / edit map

Use this map to select a small working set, not to skip regression tests.
All application helpers remain classic scripts; no new build step or framework.

| Feature | Owner / dependencies | Boundary to preserve |
| --- | --- | --- |
| App shell and delivery | `index.html`, `quiz_style.css`, `service-worker.js`, `pwa.js` | Script order, required offline assets and matching asset queries |
| Curriculum and loading | `js/curriculum_registry.js`, `js/curriculum_module_adapter.js`, `js/app_subject_loader.js`, `js/app_subject_helpers.js`; consumed by `quiz_app.js` | Stable module keys; question banks remain external, loaded on demand |
| Quiz lifecycle and screens | `quiz_app.js`, `js/app_quiz_utils.js`, `js/app_helpers.js`, `js/app_transition_helpers.js`, `js/app_directory_data.js` | Shared state, timer/completion, answer identity and navigation tokens |
| Identity and progress | `auth.js`, `js/app_progress_outbox.js`; called by app lifecycle | Account ownership, receipt/save semantics; not extracted here |
| Rendering | `js/app_question_render_bridge.js`, existing `js/question_renderer.js` | Current hydration surfaces only; live scoring stays in app |
| Admin samples | `js/app_admin_tabs.js`, `js/app_sample_explorer.js`, synthetic catalog, admin callbacks in app | Sample state never enters live progress or question pools |
| Chat content/provider integration | `quiz_app.js` (`chatState`, `toggleChat`, `openJanudaChat`, provider selection, message rendering/sending) | Chat state and network behavior unchanged |
| Chat geometry pilot | `js/app_chat_controls.js`, fixed shell DOM and existing CSS | Geometry only; no question/message data or persistence dependency |

Do not read real question banks to maintain these features. Use the synthetic
catalog and behavioral tests. The compatibility manifest selects related checks;
it is not a complete call graph or proof of all runtime behavior.

## 10.2 — Pilot contract

Moved the resize and window-management IIFEs (525 lines) unchanged into
`js/app_chat_controls.js`. `index.html` loads it exactly once before `quiz_app.js`.
Both listener groups keep their existing DOM-ready handling. No dynamic reload or
repeated initialization is introduced. Closing chat does not unload the script.

Inputs: `#chatWindow`, `#chatResizeN/W/NW`, `.chat-header`, `.chat-win-controls`,
`#chatWcMin`, `#chatWcMax`, `#app`, `.nav-bar`, `#appZoomBar`, `#appZoomLabel`;
mouse/touch/wheel events, viewport dimensions and existing CSS classes.

Public hooks retained:

- Inline UI: `chatWinMinimize`, `chatWinMaximize`, `chatWinRestore`,
  `chatSnapHover/Leave/Click`, `chatMaxHover/Leave`, `splitZoomApp`.
- App bridge: `_chatResetZoom`, `_chatWinForceNormal`, `_applyAppZoom`, `_getAppScaler`.

Geometry state remains private to the IIFEs. Split mode temporarily wraps `#app`
in `#appShell`; restore/close removes the wrapper and resets zoom. Open/close
entry points remain in `quiz_app.js` because they use providers and messages.
Tutorial callers and the global handler export list are unchanged.

Delivery: asset query 86; worker cache v89; the new helper is a required precache
asset. These are delivery identifiers, not per-file compatibility certificates.
The sample-wiring test now accepts version digits; `check_sync.py` still enforces
actual index/worker version agreement.

## 10.3 — Stop after the useful pilot

No additional extraction in this stage. Moving quiz lifecycle or authentication
would cross shared-state/save boundaries without helping Stage 11 immediately.
Future extraction remains optional, one independently tested feature at a time.
Proceed to Stage 11 curriculum foundation; do not make a full decomposition a gate.

## Verification and known baseline limitations

- The two moved blocks were compared against `e628371`: identical logic.
- Node regression suite: 38 passed, including five focused chat tests.
- Browser harness: 30 behavioral assertions at desktop 1262×568 and mobile 390×844.
  Actual shell markup/CSS and open/close functions are used; messages/providers are
  synthetic stubs. No backend requests, real content, login, AI costs or saves.
- Syntax/diff checks passed; all ten compatibility suites passed (including
  authoring/import/CS checks). The local inventory records the tested snapshot.
- Browser skills prompted real-CSS checks beyond the DOM model. These exposed
  two **pre-existing, deliberately unchanged** CSS limits: `min-height:300px`
  prevents minimizing to the requested 54px; `min-width:280px` makes split mode
  overlap the app at narrow widths. Browser assertions explicitly preserve these
  baseline constraints; passing does not mean those UX issues are fixed.

Follow-up choice: (1) approve a small separate CSS/window-state repair (recommended),
or (2) retain these known limitations while proceeding with curriculum work.
Neither choice is silently included in this behavior-preserving extraction.
Hosted updates, cold offline startup and physical-device gestures were not tested
in this stage; offline regression and required-asset checks are not substitutes.

## Manual check

From the repository terminal:

```powershell
node tests/serve.cjs --chat
```

Open `http://127.0.0.1:4173/chat-controls-test`. If port 4173 already serves an older
test process, use `$env:MORA_TEST_PORT='4183'` before starting and open that port.

1. Click **Ask Januda Ayya**: synthetic text appears, input receives focus.
2. Minimize/restore, maximize/restore; note the existing 300px minimize limitation.
3. Click Snap; use its hover popup for Right. App moves alongside chat. Zoom +/−,
   reset and Ctrl+wheel affect the app panel. Restore returns the app to normal.
4. Drag the header to each side/top; previews appear and release snaps/maximizes.
   Resize via the upper/left edges, then release: further movement stops resizing.
5. Close/reopen: normal geometry, no leftover split wrapper/zoom, same message.
6. At a narrow viewport, normal chat fits; note the existing split-width limitation.
   On touch hardware, try the resize handles; physical touch acceptance is manual.

This harness is available only with `--chat`; it is not part of the production
index or worker cache. Send is disabled. For the real local app, open `/`, click
Ask Januda Ayya and repeat the controls without sending a paid/upstream request.

Automated browser replay after opening the isolated page:

```powershell
Get-Content -Raw tests/chat-controls.browser.js | npm.cmd exec --offline -- agent-browser --session mora-stage10 eval --stdin
```

The browser CLI must already be installed/cached. No dependency download is
required for the five focused Node tests: `node --test tests/chat-controls.test.cjs`.
