-- SMS follow-up pipeline: positive-reply prospects worked through a 3-day cadence.
-- Run this in the Supabase SQL editor.

create table if not exists sms_prospects (
  id text primary key,
  company text not null default '',
  phone text not null default '',
  source_template_id text references sms_templates(id) on delete set null,
  stage text not null default 'following_up' check (stage in ('following_up','booked','lost')),
  day integer not null default 1,            -- which follow-up day (1-3)
  last_action_at bigint,                     -- last time a call/text was done
  notes text,
  created_at bigint not null,
  booked_at bigint,
  lost_at bigint
);

create index if not exists sms_prospects_stage_idx on sms_prospects (stage, created_at desc);

-- Match existing-table pattern: RLS off (single-user app, no auth layer).
alter table sms_prospects disable row level security;
