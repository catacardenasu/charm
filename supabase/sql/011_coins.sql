-- 011_coins.sql
-- Coins: a separate currency for the shop. Points now only rank you on the
-- leaderboard; coins are what you spend on costumes.
-- Run after 001–010. Safe to run more than once.
--
--   1. profiles.coins (backfilled from points the first time) and
--      tap_ins.coins_awarded.
--   2. tap_in(code): flat awards. First meeting = 20 points + 10 coins,
--      every later tap in (max one per day) = 10 points + 5 coins. No streak bonus.
--   3. buy_cosmetic(cosmetic_id): spends coins, never points.
--   4. remove_tap_in(tap_in_id): also takes back the coins it gave.
--   5. Demo seed: coins for the demo accounts from 009.


-- ─── 1. Columns ─────────────────────────────────────────────────────────────

-- Clients can't write coins: 001 revokes table-wide insert/update on profiles
-- and only grants the editable profile columns, the same as points. Coins only
-- change through the security definer functions below.
--
-- The backfill runs only when the column is first added, so re-running this
-- file never refills someone who has spent down to 0 coins.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'coins'
  ) then
    alter table public.profiles add column coins int not null default 0;
    update public.profiles set coins = points where coins = 0;
  end if;
end;
$$;

-- Coins each tap in awarded (same for both people), so review can take them back.
alter table public.tap_ins add column if not exists coins_awarded int not null default 0;


-- ─── 2. tap_in(code) ────────────────────────────────────────────────────────
-- Same as 005 except step 4 (flat points and coins) and coins_earned in the result.

create or replace function public.tap_in(code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  -- ─── Awards: tune here ─────────────────────────────────────────────────────
  c_first_meeting_points constant int := 20;  -- the first time a pair ever taps in
  c_first_meeting_coins  constant int := 10;
  c_repeat_points        constant int := 10;  -- every later tap in (max one per day)
  c_repeat_coins         constant int := 5;
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
  v_coins         int;
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
      'coins_earned', 0,
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

  -- 4. Points and coins for both people (flat; streaks don't change them).
  v_points := case when first_meeting then c_first_meeting_points else c_repeat_points end;
  v_coins  := case when first_meeting then c_first_meeting_coins  else c_repeat_coins  end;

  update public.profiles
  set points = points + v_points,
      coins  = coins + v_coins
  where id in (me, other_id);

  update public.tap_ins
  set points_awarded = v_points,
      coins_awarded  = v_coins
  where id = v_tap_in_id;

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

  -- 7. TapInResult. `other` is read after the update so it's current.
  select to_jsonb(o) into v_other from public.profiles o where o.id = other_id;

  return jsonb_build_object(
    'status', 'ok',
    'tap_in_id', v_tap_in_id,
    'other', v_other,
    'shared_interests', to_jsonb(v_shared),
    'streak_weeks', v_weeks,
    'points_earned', v_points,
    'coins_earned', v_coins,
    'newly_unlocked', v_unlocked
  );
end;
$$;

revoke execute on function public.tap_in(text) from public, anon;
grant execute on function public.tap_in(text) to authenticated;


-- ─── 3. buy_cosmetic(cosmetic_id) ───────────────────────────────────────────
-- Spends my coins on a cosmetic (points are never touched). Returns
-- {status, coins} with my coins after.
-- status: bought | already_owned (also for free items) | not_enough_coins | not_found

create or replace function public.buy_cosmetic(p_cosmetic_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me      text := auth.jwt()->>'sub';
  c       public.cosmetics;
  v_coins int;
begin
  if me is null then
    raise exception 'buy_cosmetic: not logged in';
  end if;

  -- Lock my row so two quick taps can't spend the same coins twice.
  select p.coins into v_coins from public.profiles p where p.id = me for update;
  if not found then
    raise exception 'buy_cosmetic: you need a profile first';
  end if;

  select * into c from public.cosmetics where id = p_cosmetic_id;
  if not found then
    return jsonb_build_object('status', 'not_found', 'coins', v_coins);
  end if;

  if c.price = 0 or exists (
    select 1 from public.owned_cosmetics o
    where o.user_id = me and o.cosmetic_id = c.id
  ) then
    return jsonb_build_object('status', 'already_owned', 'coins', v_coins);
  end if;

  if v_coins < c.price then
    return jsonb_build_object('status', 'not_enough_coins', 'coins', v_coins);
  end if;

  update public.profiles p
  set coins = p.coins - c.price
  where p.id = me
  returning p.coins into v_coins;

  insert into public.owned_cosmetics (user_id, cosmetic_id) values (me, c.id);

  return jsonb_build_object('status', 'bought', 'coins', v_coins);
end;
$$;

revoke execute on function public.buy_cosmetic(text) from public, anon;
grant execute on function public.buy_cosmetic(text) to authenticated;


-- ─── 4. remove_tap_in(tap_in_id) ────────────────────────────────────────────
-- Same as 008, but also takes back the coins the tap in gave both of us
-- (never below 0, in case they were already spent).
-- Returns {status, points} with my points after.
-- status: removed | already_removed | not_found (also when I'm not in it)

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
  set points = greatest(p.points - t.points_awarded, 0),
      coins  = greatest(p.coins - t.coins_awarded, 0)
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


-- ─── 5. Demo seed ───────────────────────────────────────────────────────────
-- Coins for the 009 demo accounts, and their tap ins' awards on the new flat
-- scale so removing one in review takes back the right amounts. Only touches
-- 'demo|' rows. Re-running 009 wipes these; run this file again afterwards.

update public.profiles set coins = 250 where id = 'demo|charm';

-- Friends: half their points, so the leaderboard and the shop don't mirror each other.
update public.profiles set coins = points / 2 where left(id, 13) = 'demo|friend-';

-- Each pair's earliest tap in was the first meeting; the rest are repeats.
update public.tap_ins t
set points_awarded = case when t.day = f.first_day then 20 else 10 end,
    coins_awarded  = case when t.day = f.first_day then 10 else 5 end
from (
  select user_a, user_b, min(day) as first_day
  from public.tap_ins
  where left(user_a, 5) = 'demo|' and left(user_b, 5) = 'demo|'
  group by user_a, user_b
) f
where t.user_a = f.user_a
  and t.user_b = f.user_b
  and not t.removed;

-- Check it: expect Demo Gator with 250 coins.
select id, nickname, points, coins from public.profiles where id = 'demo|charm';
