-- TechPulse: remove generic / duplicate articles stored in Supabase
-- Run this BEFORE you git push, otherwise the SEO workflow will recreate their pages.

-- Step A - look at what will be deleted (ids come from data/static-slugs.json)
select id, title from public.articles where id in (11, 16, 23) order by id;

-- Step B - after checking Step A, delete them
delete from public.article_views where article_id in ('11', '16', '23');
delete from public.articles where id in (11, 16, 23);