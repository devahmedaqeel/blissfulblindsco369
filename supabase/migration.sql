-- Blissful Blinds — real-time lead notification system
-- Run this once in the Supabase project's SQL Editor (Dashboard -> SQL
-- Editor -> New query -> paste -> Run). Safe to re-run: every statement
-- is idempotent (IF NOT EXISTS / OR REPLACE / drop-then-create policy).

-- ---------------------------------------------------------------------
-- Admins allow-list
-- ---------------------------------------------------------------------
-- Every RLS policy below checks against this table instead of a
-- hardcoded email, so adding a second admin later is just an INSERT,
-- not an SQL/RLS change. Add the email you'll create as a Supabase Auth
-- user (Authentication -> Users -> Add user) — see supabase/SETUP.md.
create table if not exists public.admins (
  email text primary key
);

-- Replace with the real admin login email if different, then re-run
-- just this line (ON CONFLICT makes it a no-op if already present).
insert into public.admins (email) values ('info@blissfulblindsltd.co.uk')
  on conflict (email) do nothing;

-- ---------------------------------------------------------------------
-- Enquiries — every form submission on the site lands here
-- ---------------------------------------------------------------------
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,
  source_label text not null,
  name text not null,
  email text not null,
  phone text,
  address text,
  postcode text,
  service text,
  preferred_color text,
  appointment text,
  hear_about_us text,
  message text,
  product_interest text,
  ip text,
  user_agent text,
  page_url text,
  referrer text,
  status text not null default 'unread' check (status in ('unread', 'read')),
  email_delivered boolean not null default false
);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);

alter table public.enquiries enable row level security;

drop policy if exists "Admins can read enquiries" on public.enquiries;
create policy "Admins can read enquiries" on public.enquiries
  for select
  to authenticated
  using (auth.jwt() ->> 'email' in (select email from public.admins));

drop policy if exists "Admins can update enquiries" on public.enquiries;
create policy "Admins can update enquiries" on public.enquiries
  for update
  to authenticated
  using (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));

-- No insert/delete policy for anon/authenticated: the API writes
-- enquiries using the service_role key, which bypasses RLS entirely by
-- design — the public site never talks to Supabase directly.

-- Turns on Postgres logical replication for this table so the admin
-- dashboard's Realtime subscription actually receives INSERT/UPDATE
-- events. Errors harmlessly if already added on a re-run.
do $$
begin
  alter publication supabase_realtime add table public.enquiries;
exception when duplicate_object then
  null;
end $$;

-- ---------------------------------------------------------------------
-- Push subscriptions — browser Web Push endpoints for the admin dashboard
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  admin_email text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Admins manage their own subscriptions" on public.push_subscriptions;
create policy "Admins manage their own subscriptions" on public.push_subscriptions
  for all
  to authenticated
  using (auth.jwt() ->> 'email' = admin_email and auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' = admin_email and auth.jwt() ->> 'email' in (select email from public.admins));

-- ---------------------------------------------------------------------
-- Rate limiting — persisted so it survives serverless cold starts
-- (an in-memory Map resets on every fresh Vercel instance)
-- ---------------------------------------------------------------------
create table if not exists public.rate_limits (
  ip text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 1
);

alter table public.rate_limits enable row level security;
-- No policies = no anon/authenticated access at all; only the
-- service_role key (server-side) can touch this table.

-- Atomically increments the counter for an IP, resetting it if the
-- window has expired, and reports whether this request should be
-- blocked. Single round trip, race-safe under concurrent requests.
create or replace function public.check_rate_limit(
  p_ip text,
  p_window_seconds int,
  p_max_count int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.rate_limits (ip, window_start, count)
  values (p_ip, now(), 1)
  on conflict (ip) do update set
    count = case
      when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limits.count + 1
    end,
    window_start = case
      when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else public.rate_limits.window_start
    end
  returning count into v_count;

  return v_count > p_max_count;
end;
$$;
