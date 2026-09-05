-- ═══════════════════════════════════════════════════════════════════════
-- Mora Quiz — Flags & App Settings migration
-- Run once in the Supabase SQL editor for project zjjvtqcuaqyccxdklvbs
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. User question flags ────────────────────────────────────────────────────
create table if not exists public.user_flags (
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject     text not null,
  question_id text not null,
  flagged_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.user_flags enable row level security;

drop policy if exists "flags own select" on public.user_flags;
create policy "flags own select" on public.user_flags
  for select using (user_id = auth.uid());

drop policy if exists "flags own insert" on public.user_flags;
create policy "flags own insert" on public.user_flags
  for insert with check (user_id = auth.uid());

drop policy if exists "flags own delete" on public.user_flags;
create policy "flags own delete" on public.user_flags
  for delete using (user_id = auth.uid());

grant select, insert, delete on table public.user_flags to authenticated;

create index if not exists idx_user_flags_user_subject
  on public.user_flags(user_id, subject);

-- ── 2. App settings (admin-controlled) ───────────────────────────────────────
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.app_settings enable row level security;

-- Anyone can read settings (app loads them on boot)
drop policy if exists "settings public read" on public.app_settings;
create policy "settings public read" on public.app_settings
  for select using (true);

-- Only admins can write
drop policy if exists "settings admin write" on public.app_settings;
create policy "settings admin write" on public.app_settings
  for all using (
    coalesce((select is_admin from public.user_profiles where id = auth.uid()), false)
  )
  with check (
    coalesce((select is_admin from public.user_profiles where id = auth.uid()), false)
  );

grant select on table public.app_settings to anon, authenticated;
grant insert, update, delete on table public.app_settings to authenticated;

-- ── 3. Default settings ───────────────────────────────────────────────────────
insert into public.app_settings (key, value) values
  ('exam_mode_enabled',  'true'::jsonb),
  ('exam_mode_modes',    '["pastpaper","fullpaper"]'::jsonb),
  ('timer_enabled',      'true'::jsonb),
  ('flags_enabled',      'true'::jsonb),
  ('leaderboard_public', 'true'::jsonb),
  ('leaderboard_modes',  '["pastpaper","target"]'::jsonb)
on conflict (key) do nothing;
