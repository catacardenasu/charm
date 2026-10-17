-- 004_plaza.sql
-- Plaza data: who's in my plaza, and which plazas I've unlocked.
-- Run once after 001–003. Safe to run again (it only replaces functions and
-- re-applies the location list).


-- ─── locations ──────────────────────────────────────────────────────────────
-- The real list, matching src/data/plazas.ts and the unlock counts in Figma.
-- Replaces the 'plaza' placeholder row from 001.

delete from public.locations where id = 'plaza';

insert into public.locations (id, name, unlock_at, sort) values
  ('plaza-of-the-americas', 'Plaza of the Americas',  0, 0),
  ('turlington',            'Turlington Plaza',      10, 1),
  ('lake-alice',            'Lake Alice',            25, 2),
  ('century-tower',         'Century Tower',         40, 3),
  ('the-swamp',             'The Swamp',             50, 4)
on conflict (id) do update
  set name = excluded.name, unlock_at = excluded.unlock_at, sort = excluded.sort;


-- ─── unique_people_met(user) ────────────────────────────────────────────────
-- How many different people this user has tapped in with (removed tap ins
-- don't count). Internal helper: tap_in() can reuse it for unlocks.

create or replace function public.unique_people_met(p_user text)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct case when t.user_a = p_user then t.user_b else t.user_a end)::int
  from public.tap_ins t
  where not t.removed
    and p_user in (t.user_a, t.user_b);
$$;

revoke execute on function public.unique_people_met(text) from public, anon, authenticated;


-- ─── my_plaza(location_id) ──────────────────────────────────────────────────
-- Everyone I've met, for the plaza scene. Empty if I'm logged out or haven't
-- unlocked that location. Everyone I've met shows up in every unlocked plaza.
--
-- streak_weeks: current weekly streak, 0 once a whole week was missed.
-- at_risk:      tapped in last week but not yet this week ("tap in by Sunday").
-- Weeks run Monday–Sunday, America/New_York.

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
      max(t.day) as last_met
    from public.tap_ins t
    cross join me
    where not t.removed
      and me.uid in (t.user_a, t.user_b)
    group by 1
  )
  select
    p.id,
    p.nickname,
    p.avatar,
    p.greeting,
    case when s.last_week >= wk.this_week - 7 then s.weeks else 0 end,
    coalesce(s.last_week = wk.this_week - 7, false),
    met.last_met
  from met
  cross join me
  cross join wk
  join public.profiles p on p.id = met.other
  left join public.pair_streaks s
    on s.user_a = least(me.uid, met.other)
   and s.user_b = greatest(me.uid, met.other)
  where exists (
    select 1 from public.locations l
    where l.id = p_location_id
      and l.unlock_at <= public.unique_people_met(me.uid)
  )
  order by met.last_met desc, p.nickname;
$$;

revoke execute on function public.my_plaza(text) from public, anon;
grant execute on function public.my_plaza(text) to authenticated;


-- ─── my_locations() ─────────────────────────────────────────────────────────
-- Every location with an unlocked flag, plus my unique-people count (the
-- "27/40" on locked plazas).
-- Returns { unique_people_met, locations: [{id, name, unlock_at, sort, unlocked}] }.

create or replace function public.my_locations()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with n as (
    select coalesce(public.unique_people_met(auth.jwt()->>'sub'), 0) as met
  )
  select jsonb_build_object(
    'unique_people_met', n.met,
    'locations', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'name', l.name,
          'unlock_at', l.unlock_at,
          'sort', l.sort,
          'unlocked', l.unlock_at <= n.met
        )
        order by l.sort
      ) filter (where l.id is not null),
      '[]'::jsonb
    )
  )
  from n
  left join public.locations l on true
  group by n.met;
$$;

revoke execute on function public.my_locations() from public, anon;
grant execute on function public.my_locations() to authenticated;
