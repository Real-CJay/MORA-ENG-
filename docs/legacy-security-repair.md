# Legacy security repair — 2026-09-15

Approved scope: resolve the legacy security escalations while preserving public rankings. No new project, paid activation, curriculum data, progress rewrite or frontend redesign.

## Changes and live status

Both migrations were tested in isolated PGlite and applied to existing project `zjjvtqcuaqyccxdklvbs` with the user's authorization to resolve the escalations. Do not replay historical setup scripts or these migrations.

| Local source version | Live tracking version | Migration |
| --- | --- | --- |
| 20260914202226 | 20260914203528 | legacy_function_permissions |
| 20260914203020 | 20260914203541 | public_leaderboard_boundary |

The first migration removes client execution of internal trigger functions, fixes missing search paths, and wraps existing admin-checked functions in public invoker RPCs with anonymous execution revoked. Public settings reads no longer need elevated execution. Admin RPC arguments/defaults/results remain unchanged.

The second moves the six original aggregate views into `mora_private`, revokes direct client reads, and exposes identical public invoker views through fixed, no-argument private functions. These functions intentionally disclose opted-in rankings; they are not intended to apply each viewer's session RLS to aggregate results. Raw session/profile policies are unchanged. `leaderboard_visible` still controls inclusion independently of `public_profile`. Never expose `mora_private` in PostgREST or grant direct reads on its aggregate views.

Local icon URLs are now root-relative; worker cache is v93. These frontend changes are not deployed. The roadmap now plans cross-semester department identities and filtering in 12.2/13; those features are not implemented by this repair.

## Verification

- `node --test tests/*.test.cjs`: 51 passed, including synthetic role checks, unchanged rankings across all periods/modes, opt-out exclusion, private-profile opt-in preservation, raw table isolation, admin authorization and trigger execution after revocation.
- Live SQL: all six public results exactly match their retained private aggregates; anonymous ranking reads succeed. No user rows were returned to agent context.
- Fresh security advisor: six definer-view warnings, legacy definer-RPC warnings and missing-search-path warnings cleared.
- Remaining INFO notices on `mora_private.progress_receipts` and `mora_private.rate_limits` are intentional deny-by-default RLS, not missing public-access policies. See [advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- Leaked-password protection remains disabled: [Supabase requires Pro or above](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No paid plan was enabled. This is a remaining limitation, not a claim of complete security.
- User confirmed the supplied manual checks passed on 2026-09-15. This is user-reported acceptance, not a claim that the agent replayed every hosted Auth/device flow.

## Manual checks

1. On the live app, open Leaderboard and switch every available ranking category and Weekly/Monthly/All time. Expect populated rankings where activity exists, without permission errors. Repeat signed out.
2. Sign in as admin, open Dashboard → Statistics. Expect the existing statistics and user lists; a student must not gain admin access.
3. To check the local icon fix, run `node tests/serve.cjs` (default port 4173), open the printed URL, navigate into a module's Full Past Papers page and reload normally. Check Network: `/assets/icons/icon-192.png` succeeds; no nested-route icon 404. Accept the worker update outside any quiz. The install-banner message alone is informational.
4. Department-wide browsing remains a roadmap item: inspect 12.2.c and 13.1.a in `docs/master-plan.md`, not the current UI.

User authorized committing this repair and supporting roadmap updates on 2026-09-15 after reporting manual checks passed. No push or frontend deployment was performed. Do not roll back by replaying old grants or setup scripts. Review any reverse migration separately, preserving opt-in and admin checks.
