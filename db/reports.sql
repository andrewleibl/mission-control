-- Client reports (weekly Lead Gen / Sales Campaign breakdowns).
-- Run in Supabase SQL editor.

create table if not exists reports (
  id text primary key,
  client_id text not null,
  event_id text,
  report_type text not null check (report_type in ('lead_gen','sales_campaign')),
  week_start date not null,
  week_end date not null,
  spend numeric,
  impressions integer,
  reach integer,
  clicks integer,
  ctr numeric,
  leads integer,
  cpl numeric,
  revenue numeric,
  roas numeric,
  purchases integer,
  cost_per_purchase numeric,
  last_week_summary text not null default '',
  next_week_outlook text not null default '',
  changes_being_made text not null default '',
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists reports_event_id_idx on reports (event_id);
create index if not exists reports_client_id_idx on reports (client_id);
create index if not exists reports_updated_idx on reports (updated_at desc);

-- Same pattern as other tables: permissive policy (single-user app, no auth layer).
-- See feedback-mission-control-supabase-rls: disable-RLS doesn't stick across pgrst reloads;
-- ship enable + permissive policy instead.
alter table reports enable row level security;
drop policy if exists "Allow all on reports" on reports;
create policy "Allow all on reports" on reports for all using (true) with check (true);

notify pgrst, 'reload schema';
