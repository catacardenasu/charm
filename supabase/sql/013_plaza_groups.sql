-- 013_plaza_groups.sql
-- Each plaza holds its own group of people, in the order you met them.
-- Run after 001–012. Safe to run more than once (it only replaces my_plaza).
--
-- With the plazas from 004 (unlock at 0, 10, 25, 40, 50 people):
--   people  1–10 → Plaza of the Americas
--   people 11–25 → Turlington Plaza
--   people 26–40 → Lake Alice
--   people 41–50 → Century Tower
--   people 51+   → The Swamp (the last plaza keeps everyone after that)
-- i.e. your Nth person goes to the last plaza whose unlock_at is below N. So
-- the people who unlock a plaza stay in the one before it, and a new plaza
-- starts empty and fills with the people you meet next.
--
-- "Order you met them" = your first tap in with each person that wasn't
-- removed. Removing someone's only tap in moves everyone after them up one.
--
-- Replaces my_plaza from 004 with the same arguments and columns, so the app
-- (usePlaza) doesn't change. Locked plazas still return nobody.

create or replace function public.my_plaza(p_location_id text)
returns table (
  id           text,
  nickname     text,
  avatar       jsonb,
  greeting     text,
  streak_weeks int,
  at_risk      boolean,
  last_met     date
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select auth.jwt()->>'sub' as uid
  ),
  wk as (
    select date_trunc('week', (now() at time zone 'America/New_York')::date)::date as this_week
  ),
  met as (
    select
      case when t.user_a = me.uid then t.user_b else t.user_a end as other,
      min(t.created_at) as first_at,
      max(t.day) as last_met
    from public.tap_ins t
    cross join me
    where not t.removed
      and me.uid in (t.user_a, t.user_b)
    group by 1
  ),
  ranked as (
    select met.*, row_number() over (order by met.first_at, met.other) as n
    from met
  ),
  placed as (
    select
      ranked.*,
      (
        select l.id from public.locations l
        where l.unlock_at < ranked.n
        order by l.unlock_at desc, l.sort desc
        limit 1
      ) as location_id
    from ranked
  )
  select
    p.id,
    p.nickname,
    p.avatar,
    p.greeting,
    case when s.last_week >= wk.this_week - 7 then s.weeks else 0 end,
    coalesce(s.last_week = wk.this_week - 7, false),
    placed.last_met
  from placed
  cross join me
  cross join wk
  join public.profiles p on p.id = placed.other
  left join public.pair_streaks s
    on s.user_a = least(me.uid, placed.other)
   and s.user_b = greatest(me.uid, placed.other)
  where placed.location_id = p_location_id
    and exists (
      select 1 from public.locations l
      where l.id = p_location_id
        and l.unlock_at <= public.unique_people_met(me.uid)
    )
  order by placed.last_met desc, p.nickname;
$$;

revoke execute on function public.my_plaza(text) from public, anon;
grant execute on function public.my_plaza(text) to authenticated;
