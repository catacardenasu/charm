-- 001_schema.sql
-- Charm tables, RLS and policies. Paste into the Supabase SQL Editor and run once.
--
-- User IDs are Auth0 `sub` strings (text), e.g. 'google-oauth2|1234'.
-- The current user is auth.jwt()->>'sub'. Never use auth.uid() (it casts to uuid).
-- Points, streaks and tap ins are only written by security definer functions
-- (later files), so clients get no insert/update grants on those tables.


-- ─── profiles ───────────────────────────────────────────────────────────────

create table public.profiles (
  id         text primary key default (auth.jwt()->>'sub'),
  nickname   text not null check (char_length(nickname) between 1 and 30),
  major      text,
  year       text,
  interests  text[] not null default '{}',
  greeting   text,
  avatar     jsonb not null default '{}'::jsonb,  -- {skin, hairStyle, hairColor, outfit, hat, accessory}
  points     int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by logged-in users"
  on public.profiles for select to authenticated
  using (true);

create policy "users create their own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.jwt()->>'sub');

create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.jwt()->>'sub')
  with check (id = auth.jwt()->>'sub');

-- Clients can edit their profile fields but never points.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant insert (id, nickname, major, year, interests, greeting, avatar) on public.profiles to authenticated;
grant update (nickname, major, year, interests, greeting, avatar) on public.profiles to authenticated;


-- ─── keychains ──────────────────────────────────────────────────────────────

create table public.keychains (
  code       text primary key check (code ~ '^[A-Za-z0-9]{8,}$'),
  owner_id   text references public.profiles(id) on delete set null,
  active     boolean not null default true,
  claimed_at timestamptz
);

-- One active keychain per person (lost keychain = deactivate old, claim new).
create unique index keychains_one_active_per_owner
  on public.keychains (owner_id)
  where active and owner_id is not null;

alter table public.keychains enable row level security;

create policy "users see their own keychains"
  on public.keychains for select to authenticated
  using (owner_id = auth.jwt()->>'sub');

-- Lookups and claims go through keychain_lookup() / claim_keychain().
revoke insert, update, delete on public.keychains from anon, authenticated;


-- ─── tap_ins ────────────────────────────────────────────────────────────────

create table public.tap_ins (
  id            uuid primary key default gen_random_uuid(),
  user_a        text not null references public.profiles(id) on delete cascade,
  user_b        text not null references public.profiles(id) on delete cascade,
  scanner_id    text not null references public.profiles(id) on delete cascade,
  keychain_code text references public.keychains(code),
  day           date not null default ((now() at time zone 'America/New_York')::date),
  prompt        text,
  removed       boolean not null default false,
  created_at    timestamptz not null default now(),
  check (user_a < user_b),
  check (scanner_id in (user_a, user_b)),
  unique (user_a, user_b, day)  -- once per pair per day
);

create index tap_ins_user_b_idx on public.tap_ins (user_b);

alter table public.tap_ins enable row level security;

create policy "users see their own tap ins"
  on public.tap_ins for select to authenticated
  using (auth.jwt()->>'sub' in (user_a, user_b));

revoke insert, update, delete on public.tap_ins from anon, authenticated;


-- ─── pair_streaks ───────────────────────────────────────────────────────────

create table public.pair_streaks (
  user_a    text not null references public.profiles(id) on delete cascade,
  user_b    text not null references public.profiles(id) on delete cascade,
  weeks     int not null default 1,
  last_week date not null,  -- Monday of the last week they tapped in
  last_day  date not null,
  first_met date not null,
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create index pair_streaks_user_b_idx on public.pair_streaks (user_b);

alter table public.pair_streaks enable row level security;

create policy "users see their own streaks"
  on public.pair_streaks for select to authenticated
  using (auth.jwt()->>'sub' in (user_a, user_b));

revoke insert, update, delete on public.pair_streaks from anon, authenticated;


-- ─── notifications ──────────────────────────────────────────────────────────

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('tap_in', 'streak_warning', 'unlock')),
  payload    jsonb not null default '{}'::jsonb,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users see their own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.jwt()->>'sub');

create policy "users mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.jwt()->>'sub')
  with check (user_id = auth.jwt()->>'sub');

revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read) on public.notifications to authenticated;

-- Realtime: the keychain owner's phone updates instantly on a tap in.
alter publication supabase_realtime add table public.notifications;


-- ─── memories ───────────────────────────────────────────────────────────────

create table public.memories (
  id           uuid primary key default gen_random_uuid(),
  tap_in_id    uuid not null references public.tap_ins(id) on delete cascade,
  uploader_id  text not null references public.profiles(id) on delete cascade,
  storage_path text not null,  -- memories/{tap_in_id}/{uploader_id}.jpg
  created_at   timestamptz not null default now(),
  unique (tap_in_id, uploader_id)
);

alter table public.memories enable row level security;

create policy "people in the tap in see its memories"
  on public.memories for select to authenticated
  using (exists (
    select 1 from public.tap_ins t
    where t.id = tap_in_id
      and not t.removed
      and auth.jwt()->>'sub' in (t.user_a, t.user_b)
  ));

create policy "people in the tap in add their own memory"
  on public.memories for insert to authenticated
  with check (
    uploader_id = auth.jwt()->>'sub'
    and exists (
      select 1 from public.tap_ins t
      where t.id = tap_in_id
        and not t.removed
        and auth.jwt()->>'sub' in (t.user_a, t.user_b)
    )
  );

revoke update, delete on public.memories from anon, authenticated;


-- ─── locations ──────────────────────────────────────────────────────────────

create table public.locations (
  id        text primary key,
  name      text not null,
  unlock_at int not null default 0,  -- unique people met required
  sort      int not null default 0
);

alter table public.locations enable row level security;

create policy "locations are readable by logged-in users"
  on public.locations for select to authenticated
  using (true);

revoke insert, update, delete on public.locations from anon, authenticated;

-- Starting location. The rest get added once the art and thresholds are final.
insert into public.locations (id, name, unlock_at, sort)
values ('plaza', 'Plaza of the Americas', 0, 0);


-- ─── cosmetics ──────────────────────────────────────────────────────────────

create table public.cosmetics (
  id     text primary key,
  slot   text not null check (slot in ('hair', 'outfit', 'accessory', 'hat')),
  name   text not null,
  price  int not null check (price >= 0),
  sprite text not null  -- path under /public/sprites/
);

alter table public.cosmetics enable row level security;

create policy "cosmetics are readable by logged-in users"
  on public.cosmetics for select to authenticated
  using (true);

revoke insert, update, delete on public.cosmetics from anon, authenticated;


create table public.owned_cosmetics (
  user_id     text not null references public.profiles(id) on delete cascade,
  cosmetic_id text not null references public.cosmetics(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (user_id, cosmetic_id)
);

alter table public.owned_cosmetics enable row level security;

create policy "users see their own cosmetics"
  on public.owned_cosmetics for select to authenticated
  using (user_id = auth.jwt()->>'sub');

-- Buying goes through a shop function (spends points).
revoke insert, update, delete on public.owned_cosmetics from anon, authenticated;
