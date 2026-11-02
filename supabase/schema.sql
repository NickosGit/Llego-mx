-- ¿Llego? — schema, RLS and forecast function
-- Run once in Supabase SQL editor, then run seed.sql.
-- One row = one ride on Ruta 120, Walmart Las Alamedas -> Metro El Rosario.
-- By design there is NO column for unit, plate, driver, operator or location.

create table if not exists public.trips (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  day_type      text not null check (day_type in ('laborable','sabado','domingo')),
  depart_slot   time not null check (                       -- 15-min bucket the rider reached the stop
                  extract(minute from depart_slot)::int in (0,15,30,45)
                  and extract(second from depart_slot) = 0
                  and depart_slot between time '03:00' and time '11:45'),
  wait_min      int  not null check (wait_min between 0 and 180),   -- minutes in line / waiting
  ride_min      int  not null check (ride_min between 5 and 300),   -- minutes on board to El Rosario
  seated        boolean not null,                                    -- did the rider get a seat?
  is_simulated  boolean not null default false,
  created_at    timestamptz not null default now(),
  constraint owner_required check (is_simulated or user_id is not null)
);

create index if not exists trips_cell_idx on public.trips (day_type, depart_slot);

alter table public.trips enable row level security;

drop policy if exists "own rows: select" on public.trips;
drop policy if exists "own rows: insert" on public.trips;
drop policy if exists "own rows: delete" on public.trips;

create policy "own rows: select" on public.trips
  for select to authenticated using (user_id = auth.uid());

create policy "own rows: insert" on public.trips
  for insert to authenticated
  with check (user_id = auth.uid() and is_simulated = false);

create policy "own rows: delete" on public.trips
  for delete to authenticated using (user_id = auth.uid());

-- No update policy: a logged trip is deleted and re-logged, never edited.
-- No anon policy: anonymous clients cannot read trips at all.

-- Aggregates only, one cell = (day_type, slot).
-- Everything except n is null when n < 10 (sparse data misleads — Blueprint T4 risk).
create or replace function public.forecast_slot(p_day_type text, p_slot time)
returns table (
  n             int,
  seat_rate     numeric,   -- share of rides seated, 0..1, 1 decimal
  p50_wait      int,
  p50_ride      int,
  p90_total     int,       -- bad-day wait + ride, for the "llegas a tiempo" check
  has_simulated boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with cell as (
    select wait_min, ride_min, wait_min + ride_min as total, seated, is_simulated
    from public.trips
    where day_type = p_day_type and depart_slot = p_slot
  ), agg as (
    select
      count(*)::int as n,
      round(avg(case when seated then 1 else 0 end), 1) as seat_rate,
      round(percentile_cont(0.5) within group (order by wait_min))::int as p50_wait,
      round(percentile_cont(0.5) within group (order by ride_min))::int as p50_ride,
      round(percentile_cont(0.9) within group (order by total))::int    as p90_total,
      coalesce(bool_or(is_simulated), false) as has_simulated
    from cell
  )
  select n,
         case when n >= 10 then seat_rate end,
         case when n >= 10 then p50_wait end,
         case when n >= 10 then p50_ride end,
         case when n >= 10 then p90_total end,
         has_simulated
  from agg;
$$;

revoke all on function public.forecast_slot(text, time) from public;
grant execute on function public.forecast_slot(text, time) to anon, authenticated;
