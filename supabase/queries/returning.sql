-- ¿Llego? — who came back? Run in the Supabase SQL editor (project llego-mx).
-- Days are counted in Mexico City time. Rows hold no names, accounts or locations.

-- 1. Per tester tag (?t=u1 … u9)
select
  tester,
  min(created_at at time zone 'America/Mexico_City')                         as first_seen,
  max(created_at at time zone 'America/Mexico_City')                         as last_seen,
  count(distinct (created_at at time zone 'America/Mexico_City')::date)      as distinct_days,
  count(*) filter (where name = 'view')                                      as views,
  array_agg(distinct limit_min order by limit_min)
    filter (where limit_min is not null)                                     as limits_chosen
from public.events
where tester is not null
group by tester
order by tester;

-- 2. Per visitor, only those seen on 2+ distinct days (came back on their own)
select
  visitor_id,
  array_agg(distinct tester) filter (where tester is not null)               as tester_tags,
  min(created_at at time zone 'America/Mexico_City')                         as first_seen,
  max(created_at at time zone 'America/Mexico_City')                         as last_seen,
  count(distinct (created_at at time zone 'America/Mexico_City')::date)      as distinct_days,
  count(*) filter (where name = 'view')                                      as views,
  array_agg(distinct limit_min order by limit_min)
    filter (where limit_min is not null)                                     as limits_chosen
from public.events
group by visitor_id
having count(distinct (created_at at time zone 'America/Mexico_City')::date) >= 2
order by distinct_days desc, last_seen desc;

-- 3. Rides logged per day
select
  (created_at at time zone 'America/Mexico_City')::date as day,
  count(*)                                              as rides_logged
from public.events
where name = 'ride_logged'
group by 1
order by 1;
