-- Sales Tracking: logged prospect calls (show rate, qualification, outcome, deal value).
-- Run this in the Supabase SQL editor.

create table if not exists sales_calls (
  id text primary key,
  created_at bigint not null,
  date date not null,
  call_time text,
  name text not null default '',
  business text not null default '',
  service text,
  source text not null default 'other',
  showed boolean not null default false,
  qualified boolean not null default false,
  outcome text not null default 'pending',
  value numeric,
  notes text
);

create index if not exists sales_calls_date_idx on sales_calls (date desc);
create index if not exists sales_calls_created_idx on sales_calls (created_at desc);

-- RLS: this project does NOT reliably honor "disable row level security" (it
-- silently re-enables), so we ENABLE it with a permissive allow-all policy and
-- reload PostgREST — the pattern that actually sticks here. Single-user app, no
-- auth layer, so allow-all is intentional.
alter table sales_calls enable row level security;
drop policy if exists "allow all sales_calls" on sales_calls;
create policy "allow all sales_calls" on sales_calls for all using (true) with check (true);

notify pgrst, 'reload schema';
