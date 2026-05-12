-- SMS tracking: templates, daily send counts, win events.
-- Run this in Supabase SQL editor.

create table if not exists sms_templates (
  id text primary key,
  label text not null,
  body text not null,
  status text not null default 'active' check (status in ('active','paused','killed')),
  created_at bigint not null
);

create table if not exists sms_sends (
  template_id text not null references sms_templates(id) on delete cascade,
  day date not null,
  count integer not null default 0,
  primary key (template_id, day)
);

create table if not exists sms_wins (
  id text primary key,
  template_id text not null references sms_templates(id) on delete cascade,
  type text not null check (type in ('positive_reply','booked_meeting')),
  note text,
  logged_at bigint not null
);

create index if not exists sms_wins_template_logged_idx on sms_wins (template_id, logged_at desc);
create index if not exists sms_sends_day_idx on sms_sends (day desc);
