-- Supabase setup for admin-uploaded Short Notes.
-- Run this once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_short_notes (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  module text not null,
  title text not null,
  description text,
  storage_bucket text not null default 'short-notes',
  file_path text not null,
  file_url text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_short_notes_active_subject_idx
  on public.admin_short_notes (is_active, subject, title);

alter table public.admin_short_notes enable row level security;

drop policy if exists "Anyone can read active short notes" on public.admin_short_notes;
create policy "Anyone can read active short notes"
on public.admin_short_notes
for select
using (is_active = true);

drop policy if exists "Admins can insert short notes" on public.admin_short_notes;
create policy "Admins can insert short notes"
on public.admin_short_notes
for insert
with check (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
      and user_profiles.is_admin = true
  )
);

drop policy if exists "Admins can update short notes" on public.admin_short_notes;
create policy "Admins can update short notes"
on public.admin_short_notes
for update
using (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
      and user_profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
      and user_profiles.is_admin = true
  )
);

grant select on public.admin_short_notes to anon, authenticated;
grant insert, update on public.admin_short_notes to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('short-notes', 'short-notes', true, 10485760, array['text/html'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read short note files" on storage.objects;
create policy "Anyone can read short note files"
on storage.objects
for select
using (bucket_id = 'short-notes');

drop policy if exists "Admins can upload short note files" on storage.objects;
create policy "Admins can upload short note files"
on storage.objects
for insert
with check (
  bucket_id = 'short-notes'
  and exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
      and user_profiles.is_admin = true
  )
);

drop policy if exists "Admins can update short note files" on storage.objects;
create policy "Admins can update short note files"
on storage.objects
for update
using (
  bucket_id = 'short-notes'
  and exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
      and user_profiles.is_admin = true
  )
)
with check (
  bucket_id = 'short-notes'
  and exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
      and user_profiles.is_admin = true
  )
);

drop policy if exists "Admins can delete short note files" on storage.objects;
create policy "Admins can delete short note files"
on storage.objects
for delete
using (
  bucket_id = 'short-notes'
  and exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
      and user_profiles.is_admin = true
  )
);
