-- 008_review.sql
-- Tap in review (/review): see recent tap ins and remove ones you don't want.
-- Run after 001–007. Safe to run more than once (it only replaces functions).
-- Days and weeks use America/New_York; weeks run Monday–Sunday.


-- ─── my_recent_tap_ins() ────────────────────────────────────────────────────
-- My tap ins from the last 7 days (today and the 6 days before), newest
-- first. Removed ones are left out.
-- scanned_by_me: true if I tapped their keychain, false if they tapped mine.

create or replace function public.my_recent_tap_ins()
returns table (
  id             uuid,
  other_id       text,
  nickname       text,
  avatar         jsonb,
  scanner_id     text,
  scanned_by_me  boolean,
  day            date,
  points_awarded int,
  created_at     timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select auth.jwt()->>'sub' as uid
  )
  select
    t.id,
    p.id,
    p.nickname,
    p.avatar,
    t.scanner_id,
    t.scanner_id = me.uid,
    t.day,
    t.points_awarded,
    t.created_at
  from public.tap_ins t
  cross join me
  join public.profiles p
    on p.id = case when t.user_a = me.uid then t.user_b else t.user_a end
  where me.uid in (t.user_a, t.user_b)
    and not t.removed
    and t.day >= (now() at time zone 'America/New_York')::date - 6
  order by t.created_at desc;
$$;

revoke execute on function public.my_recent_tap_ins() from public, anon;
grant execute on function public.my_recent_tap_ins() to authenticated;


-- ─── remove_tap_in(tap_in_id) ───────────────────────────────────────────────
-- Removes a tap in I'm part of: marks it removed, takes back the points it
-- gave both of us (never below 0, in case they were already spent), and
-- recomputes our streak from the tap ins that are left.
-- Returns {status, points} with my points after.
-- status: removed | already_removed | not_found (also when I'm not in it)
--
-- The removed row still holds that day's slot, so the pair can't tap in
-- again until tomorrow.

create or replace function public.remove_tap_in(p_tap_in_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me       text := auth.jwt()->>'sub';
  t        public.tap_ins;
  v_points int;
  v_weeks  int;
  v_last_week date;
  v_last_day  date;
  v_first_met date;
begin
  if me is null then
    raise exception 'remove_tap_in: not logged in';
  end if;

  select * into t from public.tap_ins ti where ti.id = p_tap_in_id for update;

  if not found or me not in (t.user_a, t.user_b) then
    return jsonb_build_object('status', 'not_found');
  end if;

  if t.removed then
    select p.points into v_points from public.profiles p where p.id = me;
    return jsonb_build_object('status', 'already_removed', 'points', v_points);
  end if;

  update public.tap_ins ti set removed = true where ti.id = t.id;

  update public.profiles p
  set points = greatest(p.points - t.points_awarded, 0)
  where p.id in (t.user_a, t.user_b);

  -- Recompute the streak from the pair's remaining tap ins: the streak is the
  -- run of back-to-back weeks ending at the latest week they tapped in.
  select max(r.day), min(r.day)
  into v_last_day, v_first_met
  from public.tap_ins r
  where r.user_a = t.user_a and r.user_b = t.user_b and not r.removed;

  if v_last_day is null then
    -- Nothing left: they've effectively never met.
    delete from public.pair_streaks s where s.user_a = t.user_a and s.user_b = t.user_b;
  else
    with weeks as (
      select distinct date_trunc('week', r.day)::date as wk
      from public.tap_ins r
      where r.user_a = t.user_a and r.user_b = t.user_b and not r.removed
    ),
    runs as (
      -- Back-to-back weeks share the same grp (gaps-and-islands).
      select wk, wk - (row_number() over (order by wk) * 7)::int as grp
      from weeks
    )
    select count(*)::int, max(wk)
    into v_weeks, v_last_week
    from runs
    where grp = (select grp from runs order by wk desc limit 1);

    update public.pair_streaks s
    set weeks = v_weeks,
        last_week = v_last_week,
        last_day = v_last_day,
        first_met = v_first_met
    where s.user_a = t.user_a and s.user_b = t.user_b;
  end if;

  select p.points into v_points from public.profiles p where p.id = me;

  return jsonb_build_object('status', 'removed', 'points', v_points);
end;
$$;

revoke execute on function public.remove_tap_in(uuid) from public, anon;
grant execute on function public.remove_tap_in(uuid) to authenticated;
