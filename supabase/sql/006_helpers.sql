-- 006_helpers.sql
-- Streak list, avatar detail and lost keychain.
-- Run after 001–005. Safe to run more than once (it only replaces functions).
-- Weeks run Monday–Sunday, America/New_York. Removed tap ins don't count.


-- ─── my_streaks() ───────────────────────────────────────────────────────────
-- Everyone I have a pair streak with, for /streaks. Most weeks first, at-risk
-- streaks before safe ones with the same length.
--
-- weeks:   current weekly streak, 0 once a whole week was missed.
-- at_risk: tapped in last week but not yet this week ("tap in by Sunday").

create or replace function public.my_streaks()
returns table (
  id        text,
  nickname  text,
  avatar    jsonb,
  weeks     int,
  last_week date,
  last_day  date,
  first_met date,
  at_risk   boolean
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
  )
  select
    p.id,
    p.nickname,
    p.avatar,
    case when s.last_week >= wk.this_week - 7 then s.weeks else 0 end,
    s.last_week,
    s.last_day,
    s.first_met,
    s.last_week = wk.this_week - 7
  from public.pair_streaks s
  cross join me
  cross join wk
  join public.profiles p
    on p.id = case when s.user_a = me.uid then s.user_b else s.user_a end
  where me.uid in (s.user_a, s.user_b)
    and exists (
      select 1 from public.tap_ins t
      where t.user_a = s.user_a
        and t.user_b = s.user_b
        and not t.removed
    )
  order by 4 desc, 8 desc, s.last_day desc, p.nickname;
$$;

revoke execute on function public.my_streaks() from public, anon;
grant execute on function public.my_streaks() to authenticated;


-- ─── person_detail(user_id) ─────────────────────────────────────────────────
-- Avatar detail (/u/:userId). Null unless I've met this person.
-- Returns {
--   profile: {id, nickname, avatar, greeting, interests, major, year},
--   shared_interests, weeks, first_met, last_day, last_prompt
-- }

create or replace function public.person_detail(p_user_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me         text := auth.jwt()->>'sub';
  this_week  date := date_trunc('week', (now() at time zone 'America/New_York')::date)::date;
  pair_a     text := least(auth.jwt()->>'sub', p_user_id);
  pair_b     text := greatest(auth.jwt()->>'sub', p_user_id);
  my_profile public.profiles;
  them       public.profiles;
  s          public.pair_streaks;
  v_prompt   text;
  v_shared   text[];
begin
  if me is null or p_user_id = me then
    return null;
  end if;

  if not exists (
    select 1 from public.tap_ins t
    where t.user_a = pair_a and t.user_b = pair_b and not t.removed
  ) then
    return null;
  end if;

  select * into them from public.profiles where id = p_user_id;
  if not found then
    return null;
  end if;

  select * into my_profile from public.profiles where id = me;
  select * into s from public.pair_streaks ps where ps.user_a = pair_a and ps.user_b = pair_b;

  select t.prompt into v_prompt
  from public.tap_ins t
  where t.user_a = pair_a
    and t.user_b = pair_b
    and not t.removed
    and t.prompt is not null
  order by t.created_at desc
  limit 1;

  v_shared := array(
    select distinct mine.i
    from unnest(coalesce(my_profile.interests, '{}')) as mine(i)
    join unnest(them.interests) as theirs(i)
      on lower(trim(mine.i)) = lower(trim(theirs.i))
    order by mine.i
  );

  return jsonb_build_object(
    'profile', jsonb_build_object(
      'id', them.id,
      'nickname', them.nickname,
      'avatar', them.avatar,
      'greeting', them.greeting,
      'interests', them.interests,
      'major', them.major,
      'year', them.year
    ),
    'shared_interests', to_jsonb(v_shared),
    'weeks', case when s.last_week >= this_week - 7 then s.weeks else 0 end,
    'first_met', s.first_met,
    'last_day', s.last_day,
    'last_prompt', v_prompt
  );
end;
$$;

revoke execute on function public.person_detail(text) from public, anon;
grant execute on function public.person_detail(text) to authenticated;


-- ─── deactivate_my_keychain(code) ───────────────────────────────────────────
-- Lost keychain (/settings). Only the owner can deactivate it; afterwards they
-- can claim a new one through /k/:code.
-- status: deactivated | already_inactive | not_yours (also when the code doesn't exist)

create or replace function public.deactivate_my_keychain(p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me text := auth.jwt()->>'sub';
  k  public.keychains;
begin
  if me is null then
    raise exception 'deactivate_my_keychain: not logged in';
  end if;

  select * into k from public.keychains where code = p_code for update;

  if not found or k.owner_id is distinct from me then
    return jsonb_build_object('status', 'not_yours');
  end if;
  if not k.active then
    return jsonb_build_object('status', 'already_inactive');
  end if;

  update public.keychains set active = false where code = p_code;

  return jsonb_build_object('status', 'deactivated');
end;
$$;

revoke execute on function public.deactivate_my_keychain(text) from public, anon;
grant execute on function public.deactivate_my_keychain(text) to authenticated;
