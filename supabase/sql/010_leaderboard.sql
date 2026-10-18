-- 010_leaderboard.sql
-- Paste into the Supabase SQL Editor after 009.

-- ─── my_leaderboard() ───────────────────────────────────────────────────────
-- Me plus everyone I've had a non-removed tap in with, most points first
-- (ties by nickname). Empty when I have no profile yet.
--
-- rank:  1-based rank() by points, so ties share a rank (1, 2, 2, 4).
-- is_me: true on my own row.

create or replace function public.my_leaderboard()
returns table (
  id       text,
  nickname text,
  avatar   jsonb,
  points   int,
  rank     int,
  is_me    boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select auth.jwt()->>'sub' as uid
  ),
  people as (
    select me.uid as id from me
    union
    select case when t.user_a = me.uid then t.user_b else t.user_a end
    from public.tap_ins t
    cross join me
    where me.uid in (t.user_a, t.user_b)
      and not t.removed
  )
  select
    p.id,
    p.nickname,
    p.avatar,
    p.points,
    (rank() over (order by p.points desc))::int,
    p.id = me.uid
  from people
  cross join me
  join public.profiles p on p.id = people.id
  where exists (select 1 from public.profiles mine where mine.id = me.uid)
  order by p.points desc, p.nickname;
$$;

revoke execute on function public.my_leaderboard() from public, anon;
grant execute on function public.my_leaderboard() to authenticated;
