# AGENTS.md — Mora Quiz Permanent Agent Rules

This repo is the **Mora Quiz** app. This file contains stable guardrails only. It is not the stage plan.

For current stage status, current live subjects, current roadmap, and feature-specific instructions, follow the user's latest stage prompt and current master plan.

The current roadmap is `docs/master-plan.md`.

If this file conflicts with the explicit current stage prompt, stop and report the conflict instead of guessing.

## Role

You are an implementation agent.

Do not casually redesign the project.

Do not invent new stages, rename stages, merge stages, skip stages, or broaden scope.

Do exactly what the current prompt asks.

If a task seems missing, unsafe, or structurally unclear, stop and escalate.

## Architecture Guardrails

The app must remain:

- static HTML/CSS/JavaScript
- classic scripts
- Supabase backend
- no React/Next rewrite
- no TypeScript migration
- no build-step rewrite
- no full rewrite
- no live-app ES-module conversion unless explicitly approved

Keep changes small, scoped, and reversible.

Do not mix unrelated work in one change.

## Curriculum Guardrails

The intended curriculum direction is:

```text
Semester → Department/Stream if any → Module/Subject → Quiz Modes → Questions
```

Do not implement or assume:

```text
Subject → Semester
```

Shared modules must not duplicate question data.

Do not add/remove live subjects, modules, departments, or curriculum data unless the current stage explicitly instructs it.

The real curriculum registry must live in its own dedicated curriculum registry file, not as ad hoc long-term architecture inside `quiz_app.js`.

## Git Guardrails

Always start by reporting:

```powershell
git status --short
git branch --show-current
git rev-parse --short HEAD
git log --oneline -n 15
```

Stop if tracked files are dirty unless the current task explicitly continues those changes.

Never use:

```powershell
git add -A
```

Stage exact files only.

Do not commit, merge, push, delete branches, or switch major direction unless the user explicitly asks.

The user normally handles commit/merge/push manually.

## Stage Guardrails

One stage should stay one scoped unit of work.

If the stage is report-only, do not edit files.

If the stage is verification-only, do not edit files unless there is a clearly required small bug fix.

Do not add helpful side features.

Do not refactor unrelated code.

Do not make dev/test-only features production-visible unless explicitly instructed.

Do not change auth, database, save/progress, routing, renderer behavior, or production UI unless the current stage explicitly includes that scope.

## Renderer Guardrails

Do not expand renderer usage beyond the current stage's requested surface.

Do not use a renderer's own answer/check controls in the live quiz unless explicitly approved.

Preserve existing live scoring/save behavior unless the current stage explicitly changes it.

## UI Guardrails

Do not mix structural UI, feature UI, renderer work, data import, performance work, and visual polish in one stage.

Do not do broad theme/polish changes unless the current stage is specifically a UI polish stage.

## Save/Progress Guardrails

Do not change progress key strategy, storage shape, Supabase logic, auth logic, or save/session behavior unless explicitly instructed.

If you find a possible key collision or data-shape issue, stop and escalate with options.

## Judgment Call Protocol

Tier 1 — Tactical:
Small local implementation choices. Allowed silently.

Tier 2 — Adaptive:
Small deviations that preserve intent. Allowed, but must be reported under `Deviations`.

Tier 3 — Structural:
Anything affecting architecture, stage scope, registry/data shape, routing, progress/save keys, production behavior, renderer scope, or future prompts. Stop and escalate.

If unsure, treat it as Tier 3.

A Tier 3 escalation must include:

- 2–3 options
- a recommendation
- no unilateral decision

## Required Report Format

Every stage response must use:

```text
What I did:
  ...

Deviations:
  ...

Escalations:
  ...
```

If there are none:

```text
Deviations:
  none

Escalations:
  none, stage complete
```

## Testing Rules

### Content boundary

For application maintenance, use `examples/synthetic/catalog.json` and
`docs/sample-bank-contract.md`. Do not inspect real question text, figures,
exports or historical reports containing question excerpts without explicit
user permission. Validators may process real banks programmatically, but only
content-safe output from `tools/validate_content_safe.py` should enter AI context.
Do not stream older verbose validators/import previews for real content.
Academic review belongs to the user. Synthetic examples supplement, not replace,
behavioral regression tests. Samples must never enter real quizzes or progress.

Run every check requested by the current stage prompt.

For JavaScript edits, normally run syntax/diff checks requested by the prompt, such as:

```powershell
node --check quiz_app.js
git diff --check
```

Only claim tests passed if actually run.

Report any skipped test and why.

## Final Rule

When in doubt, stop and report.

Do not guess, silently redesign, or clean up outside scope.
