-- Service Delivery: media-buyer-in-a-box.
-- Four linked libraries — angles, creatives, copy, tests — that roll up into
-- cross-client performance intelligence. Run this in the Supabase SQL editor.

-- ANGLES — the strategic concept (the unit cross-client learning rolls up to).
create table if not exists sd_angles (
  id text primary key,
  name text not null,
  niche text not null default '',
  description text not null default '',
  status text not null default 'active' check (status in ('active','testing','winner','retired')),
  notes text not null default '',
  created_at bigint not null
);

-- CREATIVES — ad assets (thumbnail + link, no file hosting in v1).
create table if not exists sd_creatives (
  id text primary key,
  name text not null,
  angle_id text references sd_angles(id) on delete set null,
  niche text not null default '',
  format text not null default 'image' check (format in ('image','video','carousel')),
  asset_url text not null default '',          -- link to the real asset (Meta/Drive)
  thumb_url text not null default '',          -- preview image
  rating integer not null default 0,           -- 0-5
  status text not null default 'idea' check (status in ('idea','testing','winner','fatigued','killed')),
  notes text not null default '',
  created_at bigint not null
);

-- COPY — hooks / primary text / headlines.
create table if not exists sd_copy (
  id text primary key,
  name text not null,
  kind text not null default 'primary' check (kind in ('hook','primary','headline')),
  body text not null default '',
  angle_id text references sd_angles(id) on delete set null,
  niche text not null default '',
  rating integer not null default 0,
  status text not null default 'idea' check (status in ('idea','testing','winner','killed')),
  notes text not null default '',
  created_at bigint not null
);

-- TESTS — the hub. Each row = a creative+copy run for a client; metrics roll up
-- to rate the creative, copy, and angle. Downstream (booked/closed) keeps CPL honest.
create table if not exists sd_tests (
  id text primary key,
  label text not null default '',              -- e.g. the Meta campaign name
  creative_id text references sd_creatives(id) on delete set null,
  copy_id text references sd_copy(id) on delete set null,
  angle_id text references sd_angles(id) on delete set null,
  niche text not null default '',
  client text not null default '',
  started_on text,                             -- YYYY-MM-DD
  ended_on text,
  spend numeric not null default 0,
  leads integer not null default 0,
  cpl numeric not null default 0,
  ctr numeric not null default 0,
  frequency numeric not null default 0,
  booked integer not null default 0,           -- downstream: calls booked
  closed integer not null default 0,           -- downstream: clients closed
  notes text not null default '',
  created_at bigint not null
);

create index if not exists sd_creatives_niche_idx on sd_creatives (niche, rating desc);
create index if not exists sd_copy_niche_idx on sd_copy (niche, rating desc);
create index if not exists sd_tests_angle_idx on sd_tests (angle_id, created_at desc);

-- RLS: enable + permissive policy (the pattern that actually allows anon writes;
-- plain "disable" has not stuck on new tables here). Then reload PostgREST.
do $$
declare t text;
begin
  foreach t in array array['sd_angles','sd_creatives','sd_copy','sd_tests'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_all', t);
    execute format('create policy %I on %I for all using (true) with check (true)', t || '_all', t);
  end loop;
end $$;

notify pgrst, 'reload schema';
