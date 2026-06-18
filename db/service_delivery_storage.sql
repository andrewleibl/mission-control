-- One-time storage setup for pasted/dropped creative images.
-- Run in the Supabase SQL editor.

-- Public bucket to hold creative thumbnails/assets.
insert into storage.buckets (id, name, public)
values ('sd-creatives', 'sd-creatives', true)
on conflict (id) do update set public = true;

-- Allow anon read + write within this bucket (single-user app, no auth layer).
drop policy if exists "sd_creatives_read" on storage.objects;
drop policy if exists "sd_creatives_insert" on storage.objects;
drop policy if exists "sd_creatives_update" on storage.objects;
create policy "sd_creatives_read" on storage.objects for select using (bucket_id = 'sd-creatives');
create policy "sd_creatives_insert" on storage.objects for insert with check (bucket_id = 'sd-creatives');
create policy "sd_creatives_update" on storage.objects for update using (bucket_id = 'sd-creatives');
