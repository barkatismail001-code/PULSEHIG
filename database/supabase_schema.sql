-- ============================================================================
-- TechPulse — Complete Database Schema v20261005
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run — uses IF NOT EXISTS everywhere.
-- ============================================================================

-- ============================================================================
-- 1. ARTICLES — core content with i18n support
-- ============================================================================
create table if not exists public.articles (
  id bigserial primary key,
  title text not null,
  excerpt text,
  content text not null,
  category text not null default 'Technology',
  author text default 'TechPulse Team',
  date date default current_date,
  readtime text,
  tags text[] default '{}',
  image text,
  images text[] default '{}',
  featured boolean default false,
  likes int default 0,
  slug text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- i18n columns (jsonb: {"en": "...", "zh": "...", "es": "...", "hi": "...", "fr": "...", "pt": "..."})
  title_i18n   jsonb default '{}'::jsonb,
  excerpt_i18n jsonb default '{}'::jsonb,
  content_i18n jsonb default '{}'::jsonb,

  -- Translation tracking
  translation_status text default 'pending',
  translation_langs text[] default '{}',
  translation_updated_at timestamptz
);

create index if not exists articles_date_idx on public.articles(date desc);
create index if not exists articles_category_idx on public.articles(category);
create index if not exists articles_slug_idx on public.articles(slug);
create index if not exists articles_translation_status_idx on public.articles(translation_status);
create index if not exists articles_featured_idx on public.articles(featured) where featured = true;

-- ============================================================================
-- 2. ARTICLE_VIEWS — per-article view counter
-- ============================================================================
create table if not exists public.article_views (
  article_id text primary key,
  views_count bigint not null default 0,
  daily_views bigint not null default 0,
  last_visit_date date
);

-- ============================================================================
-- 3. SITE_STATS — global visit counter
-- ============================================================================
create table if not exists public.site_stats (
  id text primary key,
  total_visits bigint not null default 0,
  daily_visits bigint not null default 0,
  last_visit_date date
);

insert into public.site_stats (id, total_visits, daily_visits, last_visit_date)
values ('global', 0, 0, current_date)
on conflict (id) do nothing;

-- ============================================================================
-- 4. COURSES — 24 university-level engineering courses
-- ============================================================================
create table if not exists public.courses (
  id bigserial primary key,
  code text unique not null,
  slug text unique not null,
  title text not null,
  university text not null,
  path text not null,
  description text,
  lectures_count int default 0,
  assignments_count int default 0,
  exams_count int default 0,
  duration_hours int default 0,
  difficulty text default 'Intermediate',
  icon text,
  created_at timestamptz default now(),
  title_i18n   jsonb default '{}'::jsonb,
  description_i18n jsonb default '{}'::jsonb
);

create index if not exists courses_university_idx on public.courses(university);
create index if not exists courses_path_idx on public.courses(path);

-- ============================================================================
-- 5. LECTURES — individual lectures per course
-- ============================================================================
create table if not exists public.lectures (
  id bigserial primary key,
  course_slug text references public.courses(slug) on delete cascade,
  number int not null,
  title text not null,
  content text,
  video_url text,
  duration_minutes int default 30,
  created_at timestamptz default now(),
  title_i18n   jsonb default '{}'::jsonb,
  content_i18n jsonb default '{}'::jsonb
);

create index if not exists lectures_course_idx on public.lectures(course_slug, number);

-- ============================================================================
-- 6. ASSIGNMENTS — problem sets with solutions
-- ============================================================================
create table if not exists public.assignments (
  id bigserial primary key,
  course_slug text references public.courses(slug) on delete cascade,
  number int not null,
  title text not null,
  problems jsonb not null,
  total_points int default 100,
  due_week int,
  created_at timestamptz default now(),
  title_i18n jsonb default '{}'::jsonb
);

create index if not exists assignments_course_idx on public.assignments(course_slug, number);

