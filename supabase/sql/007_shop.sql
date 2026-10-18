-- 007_shop.sql
-- Costume shop: the cosmetics list, buying with points, and equipping.
-- Run after 001–006. Safe to run more than once (it re-applies the list and
-- replaces functions).
--
-- A cosmetic's id is its sprite file name, the same value Avatar.tsx reads from
-- profiles.avatar: equipping 'gator' sets avatar.hat = 'gator', which draws
-- /sprites/avatar/hat/gator.png. Price 0 = free for everyone, no purchase needed.


-- ─── cosmetics ──────────────────────────────────────────────────────────────
-- One row per file in public/sprites/avatar/{outfit,hat,accessory}/.

-- Basic outfits basic-01 … basic-24: free.
insert into public.cosmetics (id, slot, name, price, sprite)
select
  'basic-' || lpad(n::text, 2, '0'),
  'outfit',
  'Basic Outfit ' || n,
  0,
  '/sprites/avatar/outfit/basic-' || lpad(n::text, 2, '0') || '.png'
from generate_series(1, 24) as n
on conflict (id) do update
  set slot = excluded.slot, name = excluded.name, price = excluded.price, sprite = excluded.sprite;

insert into public.cosmetics (id, slot, name, price, sprite) values
  -- Special outfits
  ('special-astronaut',     'outfit',    'Astronaut',        200, '/sprites/avatar/outfit/special-astronaut.png'),
  ('special-gator-costume', 'outfit',    'Gator Costume',    200, '/sprites/avatar/outfit/special-gator-costume.png'),
  ('special-suit',          'outfit',    'Suit',             150, '/sprites/avatar/outfit/special-suit.png'),
  ('special-black-dress',   'outfit',    'Black Dress',      150, '/sprites/avatar/outfit/special-black-dress.png'),
  ('special-lab-coat',      'outfit',    'Lab Coat',         125, '/sprites/avatar/outfit/special-lab-coat.png'),
  ('special-hawaiian',      'outfit',    'Hawaiian Shirt',   100, '/sprites/avatar/outfit/special-hawaiian.png'),
  ('special-flannel',       'outfit',    'Flannel',          100, '/sprites/avatar/outfit/special-flannel.png'),
  ('special-gym',           'outfit',    'Gym Fit',           75, '/sprites/avatar/outfit/special-gym.png'),
  ('special-pajamas',       'outfit',    'Pajamas',           75, '/sprites/avatar/outfit/special-pajamas.png'),
  -- Hats
  ('grad-cap',              'hat',       'Grad Cap',         150, '/sprites/avatar/hat/grad-cap.png'),
  ('gator',                 'hat',       'Gator Hat',        150, '/sprites/avatar/hat/gator.png'),
  ('cowboy',                'hat',       'Cowboy Hat',       100, '/sprites/avatar/hat/cowboy.png'),
  ('straw',                 'hat',       'Straw Hat',         75, '/sprites/avatar/hat/straw.png'),
  ('bucket',                'hat',       'Bucket Hat',        75, '/sprites/avatar/hat/bucket.png'),
  ('blue-cap',              'hat',       'Blue Cap',          60, '/sprites/avatar/hat/blue-cap.png'),
  ('cream-cap',             'hat',       'Cream Cap',         60, '/sprites/avatar/hat/cream-cap.png'),
  ('beanie',                'hat',       'Beanie',            50, '/sprites/avatar/hat/beanie.png'),
  ('red-beanie',            'hat',       'Red Beanie',        50, '/sprites/avatar/hat/red-beanie.png'),
  -- Accessories
  ('gator-sunglasses',      'accessory', 'Gator Sunglasses', 150, '/sprites/avatar/accessory/gator-sunglasses.png'),
  ('heart-glasses',         'accessory', 'Heart Glasses',    100, '/sprites/avatar/accessory/heart-glasses.png'),
  ('sunglasses',            'accessory', 'Sunglasses',        75, '/sprites/avatar/accessory/sunglasses.png'),
  ('eyepatch',              'accessory', 'Eyepatch',          75, '/sprites/avatar/accessory/eyepatch.png'),
  ('face-paint',            'accessory', 'Face Paint',        75, '/sprites/avatar/accessory/face-paint.png'),
  ('round-glasses',         'accessory', 'Round Glasses',     60, '/sprites/avatar/accessory/round-glasses.png'),
  ('square-glasses',        'accessory', 'Square Glasses',    60, '/sprites/avatar/accessory/square-glasses.png'),
  ('blush',                 'accessory', 'Blush',             50, '/sprites/avatar/accessory/blush.png'),
  ('freckles',              'accessory', 'Freckles',          50, '/sprites/avatar/accessory/freckles.png')
