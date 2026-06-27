-- Stage 3.04a: Supabase RLS/RPC security hardening for Mora Quiz.
-- Review first, then run manually in the Supabase SQL editor for project zjjvtqcuaqyccxdklvbs.
--
-- This patch is intentionally minimal:
--   1. Prevent client-side self-promotion through public.user_profiles.is_admin.
--   2. Disable direct client-side claiming of guest_quiz_sessions until a token-verified RPC exists.
--   3. Leave admin RPC definitions and deployment-drift items untouched.

begin;

-- Ensure RLS remains enabled on the affected tables.
alter table public.user_profiles enable row level security;
alter table public.guest_quiz_sessions enable row level security;

-- Existing profile inserts were owner-scoped only:
--   with check (id = auth.uid())
-- Tighten this so a user-created profile row cannot set is_admin=true.
drop policy if exists "profiles insert own" on public.user_profiles;
create policy "profiles insert own"
on public.user_profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and coalesce(is_admin, false) = false
);

-- Keep normal profile updates working, but reject any browser/authenticated-client
-- attempt to change is_admin. Database-owner and service-role maintenance remains
-- possible because those contexts do not run as auth.role() = 'authenticated'.
create or replace function public.prevent_user_profiles_is_admin_client_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated'
     and auth.uid() is not null
     and new.is_admin is distinct from old.is_admin then
    raise exception 'Changing is_admin from the client is not allowed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_user_profiles_is_admin_client_change
on public.user_profiles;

create trigger trg_prevent_user_profiles_is_admin_client_change
before update of is_admin on public.user_profiles
for each row
execute function public.prevent_user_profiles_is_admin_client_change();

-- Do not expose the trigger function as an RPC-like callable surface.
revoke all on function public.prevent_user_profiles_is_admin_client_change() from public;

-- Existing guest-session linking allowed any authenticated client to update any
-- unlinked guest row, then set user_id = auth.uid(). Disable that direct path
-- until a future token-verified linking RPC is designed.
drop policy if exists "guest sessions link own account" on public.guest_quiz_sessions;
revoke update on table public.guest_quiz_sessions from anon, authenticated;

commit;

-- Expected temporary behavior change:
--   Guest quiz analytics inserts still work.
--   Linked-user reads still work for already-linked rows.
--   Direct guest-to-account claiming via guest_quiz_sessions.update(...) is disabled.
--
-- Deployment drift intentionally not fixed here:
--   admin_short_notes, admin_guest_stats, and admin_reset_user_history may still be
--   missing from the live PostgREST schema until their separate SQL is applied.
