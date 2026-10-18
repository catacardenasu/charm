-- 009_demo_seed.sql
-- Demo data: one demo profile ('demo|charm') who has met 12 people, enough to
-- unlock 2 plazas (Plaza of the Americas at 0, Turlington at 10), with weekly
-- streaks of 1–6 weeks (two at risk), 400 points and a few owned cosmetics.
-- Run after 001–008. Safe to re-run: step 1 wipes the previous demo data.
--
-- Only touches profiles whose id starts with 'demo|' (real Auth0 ids look like
-- 'google-oauth2|…'). Deleting those profiles cascades to their tap ins,
-- streaks, notifications, memories and owned cosmetics. Real users are never
-- touched. Dates are relative to today (America/New_York), so the streaks
-- stay current whenever you run it.

do $$
declare
  demo      constant text := 'demo|charm';
  today     date := (now() at time zone 'America/New_York')::date;
  this_week date := date_trunc('week', (now() at time zone 'America/New_York')::date)::date;

  f         record;
  fid       text;
  pair_a    text;
  pair_b    text;
  end_week  date;
  wk        date;
  d         date;
  pts       int;
  first_day date;
  last_d    date;

  -- The most recent prompt for each friend (shows on /u/:userId).
  prompts text[] := array[
    'What''s your go-to coffee order before a long day in Marston?',
    'Who do you think is the toughest game on the Gators'' schedule this year?',
    'What anime would you recommend to someone just getting into it?',
    'What''s the best concert you''ve been to in Gainesville?',
    'What board game always ends in a friendly argument?',
    'What''s the best thrift find you''ve ever scored?',
    'Which local spot has the best food on game day?',
    'What''s your favorite place on campus to sketch or take photos?',
    'What''s the scariest movie you''ve actually finished?',
    'Where''s your favorite quiet spot on campus to unwind?',
    'What song have you had on repeat this week?',
    'What cozy game would you recommend for a rainy afternoon?'
  ];
