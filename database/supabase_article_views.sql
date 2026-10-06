-- ============================================================================
-- TechPulse — Article Views (Per-Article View Counter)
-- Run AFTER supabase_schema.sql
-- Safe to re-run.
-- ============================================================================

-- Table already created in supabase_schema.sql, but we include here for safety
create table if not exists public.article_views (
  article_id text primary key,
  views_count bigint not null default 0,
  daily_views bigint not null default 0,
  last_visit_date date
);

-- Enable RLS
alter table public.article_views enable row level security;

-- Public read access
drop policy if exists "article_views_read" on public.article_views;
create policy "article_views_read" on public.article_views
  for select to anon, authenticated using (true);

-- ============================================================================
-- hit_article() — called once per browser session per article
-- ============================================================================
drop function if exists public.hit_article(text, date);
drop function if exists public.hit_article(text, text);

create or replace function public.hit_article(p_id text, p_today text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.article_views;
begin
  -- Ensure row exists
  insert into public.article_views (article_id, views_count, daily_views, last_visit_date)
  values (p_id, 0, 0, p_today::date)
  on conflict (article_id) do nothing;

  -- Increment: total always +1; daily +1 if same day, else reset to 1
  update public.article_views
     set views_count = views_count + 1,
         daily_views = case when last_visit_date::text = p_today then daily_views + 1 else 1 end,
         last_visit_date = p_today::date
   where article_id = p_id
   returning * into r;

  return json_build_object('views', r.views_count, 'daily', r.daily_views);
end;
$$;

-- Grant to anon + authenticated
grant execute on function public.hit_article(text, text) to anon, authenticated;

-- ============================================================================
-- Helper: get top articles by views (useful for trending)
-- ============================================================================
create or replace function public.get_top_articles(p_limit int default 10)
returns table(article_id text, views_count bigint)
language sql
security definer
set search_path = public
as $$
  select av.article_id, av.views_count
  from public.article_views av
  order by av.views_count desc
  limit p_limit;
$$;

grant execute on function public.get_top_articles(int) to anon, authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- select * from public.article_views order by views_count desc limit 10;
-- select public.hit_article('test-article', current_date::text);
-- select * from public.get_top_articles(5);