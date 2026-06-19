-- Service Delivery: per-campaign, per-day performance snapshots.
-- Powers day-over-day trends (Phase 2). Written by the Meta sync (runMetaSync)
-- from Meta's true daily breakdown (time_increment=1), keyed by client+label+day
-- to match how sd_tests identifies a campaign. Run this in the Supabase SQL editor.

create table if not exists sd_daily (
  client text not null,
  label text not null,
  day date not null,
  spend numeric not null default 0,
  leads integer not null default 0,
  cpl numeric not null default 0,
  ctr numeric,
  frequency numeric,
  updated_at bigint not null,
  primary key (client, label, day)
);

create index if not exists sd_daily_client_day_idx on sd_daily (client, day desc);

-- RLS: enable + permissive allow-all policy + reload (the pattern that sticks on
-- this project; plain "disable" silently re-enables). Single-user app, no auth.
alter table sd_daily enable row level security;
drop policy if exists "allow all sd_daily" on sd_daily;
create policy "allow all sd_daily" on sd_daily for all using (true) with check (true);

notify pgrst, 'reload schema';