begin
  -- ─── 1. Clear the previous demo data ──────────────────────────────────────
  delete from public.profiles where left(id, 5) = 'demo|';

  -- ─── 2. The demo profile ──────────────────────────────────────────────────
  insert into public.profiles (id, nickname, major, year, interests, greeting, avatar, points)
  values (
    demo,
    'Demo Gator',
    'Computer Science',
    '3rd',
    array['Coffee', 'Boba', 'Video Games', 'Photography', 'Concerts', 'Football', 'Thrifting'],
    'Go Gators!',
    jsonb_build_object(
      'skin', 'tan', 'hairStyle', 4, 'hairColor', 'brown',
      'outfit', 'special-flannel', 'hat', 'gator', 'accessory', 'heart-glasses'
    ),
    400
  );

  -- Bought in the shop (and mostly worn above).
  insert into public.owned_cosmetics (user_id, cosmetic_id) values
    (demo, 'special-flannel'),
    (demo, 'gator'),
    (demo, 'heart-glasses'),
    (demo, 'sunglasses');

  -- ─── 3. Twelve friends, their tap ins and streaks ─────────────────────────
  -- weeks:       streak length in weeks
  -- at_risk:     streak ended last week, no tap in yet this week
  -- met_earlier: also met once before the current streak (older first_met)
  for f in
    select * from (values
      ( 1, 'Maya',   'pale',  3, 'black',  'basic-05', null::text, null::text,      'Biology',           '2nd', array['Coffee', 'Boba', 'Art'],                 'Find me in Marston!',            6, false, false),
      ( 2, 'Jordan', 'dark',  7, 'black',  'basic-12', 'blue-cap', null,            'Sports Management', '4th+', array['Football', 'Basketball', 'Video Games'], 'Go Gators!',                     5, false, true),
      ( 3, 'Priya',  'tan',   9, 'black',  'basic-08', null,       'round-glasses', 'Computer Science',  '3rd', array['Video Games', 'Anime', 'Boba'],          'Ask me what I am building',      4, true,  false),
      ( 4, 'Leo',    'pale',  2, 'blonde', 'basic-15', 'beanie',   null,            'Journalism',        '2nd', array['Photography', 'Concerts', 'Indie'],      'I''d drive anywhere for coffee', 4, false, true),
      ( 5, 'Sam',    'tan',   5, 'brown',  'basic-03', null,       null,            'Engineering',       '1st', array['Minecraft', 'Board Games', 'Coffee'],    'Currently debugging my life',    3, false, false),
      ( 6, 'Ava',    'pale', 11, 'red',    'basic-19', 'straw',    'blush',         'Psychology',        '3rd', array['Thrifting', 'Fashion', 'Brunch'],        'Tell me your go-to boba order',  3, false, false),
      ( 7, 'Diego',  'dark',  6, 'brown',  'basic-22', null,       'sunglasses',    'Finance',           '2nd', array['Soccer', 'Concerts', 'Football'],        'Pickleball anyone?',             2, true,  true),
      ( 8, 'Noor',   'tan',  10, 'purple', 'basic-10', null,       'heart-glasses', 'Architecture',      '4th+', array['Art', 'Photography', 'Plant'],           'Ask me about my sketchbook',     2, false, false),
      ( 9, 'Ethan',  'pale',  1, 'brown',  'basic-07', 'bucket',   null,            'History',           '1st', array['Movies', 'Horror', 'Coffee'],            'Lake Alice walks, anyone?',      2, false, false),
      (10, 'Zoe',    'dark', 12, 'pink',   'basic-17', null,       'freckles',      'Nursing',           '2nd', array['Yoga', 'Pets', 'Coffee'],                'I love SwampHacks!',             1, false, false),
      (11, 'Kai',    'tan',   4, 'blue',   'basic-24', 'cowboy',   null,            'Music',             '3rd', array['Concerts', 'Pop', 'Photography'],        'Looking for people to jam with', 1, false, false),
      (12, 'Lily',   'pale',  8, 'green',  'basic-02', null,       null,            'Advertising',       '1st', array['Cozy Games', 'Nintendo', 'Thrifting'],   'Ask me about fantasy books',     1, false, false)
    ) as v(n, nickname, skin, hair_style, hair_color, outfit, hat, accessory, major, yr, interests, greeting, weeks, at_risk, met_earlier)
  loop
    fid    := 'demo|friend-' || lpad(f.n::text, 2, '0');
    pair_a := least(demo, fid);
    pair_b := greatest(demo, fid);

    insert into public.profiles (id, nickname, major, year, interests, greeting, avatar, points)
    values (
      fid, f.nickname, f.major, f.yr, f.interests, f.greeting,
      jsonb_build_object(
        'skin', f.skin, 'hairStyle', f.hair_style, 'hairColor', f.hair_color,
        'outfit', f.outfit, 'hat', f.hat, 'accessory', f.accessory
      ),
      100 + f.n * 15
    );

    -- At-risk streaks ended last week; the rest include a tap in this week.
    end_week  := this_week - case when f.at_risk then 7 else 0 end;
    first_day := null;

    -- An earlier meeting with a week's gap before the streak started.
    if f.met_earlier then
      d := end_week - 7 * (f.weeks - 1) - 14 + 2;  -- Wednesday, two weeks before
      insert into public.tap_ins (user_a, user_b, scanner_id, day, points_awarded, created_at)
      values (pair_a, pair_b, fid, d, 50, (d + time '15:00') at time zone 'America/New_York');
      first_day := d;
    end if;

    -- One tap in per streak week: today for this week, Wednesday for past weeks.
    -- Points follow tap_in(): 50 for a first meeting, then 10 + 5 per streak week.
    for k in 1..f.weeks loop
      wk  := end_week - 7 * (f.weeks - k);
      d   := case when wk = this_week then today else wk + 2 end;
      pts := case when first_day is null then 50 else least(10 + 5 * (k - 1), 50) end;

      insert into public.tap_ins (user_a, user_b, scanner_id, day, prompt, points_awarded, created_at)
      values (
        pair_a, pair_b,
        case when (f.n + k) % 2 = 0 then demo else fid end,
        d,
        case when k = f.weeks then prompts[f.n] end,
        pts,
        least(now() - make_interval(mins => f.n), (d + time '15:00') at time zone 'America/New_York')
      );

      first_day := coalesce(first_day, d);
      last_d    := d;
    end loop;

    insert into public.pair_streaks (user_a, user_b, weeks, last_week, last_day, first_met)
    values (pair_a, pair_b, f.weeks, end_week, last_d, first_day);
  end loop;
end;
$$;


-- ─── Check it ───────────────────────────────────────────────────────────────
-- Expect 12 rows: weeks 6,5,4,4,3,3,2,2,2,1,1,1 with Priya and Diego at risk.
select
  p.nickname,
  s.weeks,
  s.last_week = date_trunc('week', (now() at time zone 'America/New_York')::date)::date - 7 as at_risk,
  s.first_met,
  s.last_day
from public.pair_streaks s
join public.profiles p on p.id = case when s.user_a = 'demo|charm' then s.user_b else s.user_a end
where 'demo|charm' in (s.user_a, s.user_b)
order by s.weeks desc, p.nickname;