on conflict (id) do update
  set slot = excluded.slot, name = excluded.name, price = excluded.price, sprite = excluded.sprite;


-- ─── buy_cosmetic(cosmetic_id) ──────────────────────────────────────────────
-- Spends my points on a cosmetic. Returns {status, points} with my points after.
-- status: bought | already_owned (also for free items) | not_enough_points | not_found

create or replace function public.buy_cosmetic(p_cosmetic_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me       text := auth.jwt()->>'sub';
  c        public.cosmetics;
  v_points int;
begin
  if me is null then
    raise exception 'buy_cosmetic: not logged in';
  end if;

  -- Lock my row so two quick taps can't spend the same points twice.
  select p.points into v_points from public.profiles p where p.id = me for update;
  if not found then
    raise exception 'buy_cosmetic: you need a profile first';
  end if;

  select * into c from public.cosmetics where id = p_cosmetic_id;
  if not found then
    return jsonb_build_object('status', 'not_found', 'points', v_points);
  end if;

  if c.price = 0 or exists (
    select 1 from public.owned_cosmetics o
    where o.user_id = me and o.cosmetic_id = c.id
  ) then
    return jsonb_build_object('status', 'already_owned', 'points', v_points);
  end if;

  if v_points < c.price then
    return jsonb_build_object('status', 'not_enough_points', 'points', v_points);
  end if;

  update public.profiles p
  set points = p.points - c.price
  where p.id = me
  returning p.points into v_points;

  insert into public.owned_cosmetics (user_id, cosmetic_id) values (me, c.id);

  return jsonb_build_object('status', 'bought', 'points', v_points);
end;
$$;

revoke execute on function public.buy_cosmetic(text) from public, anon;
grant execute on function public.buy_cosmetic(text) to authenticated;


-- ─── equip_cosmetic(cosmetic_id) ────────────────────────────────────────────
-- Puts a cosmetic I own (or a free one) on my avatar, in its slot.
-- Returns {status, avatar} with my avatar after.
-- status: equipped | not_owned | not_found

create or replace function public.equip_cosmetic(p_cosmetic_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me       text := auth.jwt()->>'sub';
  c        public.cosmetics;
  v_avatar jsonb;
begin
  if me is null then
    raise exception 'equip_cosmetic: not logged in';
  end if;

  select * into c from public.cosmetics where id = p_cosmetic_id;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if c.price > 0 and not exists (
    select 1 from public.owned_cosmetics o
    where o.user_id = me and o.cosmetic_id = c.id
  ) then
    return jsonb_build_object('status', 'not_owned');
  end if;

  update public.profiles p
  set avatar = coalesce(p.avatar, '{}'::jsonb) || jsonb_build_object(c.slot, c.id)
  where p.id = me
  returning p.avatar into v_avatar;

  if not found then
    raise exception 'equip_cosmetic: you need a profile first';
  end if;

  return jsonb_build_object('status', 'equipped', 'avatar', v_avatar);
end;
$$;

revoke execute on function public.equip_cosmetic(text) from public, anon;
grant execute on function public.equip_cosmetic(text) to authenticated;


-- ─── my_cosmetics() ─────────────────────────────────────────────────────────
-- Every cosmetic, for /shop, with whether I own it (free ones always count)
-- and whether it's on my avatar right now. Outfits, then hats, then
-- accessories, cheapest first.

create or replace function public.my_cosmetics()
returns table (
  id       text,
  slot     text,
  name     text,
  price    int,
  sprite   text,
  owned    boolean,
  equipped boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select auth.jwt()->>'sub' as uid
  ),
  mine as (
    select coalesce(
      (select p.avatar from public.profiles p cross join me where p.id = me.uid),
      '{}'::jsonb
    ) as avatar
  )
  select
    c.id,
    c.slot,
    c.name,
    c.price,
    c.sprite,
    c.price = 0 or exists (
      select 1 from public.owned_cosmetics o cross join me
      where o.user_id = me.uid and o.cosmetic_id = c.id
    ),
    coalesce(mine.avatar->>c.slot = c.id, false)
  from public.cosmetics c
  cross join mine
  order by
    case c.slot when 'outfit' then 0 when 'hat' then 1 when 'accessory' then 2 else 3 end,
    c.price,
    c.id;
$$;

revoke execute on function public.my_cosmetics() from public, anon;
grant execute on function public.my_cosmetics() to authenticated;
