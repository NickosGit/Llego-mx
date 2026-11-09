-- ¿Llego? — Week 13: first-party, anonymous event log.
-- Run once in the Supabase SQL editor of project llego-mx (ref ftfjqdjsthsakqqmjivk) ONLY.
-- Never on the shared Supabase project.
--
-- One row = one home view or one logged ride. By design there is NO user_id, email,
-- name, phone, IP, user agent or location column, and nothing joins to auth.users.
-- visitor_id is a random UUID from an httpOnly cookie (llego_vid).

create table if not exists public.events (
  id          bigint generated always as identity primary key,
  visitor_id  uuid not null,
  tester      text check (tester ~ '^u[1-9]$'),
  name        text not null check (name in ('view','ride_logged')),
  day_type    text check (day_type in ('laborable','sabado','domingo')),
  slot        time,
  limit_min   int  check (limit_min in (0,15,30,45,60)),
  state       text check (state in ('sin_dato','ya_sentado','sin_margen','sugerencia','sin_sugerencia')),
  created_at  timestamptz not null default now()
);
alter table public.events enable row level security;
-- No policies on purpose: nobody reads, updates or deletes through the API.

create or replace function public.log_event(
  p_visitor_id uuid, p_tester text, p_name text,
  p_day_type text, p_slot time, p_limit_min int, p_state text
) returns void
language sql security definer set search_path = public as $$
  insert into public.events (visitor_id, tester, name, day_type, slot, limit_min, state)
  values (p_visitor_id, p_tester, p_name, p_day_type, p_slot, p_limit_min, p_state);
$$;
revoke all on function public.log_event from public;
grant execute on function public.log_event to anon, authenticated;
