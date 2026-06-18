-- Meta ad-account mapping for the live API sync. Run in the Supabase SQL editor.
-- Each row maps a client to one Meta ad account (act_XXXXXXXXX). The sync pulls
-- each active account's campaign insights and writes them into sd_tests.
create table if not exists sd_accounts (
  id text primary key,
  client text not null default '',
  ad_account_id text not null default '',   -- format: act_1234567890
  active boolean not null default true,
  created_at bigint not null
);

alter table sd_accounts enable row level security;
drop policy if exists sd_accounts_all on sd_accounts;
create policy sd_accounts_all on sd_accounts for all using (true) with check (true);

notify pgrst, 'reload schema';
