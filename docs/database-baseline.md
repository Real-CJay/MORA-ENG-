# Database baseline and release order

This is a local source review, not certification of the deployed database. No production SQL was executed. Keep extraction audit 7.0C unchanged; the receipt/limiter migration is a separately approved repair unit.

## Historical scripts

The root SQL files are now explicitly eligible for version control, but were not staged. A secret-pattern scan found no credential matches; this is not proof that arbitrary future SQL is safe to publish. Review the exact diff before staging. SQL remains excluded from static deployment.

| Script | Role / constraint |
| --- | --- |
| `supabase_master_setup.sql` | Historical consolidated tables, triggers, views, grants and admin RPCs; not a migration runner. |
| `supabase_learning_platform.sql` | Historical profile/activity/leaderboard setup; overlaps the master script. |
| `supabase_permissions_repair.sql` | Historical permission repair; must not be replayed over current hardening. |
| `supabase_profile_repair.sql` | Historical profile setup/repair; overlaps profile policies. |
| `admin_setup.sql` | Historical administrator setup; administrative assignments require deliberate review. |
| `supabase_admin_extras.sql` | Additional admin reporting/reset RPC definitions. |
| `supabase_flags_and_settings.sql` | Flag and app-setting objects. |
| `supabase_guest_analytics.sql` | Historical guest analytics policies; direct guest claiming must remain disabled. |
| `supabase_leaderboard_modes.sql` | Leaderboard configuration/views/RPC changes. |
| `supabase_question_reports.sql` | Question report objects. |
| `supabase_short_notes.sql` | Short-note administration objects. |
| `supabase_timer_setting.sql` | Timer setting defaults. |
| `supabase_rls_hardening_stage_3_04a.sql` | Required security baseline: prevent client admin escalation and revoke direct guest-session claiming. |

Several setup/repair scripts recreate the weaker `profiles insert own` policy, and guest setup scripts restore broad update permissions. Replaying them after hardening can reopen the original vulnerabilities. These files are historical references, not a supported alphabetical execution sequence.

## Supported migration path

1. Obtain an authorized schema-only snapshot and backup of the target. Inspect table types, keys, triggers, grants, RLS and exposed schemas. Do not infer live state from these historical files.
2. Establish the existing baseline in an isolated Supabase database. Base tables must precede dependent feature objects. Apply only missing, reviewed feature definitions, then the 3.04a hardening. A fresh-install consolidated bootstrap remains unverified; do not blindly replay all scripts.
3. Verify `answer_history` has the `(user_id, subject, question_id)` unique key; `question_performance` has `(user_id, question_id)` uniqueness; session columns match the expected baseline. Live inspection on 2026-09-05 found integer `selected`, unlike the historical master's text column. The save function explicitly casts the canonical index to integer and is tested against both column types. Check daily-activity triggers and all required feature objects.
4. Test `supabase/migrations/20260905130344_progress_receipts_and_rate_limits.sql` exactly once through migration tracking. It adds nullable answer identity metadata, owner-scoped durable receipts and a private shared rate limiter. Existing totals are not rebuilt or altered. This version was applied to the existing live project on 2026-09-05 with explicit user approval; do not replay it.
5. Confirm authenticated users can call only their save operation, anonymous users cannot call it, and clients cannot read receipts or call/read the limiter. Keep `mora_private` out of PostgREST exposed schemas. Public wrappers are invokers; private helpers use restricted security-definer execution.
6. Deploy additive database support first, then configure server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the AI handler. Retain existing provider keys and quota environment variables. Never put the service key into client code.
7. Only after separate production SQL/deployment authorization, release the dependent client. Before that, a missing save RPC leaves operations queued, and an unavailable limiter makes AI fail closed with 503.

Local verification executes the real new SQL in isolated PGlite/Postgres with representative base tables and auth roles. It covers receipts, replay, ownership, rollback, newer-answer preservation, session deduplication and limiter grants. It does not test the complete historical setup, hosted Auth/PostgREST, deployment settings, or production policies. A hosted staging test remains a release gate.

Do not delete receipts during rollback: late retries depend on them. Retain IndexedDB operations and original legacy recovery data. Do not restore an old client simply to bypass migration errors. Anonymous analytics remain separate telemetry, not authenticated receipt-backed progress; their historical totals are not reconstructed.
