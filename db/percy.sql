-- Percy: the in-app AI assistant. `percy_chats` is the message bus between the
-- Mission Control UI (writes questions) and the Percy worker on the Mac (writes
-- answers). `percy_health` is the worker's heartbeat so the UI can show online/offline.
-- Run this in the Supabase SQL editor.

create table if not exists percy_chats (
  id text primary key,
  created_at bigint not null,
  question text not null,
  answer text,
  chart jsonb,                               -- optional chart spec when the answer is a graph
  status text not null default 'pending',    -- pending | working | answered | error
  error text,
  skills_used text[],
  answered_at bigint
);

create index if not exists percy_chats_created_idx on percy_chats (created_at desc);
create index if not exists percy_chats_status_idx on percy_chats (status);

create table if not exists percy_health (
  id text primary key,
  last_beat_at bigint not null
);

-- RLS: enable + permissive allow-all + reload (the pattern that sticks on this
-- project; plain "disable" silently re-enables). Single-user app, no auth.
alter table percy_chats enable row level security;
drop policy if exists "allow all percy_chats" on percy_chats;
create policy "allow all percy_chats" on percy_chats for all using (true) with check (true);

alter table percy_health enable row level security;
drop policy if exists "allow all percy_health" on percy_health;
create policy "allow all percy_health" on percy_health for all using (true) with check (true);

notify pgrst, 'reload schema';
