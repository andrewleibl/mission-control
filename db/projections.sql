-- Projections: a tiny goals table.
-- The actual income/expense data is pulled from `transactions` + `recurring_rules`
-- (the same source Finances uses) — no projection-specific data is stored here.

create table if not exists projection_settings (
  -- 'default' = base monthly goal; or 'YYYY-MM' for a per-month override
  scope text primary key,
  monthly_net_goal numeric not null default 0,
  updated_at bigint not null
);

-- RLS pattern that works in this Supabase project (disable-RLS alone doesn't stick):
alter table projection_settings enable row level security;
drop policy if exists "anon_full_access" on projection_settings;
create policy "anon_full_access" on projection_settings for all to public using (true) with check (true);

notify pgrst, 'reload schema';