-- ============================================================================
-- 7. EXAMS — midterms and finals with solutions
-- ============================================================================
create table if not exists public.exams (
  id bigserial primary key,
  course_slug text references public.courses(slug) on delete cascade,
  type text not null,
  title text not null,
  duration_minutes int default 120,
  problems jsonb not null,
  total_points int default 100,
  created_at timestamptz default now(),
  title_i18n jsonb default '{}'::jsonb
);

create index if not exists exams_course_idx on public.exams(course_slug, type);

-- ============================================================================
-- 8. TRANSLATION_QUEUE — tracks pending translations
-- ============================================================================
create table if not exists public.translation_queue (
  id bigserial primary key,
  article_id bigint references public.articles(id) on delete cascade,
  target_lang text not null,
  status text default 'pending',
  attempts int default 0,
  error_message text,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique(article_id, target_lang)
);

create index if not exists translation_queue_status_idx
  on public.translation_queue(status, created_at);

-- ============================================================================
-- 9. FORUM_TOPICS — community discussions
-- ============================================================================
create table if not exists public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  content text,
  author text,
  author_id uuid references auth.users(id) on delete set null,
  replies_count int default 0,
  created_at timestamptz default now()
);

create index if not exists forum_topics_created_idx on public.forum_topics(created_at desc);
create index if not exists forum_topics_category_idx on public.forum_topics(category);

-- ============================================================================
-- 10. FORUM_REPLIES — replies to topics
-- ============================================================================
create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.forum_topics(id) on delete cascade,
  content text not null,
  author text,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists forum_replies_topic_idx on public.forum_replies(topic_id, created_at);

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.articles enable row level security;
alter table public.article_views enable row level security;
alter table public.site_stats enable row level security;
alter table public.courses enable row level security;
alter table public.lectures enable row level security;
alter table public.assignments enable row level security;
alter table public.exams enable row level security;
alter table public.translation_queue enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_replies enable row level security;

-- Articles: public read, authenticated write
drop policy if exists "articles_read_all" on public.articles;
create policy "articles_read_all" on public.articles
  for select using (true);

drop policy if exists "articles_write_auth" on public.articles;
create policy "articles_write_auth" on public.articles
  for all using (auth.role() = 'authenticated');

-- Article views: public read
drop policy if exists "article_views_read" on public.article_views;
create policy "article_views_read" on public.article_views
  for select to anon, authenticated using (true);

-- Site stats: public read
drop policy if exists "site_stats_read" on public.site_stats;
create policy "site_stats_read" on public.site_stats
  for select to anon, authenticated using (true);

-- Courses: public read, authenticated write
drop policy if exists "courses_read" on public.courses;
create policy "courses_read" on public.courses for select using (true);

drop policy if exists "courses_write_auth" on public.courses;
create policy "courses_write_auth" on public.courses
  for all using (auth.role() = 'authenticated');

-- Lectures: public read, authenticated write
drop policy if exists "lectures_read" on public.lectures;
create policy "lectures_read" on public.lectures for select using (true);

drop policy if exists "lectures_write_auth" on public.lectures;
create policy "lectures_write_auth" on public.lectures
  for all using (auth.role() = 'authenticated');

-- Assignments: public read, authenticated write
drop policy if exists "assignments_read" on public.assignments;
create policy "assignments_read" on public.assignments for select using (true);

drop policy if exists "assignments_write_auth" on public.assignments;
create policy "assignments_write_auth" on public.assignments
  for all using (auth.role() = 'authenticated');

-- Exams: public read, authenticated write
drop policy if exists "exams_read" on public.exams;
create policy "exams_read" on public.exams for select using (true);

drop policy if exists "exams_write_auth" on public.exams;
create policy "exams_write_auth" on public.exams
  for all using (auth.role() = 'authenticated');

