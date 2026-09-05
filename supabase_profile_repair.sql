-- Mora Quiz profile repair migration
-- Run this in Supabase SQL editor if profile saving, avatars, or admin status
-- do not work on an existing database.

alter table public.user_profiles add column if not exists display_name text not null default 'Student';
alter table public.user_profiles add column if not exists is_admin boolean not null default false;
alter table public.user_profiles add column if not exists avatar_style text not null default 'initials';
alter table public.user_profiles add column if not exists avatar_icon text not null default 'initials';
alter table public.user_profiles add column if not exists avatar_color text not null default '#8fa6f5';
alter table public.user_profiles add column if not exists avatar_bg text not null default '#182033';
alter table public.user_profiles add column if not exists avatar_url text;
alter table public.user_profiles add column if not exists public_profile boolean not null default true;
alter table public.user_profiles add column if not exists leaderboard_visible boolean not null default true;
alter table public.user_profiles add column if not exists created_at timestamptz not null default now();
alter table public.user_profiles add column if not exists updated_at timestamptz not null default now();

alter table public.user_profiles enable row level security;

drop policy if exists "profiles readable when public or own" on public.user_profiles;
create policy "profiles readable when public or own"
on public.user_profiles for select
using (id = auth.uid() or public_profile = true);

drop policy if exists "profiles insert own" on public.user_profiles;
create policy "profiles insert own"
on public.user_profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles update own" on public.user_profiles;
create policy "profiles update own"
on public.user_profiles for update
using (id = auth.uid())
with check (id = auth.uid());

grant select, insert, update on table public.user_profiles to authenticated;
grant select on table public.user_profiles to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatar images public read" on storage.objects;
create policy "avatar images public read"
on storage.objects for select
using (bucket_id = 'profile-avatars');

drop policy if exists "avatar images insert own folder" on storage.objects;
create policy "avatar images insert own folder"
on storage.objects for insert
with check (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatar images update own folder" on storage.objects;
create policy "avatar images update own folder"
on storage.objects for update
using (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatar images delete own folder" on storage.objects;
create policy "avatar images delete own folder"
on storage.objects for delete
using (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
