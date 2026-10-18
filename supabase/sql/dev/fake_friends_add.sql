-- dev/fake_friends_add.sql
-- TESTING ONLY. Gives one real account a bunch of fake charmlings so you can see
-- the plazas fill up and unlock. Not a migration: don't add it to the numbered files.
--
-- 1. Set target_code to the keychain code of the account to fill (yours),
--    and how_many to the number of fake people (30 shows 3 plazas, 55 shows all 5).
-- 2. Paste into the SQL Editor and run.
-- 3. Undo with dev/fake_friends_remove.sql.
--
-- What it adds: fake profiles with ids starting 'fake|', one tap in each with
-- the target account, and a 1-week pair streak. Tap ins are spread one per day
-- going back from today, so the newest few show a flame, last week's are
-- "at risk", and older ones have none. The target's own profile, points, coins
-- and real tap ins are never changed. Re-running replaces the previous fakes.

do $$
declare
  target_code constant text := 'YOUR_KEYCHAIN_CODE';  -- ← change this
  how_many    constant int  := 60;                    -- ← and this (1–60)

  target text;
  fake   text;
  d      date;
  today  date := (now() at time zone 'America/New_York')::date;

  names text[] := array[
    'Maya', 'Jordan', 'Priya', 'Leo', 'Sam', 'Ava', 'Diego', 'Noor', 'Ethan', 'Zoe',
    'Kai', 'Lily', 'Omar', 'Grace', 'Mateo', 'Hana', 'Eli', 'Chloe', 'Ravi', 'Sofia',
    'Nate', 'Iris', 'Jules', 'Amara', 'Theo', 'Luna', 'Malik', 'Rosa', 'Finn', 'Tess',
    'Arjun', 'Bea', 'Cole', 'Dani', 'Ezra', 'Faye', 'Gabe', 'Hazel', 'Ian', 'Jade',
    'Kofi', 'Lena', 'Milo', 'Nia', 'Owen', 'Pia', 'Quinn', 'Rhea', 'Seth', 'Tara',
    'Uma', 'Vince', 'Wren', 'Xavi', 'Yara', 'Zane', 'Aria', 'Ben', 'Cleo', 'Dev'
  ];
  skins  text[] := array['pale', 'tan', 'dark'];
  colors text[] := array['brown', 'black', 'blonde', 'red', 'blue', 'purple', 'pink', 'green'];
  hats   text[] := array['beanie', 'blue-cap', 'bucket', 'cowboy', 'straw'];
  interests text[] := array['Coffee', 'Boba', 'Video Games', 'Photography', 'Concerts', 'Football',
                            'Thrifting', 'Anime', 'Art', 'Running', 'Cooking', 'Movies'];
begin
  if how_many < 1 or how_many > 60 then
    raise exception 'how_many must be between 1 and 60';
  end if;

  select k.owner_id into target from public.keychains k where k.code = target_code;
  if target is null then
    raise exception 'No account owns keychain %. Check the code (it is case-sensitive).', target_code;
  end if;
  if left(target, 5) = 'fake|' or left(target, 5) = 'demo|' then
    raise exception 'Pick a real account, not a fake or demo one.';
  end if;

  -- Replace this account's previous fakes.
  delete from public.profiles where id like 'fake|' || left(md5(target), 8) || '-%';

  for n in 1..how_many loop
    -- One fake per n, tied to this target so two people can test at once.
    fake := 'fake|' || left(md5(target), 8) || '-' || lpad(n::text, 2, '0');
    -- Person 1 is the oldest connection, the last one is today.
    d := today - (how_many - n);

    insert into public.profiles (id, nickname, major, year, interests, greeting, avatar, points)
    values (
      fake,
      names[n],
      'Undeclared',
      (array['1st', '2nd', '3rd', '4th+'])[1 + n % 4],
      array[interests[1 + n % 12], interests[1 + (n * 5) % 12], interests[1 + (n * 7) % 12]],
      'Fake charmling #' || n,
      jsonb_build_object(
        'skin', skins[1 + n % 3],
        'hairStyle', 1 + n % 12,
        'hairColor', colors[1 + n % 8],
        'outfit', 'basic-' || lpad((1 + n % 24)::text, 2, '0'),
        'hat', case when n % 4 = 0 then hats[1 + (n / 4) % 5] end,
        'accessory', null
      ),
      n * 10
    );

    insert into public.tap_ins (user_a, user_b, scanner_id, day, created_at)
    values (
      least(target, fake),
      greatest(target, fake),
      fake,
      d,
      ((d + time '12:00') at time zone 'America/New_York') + make_interval(secs => n)
    );

    insert into public.pair_streaks (user_a, user_b, weeks, last_week, last_day, first_met)
    values (least(target, fake), greatest(target, fake), 1, date_trunc('week', d)::date, d, d);
  end loop;
end $$;


-- Check it: how many fakes the account has, and where they land.
-- (Plaza of the Americas holds people 1–10, Turlington 11–25, Lake Alice 26–40, …)
select count(*) as fake_charmlings
from public.profiles
where left(id, 5) = 'fake|';
