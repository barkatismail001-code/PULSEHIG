-- Run once in Supabase → SQL Editor if saving an article fails with:
--   could not find the "readtime" column of "articles" in the schema cache
-- Safe to run multiple times.

alter table public.articles add column if not exists readtime text;
alter table public.articles add column if not exists slug text;
alter table public.articles add column if not exists images text[] default '{}';
alter table public.articles add column if not exists title_i18n jsonb default '{}'::jsonb;
alter table public.articles add column if not exists excerpt_i18n jsonb default '{}'::jsonb;
alter table public.articles add column if not exists content_i18n jsonb default '{}'::jsonb;
alter table public.articles add column if not exists translation_status text default 'pending';
alter table public.articles add column if not exists translation_langs text[] default '{en}';

-- Refresh PostgREST so the new columns are visible immediately
notify pgrst, 'reload schema';
