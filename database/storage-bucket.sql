-- تأكد من وجود bucket article-images
insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do update set public = true;

-- سياسات القراءة العامة
drop policy if exists article_images_read on storage.objects;
create policy article_images_read on storage.objects
  for select using (bucket_id = 'article-images');