-- Translation queue: authenticated only
drop policy if exists "translation_auth" on public.translation_queue;
create policy "translation_auth" on public.translation_queue
  for all using (auth.role() = 'authenticated');

-- Forum topics: public read, authenticated write
drop policy if exists "topics_read" on public.forum_topics;
create policy "topics_read" on public.forum_topics for select using (true);

drop policy if exists "topics_insert_auth" on public.forum_topics;
create policy "topics_insert_auth" on public.forum_topics
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "topics_update_auth" on public.forum_topics;
create policy "topics_update_auth" on public.forum_topics
  for update using (auth.role() = 'authenticated');

-- Forum replies: public read, authenticated write
drop policy if exists "replies_read" on public.forum_replies;
create policy "replies_read" on public.forum_replies for select using (true);

drop policy if exists "replies_insert_auth" on public.forum_replies;
create policy "replies_insert_auth" on public.forum_replies
  for insert with check (auth.role() = 'authenticated');

-- ============================================================================
-- 12. RPC FUNCTIONS
-- ============================================================================

-- Site visit counter
create or replace function public.hit_site(p_today text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.site_stats;
begin
  insert into public.site_stats (id, total_visits, daily_visits, last_visit_date)
  values ('global', 0, 0, p_today::date)
  on conflict (id) do nothing;

  update public.site_stats
     set total_visits = total_visits + 1,
         daily_visits = case when last_visit_date::text = p_today then daily_visits + 1 else 1 end,
         last_visit_date = p_today::date
   where id = 'global'
   returning * into r;

  return json_build_object('total', r.total_visits, 'daily', r.daily_visits);
end;
$$;

-- Article view counter
create or replace function public.hit_article(p_id text, p_today text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.article_views;
begin
  insert into public.article_views (article_id, views_count, daily_views, last_visit_date)
  values (p_id, 0, 0, p_today::date)
  on conflict (article_id) do nothing;

  update public.article_views
     set views_count = views_count + 1,
         daily_views = case when last_visit_date::text = p_today then daily_views + 1 else 1 end,
         last_visit_date = p_today::date
   where article_id = p_id
   returning * into r;

  return json_build_object('views', r.views_count, 'daily', r.daily_views);
end;
$$;

-- Get articles that need translation
create or replace function public.get_untranslated_articles(p_limit int default 5)
returns table(id bigint, title text, excerpt text, content text, existing_langs text[])
language sql
security definer
set search_path = public
as $$
  select
    a.id,
    a.title,
    a.excerpt,
    a.content,
    coalesce(array(
      select lang
      from unnest(array['zh','es','hi','fr','pt']) as lang
      where a.title_i18n ? lang
    ), array[]::text[]) as existing_langs
  from public.articles a
  where
    a.content is not null
    and length(a.content) > 500
  order by a.id desc
  limit p_limit;
$$;

-- Mark translation complete
create or replace function public.mark_translation_done(
  p_article_id bigint,
  p_lang text,
  p_title text,
  p_excerpt text,
  p_content text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.articles
     set title_i18n = coalesce(title_i18n, '{}'::jsonb) || jsonb_build_object(p_lang, p_title),
         excerpt_i18n = coalesce(excerpt_i18n, '{}'::jsonb) || jsonb_build_object(p_lang, p_excerpt),
         content_i18n = coalesce(content_i18n, '{}'::jsonb) || jsonb_build_object(p_lang, p_content),
         translation_updated_at = now()
   where id = p_article_id;
end;
$$;

grant execute on function public.hit_site(text) to anon, authenticated;
grant execute on function public.hit_article(text, text) to anon, authenticated;
grant execute on function public.get_untranslated_articles(int) to anon, authenticated;
grant execute on function public.mark_translation_done(bigint, text, text, text, text) to authenticated;

-- ============================================================================
-- DONE — Schema ready.
-- Next: run supabase_seed_courses.sql to populate the 24 courses,
--       lectures, assignments, and exams.
-- ============================================================================