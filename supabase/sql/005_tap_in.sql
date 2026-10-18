-- 005_tap_in.sql
-- tap_in(code): what happens when I tap someone else's keychain.
-- Run after 001–004. Safe to run more than once.
--
-- Follows "Game rules" in CLAUDE.md, in one transaction:
--   1. I must be logged in with a profile; the keychain must exist, be active,
--      be owned, and not be mine.
--   2. Save the tap in (ordered pair, today in America/New_York). Once per pair
--      per day: a second tap today returns status 'already_today' and awards nothing.
--   3. Update the pair's weekly streak (weeks run Monday–Sunday).
--   4. Award points to both people.
--   5. Report plazas I just unlocked by meeting someone new.
--   6. Notify the keychain owner (Realtime picks this up).
--   7. Return a TapInResult (src/types.ts).


-- Points each tap in awarded (same for both people), so removing a tap in in
-- review can take them back.
alter table public.tap_ins add column if not exists points_awarded int not null default 0;


create or replace function public.tap_in(code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  -- ─── Points: tune here ─────────────────────────────────────────────────────
  c_first_meeting_points constant int := 50;  -- the first time a pair ever taps in
  c_base_points          constant int := 10;  -- every later tap in (max one per day) …
  c_points_per_week      constant int := 5;   -- … plus this per streak week after the first
  c_max_points           constant int := 50;  -- … capped here
  -- ───────────────────────────────────────────────────────────────────────────

  v_code      text := tap_in.code;
  me          text := auth.jwt()->>'sub';
  today       date := (now() at time zone 'America/New_York')::date;
  this_week   date := date_trunc('week', (now() at time zone 'America/New_York')::date)::date;

  k           public.keychains;
  my_profile  public.profiles;
  other_id    text;
  pair_a      text;
  pair_b      text;

  v_tap_in_id     uuid;
  first_meeting   boolean;
  v_weeks         int;
  v_points        int;
  met_before      int;
  met_after       int;
  v_shared        text[];
  v_unlocked      jsonb;
  v_other         jsonb;
begin
  -- 1. Who's tapping, and whose keychain is it?
  if me is null then
    raise exception 'tap_in: not logged in';
  end if;

  select * into my_profile from public.profiles where id = me;
  if not found then
    raise exception 'tap_in: you need a profile before tapping in';
  end if;

  select * into k from public.keychains where code = v_code;
  if not found then
    raise exception 'tap_in: keychain not found';
  end if;
  if not k.active then
    raise exception 'tap_in: this keychain was deactivated';
  end if;
  if k.owner_id is null then
    raise exception 'tap_in: this keychain is not claimed yet';
  end if;
  if k.owner_id = me then
    raise exception 'tap_in: you can''t tap in with your own keychain';
  end if;

  other_id := k.owner_id;
  pair_a   := least(me, other_id);
  pair_b   := greatest(me, other_id);

  -- Before this tap in, for unlocks and the first-meeting bonus.
  met_before := public.unique_people_met(me);
  first_meeting := not exists (
    select 1 from public.tap_ins t
    where t.user_a = pair_a and t.user_b = pair_b and not t.removed
  );

  v_shared := array(
    select distinct mine.i
    from unnest(my_profile.interests) as mine(i)
    join public.profiles o on o.id = other_id
    cross join lateral unnest(o.interests) as theirs(i)
    where lower(trim(mine.i)) = lower(trim(theirs.i))
    order by mine.i
  );

  -- 2. Save the tap in. The unique (user_a, user_b, day) constraint is the
  --    once-a-day rule.
  insert into public.tap_ins (user_a, user_b, scanner_id, keychain_code, day)
  values (pair_a, pair_b, me, v_code, today)
  on conflict (user_a, user_b, day) do nothing
  returning id into v_tap_in_id;

  if v_tap_in_id is null then
    -- Already tapped in today: return today's tap in, award nothing.
    select t.id into v_tap_in_id
    from public.tap_ins t
    where t.user_a = pair_a and t.user_b = pair_b and t.day = today;

    select case when s.last_week >= this_week - 7 then s.weeks else 0 end
    into v_weeks
    from public.pair_streaks s
    where s.user_a = pair_a and s.user_b = pair_b;

    select to_jsonb(o) into v_other from public.profiles o where o.id = other_id;

    return jsonb_build_object(
      'status', 'already_today',
      'tap_in_id', v_tap_in_id,
      'other', v_other,
      'shared_interests', to_jsonb(v_shared),
      'streak_weeks', coalesce(v_weeks, 0),
      'points_earned', 0,
      'newly_unlocked', '[]'::jsonb
    );
  end if;

  -- 3. Weekly streak: same week → unchanged; the week right after → +1;
  --    otherwise (or a first meeting) → 1.
  insert into public.pair_streaks as s (user_a, user_b, weeks, last_week, last_day, first_met)
  values (pair_a, pair_b, 1, this_week, today, today)
  on conflict (user_a, user_b) do update
  set weeks = case
                when first_meeting then 1
                when s.last_week = this_week then s.weeks
                when s.last_week = this_week - 7 then s.weeks + 1
                else 1
              end,
      last_week = this_week,
      last_day  = today,
      first_met = case when first_meeting then today else s.first_met end
  returning s.weeks into v_weeks;

  -- 4. Points for both people.
  v_points := case
                when first_meeting then c_first_meeting_points
                else least(c_base_points + c_points_per_week * (v_weeks - 1), c_max_points)
              end;

  update public.profiles set points = points + v_points where id in (me, other_id);
  update public.tap_ins set points_awarded = v_points where id = v_tap_in_id;

  -- 5. Plazas I just unlocked (only meeting someone new raises the count).
  met_after := public.unique_people_met(me);

  select coalesce(
           jsonb_agg(
             jsonb_build_object('id', l.id, 'name', l.name, 'unlock_at', l.unlock_at, 'sort', l.sort)
             order by l.sort
           ),
           '[]'::jsonb
         )
  into v_unlocked
  from public.locations l
  where l.unlock_at > met_before
    and l.unlock_at <= met_after;

  -- 6. Tell the keychain owner (TapInNotificationPayload).
  insert into public.notifications (user_id, type, payload)
  values (
    other_id,
    'tap_in',
    jsonb_build_object('tap_in_id', v_tap_in_id, 'from_id', me, 'from_nickname', my_profile.nickname)
  );

  -- 7. TapInResult. `other` is read after the points update so it's current.
  select to_jsonb(o) into v_other from public.profiles o where o.id = other_id;

  return jsonb_build_object(
    'status', 'ok',
    'tap_in_id', v_tap_in_id,
    'other', v_other,
    'shared_interests', to_jsonb(v_shared),
    'streak_weeks', v_weeks,
    'points_earned', v_points,
    'newly_unlocked', v_unlocked
  );
end;
$$;

revoke execute on function public.tap_in(text) from public, anon;
grant execute on function public.tap_in(text) to authenticated;
