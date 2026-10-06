-- TechPulse security fix
-- Run ONCE in Supabase Dashboard > SQL Editor (safe to run again).
-- Problem fixed: the old policies allowed ANY signed-in user (forum accounts included)
-- to edit or delete articles, courses, lectures, assignments and exams.

-- 1) Admin check. The email claim comes from Supabase Auth and cannot be edited by the user.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $fn$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'jonsrockytech@gmail.com'
$fn$;

grant execute on function public.is_admin() to anon, authenticated;

-- 2) Content tables: public read stays, writes only for the admin
do $do$
declare
  t text;
  p record;
begin
  foreach t in array array['articles','courses','lectures','assignments','exams','translation_queue'] loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    for p in select policyname from pg_policies
             where schemaname = 'public' and tablename = t and cmd <> 'SELECT' loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;

    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_write', t);

    if t <> 'translation_queue' and not exists (
         select 1 from pg_policies where schemaname = 'public' and tablename = t and cmd = 'SELECT') then
      execute format('create policy %I on public.%I for select using (true)', t || '_public_read', t);
    end if;
  end loop;
end
$do$;

-- 3) Forum: users can still post, but only the admin can edit/delete topics and replies
do $do$
declare
  p record;
begin
  if to_regclass('public.forum_topics') is not null then
    for p in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'forum_topics' and cmd in ('UPDATE','DELETE') loop
      execute format('drop policy %I on public.forum_topics', p.policyname);
    end loop;
    create policy "topics_update_admin" on public.forum_topics
      for update to authenticated using (public.is_admin()) with check (public.is_admin());
    create policy "topics_delete_admin" on public.forum_topics
      for delete to authenticated using (public.is_admin());
  end if;

  if to_regclass('public.forum_replies') is not null then
    for p in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'forum_replies' and cmd in ('UPDATE','DELETE') loop
      execute format('drop policy %I on public.forum_replies', p.policyname);
    end loop;
    create policy "replies_delete_admin" on public.forum_replies
      for delete to authenticated using (public.is_admin());
  end if;
end
$do$;

-- replies_count is now maintained by the database (users can no longer update topics)
create or replace function public.forum_sync_replies_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update public.forum_topics t
     set replies_count = (select count(*) from public.forum_replies r
                           where r.topic_id = coalesce(new.topic_id, old.topic_id))
   where t.id = coalesce(new.topic_id, old.topic_id);
  return null;
end
$fn$;

drop trigger if exists forum_replies_count_trg on public.forum_replies;
create trigger forum_replies_count_trg
  after insert or delete on public.forum_replies
  for each row execute function public.forum_sync_replies_count();

update public.forum_topics t
   set replies_count = (select count(*) from public.forum_replies r where r.topic_id = t.id);

-- 4) Translation helper functions: only the service key (GitHub Actions) may call them
do $do$
begin
  revoke execute on function public.get_untranslated_articles(int) from public, anon, authenticated;
  grant execute on function public.get_untranslated_articles(int) to service_role;
exception when undefined_function then
  null;
end
$do$;

do $do$
begin
  revoke execute on function public.mark_translation_done(bigint, text, text, text, text) from public, anon, authenticated;
  grant execute on function public.mark_translation_done(bigint, text, text, text, text) to service_role;
exception when undefined_function then
  null;
end
$do$;

-- 5) Check the result: every write policy must say is_admin()
select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- NOTE (Storage): also open Dashboard > Storage > Policies and make sure the bucket
-- "article-images" only allows INSERT / UPDATE / DELETE for the admin (public.is_admin()).