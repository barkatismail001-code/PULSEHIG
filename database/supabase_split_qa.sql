-- TechPulse: separate Q&A from the forum.
-- Run ONCE in Supabase Dashboard > SQL Editor (safe to run again).
-- Forum keeps: forum_topics / forum_replies.   Q&A gets: qa_questions / qa_answers.

-- 0) Admin check (same definition as supabase_security_fix.sql; harmless if it already exists)
create or replace function public.is_admin()
returns boolean language sql stable set search_path = public as $fn$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'jonsrockytech@gmail.com'
$fn$;
grant execute on function public.is_admin() to anon, authenticated;

-- 1) Tables
create table if not exists public.qa_questions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 140),
  category text not null default 'general',
  content text,
  author text,
  author_id uuid references auth.users(id) on delete set null,
  answers_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists qa_questions_created_idx  on public.qa_questions(created_at desc);
create index if not exists qa_questions_category_idx on public.qa_questions(category);

create table if not exists public.qa_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.qa_questions(id) on delete cascade,
  content text not null check (char_length(content) between 2 and 10000),
  author text,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists qa_answers_question_idx on public.qa_answers(question_id, created_at);

-- 2) Security: everyone reads, signed-in users write their own rows, only admin deletes
alter table public.qa_questions enable row level security;
alter table public.qa_answers   enable row level security;

drop policy if exists qa_questions_read   on public.qa_questions;
drop policy if exists qa_questions_insert on public.qa_questions;
drop policy if exists qa_questions_delete on public.qa_questions;
create policy qa_questions_read   on public.qa_questions for select using (true);
create policy qa_questions_insert on public.qa_questions for insert to authenticated with check (author_id = auth.uid());
create policy qa_questions_delete on public.qa_questions for delete to authenticated using (public.is_admin());

drop policy if exists qa_answers_read   on public.qa_answers;
drop policy if exists qa_answers_insert on public.qa_answers;
drop policy if exists qa_answers_delete on public.qa_answers;
create policy qa_answers_read   on public.qa_answers for select using (true);
create policy qa_answers_insert on public.qa_answers for insert to authenticated with check (author_id = auth.uid());
create policy qa_answers_delete on public.qa_answers for delete to authenticated using (public.is_admin());

grant select on public.qa_questions, public.qa_answers to anon, authenticated;
grant insert on public.qa_questions, public.qa_answers to authenticated;

-- 3) Keep answers_count correct automatically
create or replace function public.qa_sync_answers_count()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  update public.qa_questions q
     set answers_count = (select count(*) from public.qa_answers a where a.question_id = q.id)
   where q.id = coalesce(new.question_id, old.question_id);
  return null;
end
$fn$;
drop trigger if exists qa_answers_count_trg on public.qa_answers;
create trigger qa_answers_count_trg after insert or delete on public.qa_answers
  for each row execute function public.qa_sync_answers_count();

-- 4) OPTIONAL: move questions that were posted from qa.html out of the forum.
--    a) look at the old rows:   select id, title, category, created_at from public.forum_topics order by created_at desc;
--    b) put the ids of the QUESTIONS in the list below (3 places), then uncomment and run:
--
-- insert into public.qa_questions (id, title, category, content, author, author_id, created_at)
--   select id, title, category, content, author, author_id, created_at
--   from public.forum_topics where id in ('PUT-ID-1','PUT-ID-2');
-- insert into public.qa_answers (question_id, content, author, author_id, created_at)
--   select topic_id, content, author, author_id, created_at
--   from public.forum_replies where topic_id in ('PUT-ID-1','PUT-ID-2');
-- delete from public.forum_topics where id in ('PUT-ID-1','PUT-ID-2');
