-- Adds the admin-controlled timer switch without changing existing settings.
-- Run this once in Supabase SQL editor if your app_settings table already exists.

insert into public.app_settings (key, value)
values ('timer_enabled', 'true'::jsonb)
on conflict (key) do nothing;
