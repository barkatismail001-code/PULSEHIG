-- Run once in Supabase > SQL Editor. Safe to re-run.

create table if not exists public.site_stats (
  id text primary key,
  total_visits bigint not null default 0,
  daily_visits bigint not null default 0,
  last_visit_date date
);

insert into public.site_stats (id, total_visits, daily_visits, last_visit_date)
values ('global', 0, 0, current_date)
on conflict (id) do nothing;

alter table public.site_stats enable row level security;
drop policy if exists "site_stats public read" on public.site_stats;
create policy "site_stats public read" on public.site_stats
  for select to anon, authenticated using (true);

drop function if exists public.hit_site(date);
drop function if exists public.hit_site(text);

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

grant execute on function public.hit_site(text) to anon, authenticated;

-- Optional: remove legacy non-English categories at the source (the site already hides them in the UI).
update public.articles set category = 'Technology' where category ~ '[\u0600-\u06FF]';
