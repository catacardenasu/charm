-- 012_memories.sql
-- Memory photos: a private Storage bucket, Storage RLS, and the functions the
-- app calls to save and list memories. Run after 001–011. Safe to run more than
-- once. Doesn't change tap ins, streaks, points, coins or auth.
--
--   1. Bucket `memories`: private, JPEG only, 5 MB max.
--   2. Path helpers: one photo per person per tap in, at
--        {tap_in_id}/{uploader key}.jpg
--      The uploader key is the Auth0 sub with '|' written as ':'
--      ('google-oauth2|1234' → 'google-oauth2:1234'), because Storage rejects
--      '|' in object names. src/lib/memories.ts builds the same path.
--   3. Storage RLS: only the two people in a tap in (that wasn't removed) can
--      read its photos; you can only write your own photo's path.
--   4. memories table: storage_path must be that path; uploaders can delete
--      their own row.
--   5. save_memory(tap_in_id) and my_memories(other_user_id) for the app.
--
-- Removed tap ins: their photos and rows stop being readable straight away,
-- but a signed URL issued before the removal keeps working until it expires.
-- The app signs URLs for 5 minutes (MEMORY_URL_TTL_SECONDS) for that reason.
-- Removing a tap in doesn't delete its files, so restoring it would bring
-- them back.


-- ─── 1. Bucket ──────────────────────────────────────────────────────────────
-- Re-running keeps every stored photo and only re-applies the settings.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', false, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ─── 2. Path helpers ────────────────────────────────────────────────────────

-- The Auth0 sub as it appears in a Storage path.
create or replace function public.memory_user_key(p_user_id text)
returns text
language sql
immutable
set search_path = ''
as $$
  select replace(p_user_id, '|', ':');
$$;

-- Where a person's photo for a tap in lives inside the bucket.
create or replace function public.memory_object_name(p_tap_in_id uuid, p_uploader_id text)
returns text
language sql
immutable
set search_path = ''
as $$
  select p_tap_in_id::text || '/' || public.memory_user_key(p_uploader_id) || '.jpg';
$$;

-- The tap in an object name belongs to, or null if the name isn't
-- '<uuid>/<one segment>.jpg'.
create or replace function public.memory_object_tap_in(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[^/]+\.jpg$'
      then split_part(p_name, '/', 1)::uuid
  end;
$$;

-- Am I one of the two people in this tap in? Removed tap ins count only when
-- p_include_removed (so you can still delete your own photo from one).
-- Security definer so Storage policies can check tap_ins without depending on
-- its RLS.
create or replace function public.is_tap_in_participant(p_tap_in_id uuid, p_include_removed boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tap_ins t
    where t.id = p_tap_in_id
      and (p_include_removed or not t.removed)
      and (auth.jwt()->>'sub') in (t.user_a, t.user_b)
  );
$$;

-- Policies run these as the caller, so authenticated needs execute.
revoke execute on function public.memory_user_key(text) from public, anon;
revoke execute on function public.memory_object_name(uuid, text) from public, anon;
revoke execute on function public.memory_object_tap_in(text) from public, anon;
revoke execute on function public.is_tap_in_participant(uuid, boolean) from public, anon;
grant execute on function public.memory_user_key(text) to authenticated;
grant execute on function public.memory_object_name(uuid, text) to authenticated;
grant execute on function public.memory_object_tap_in(text) to authenticated;
grant execute on function public.is_tap_in_participant(uuid, boolean) to authenticated;


-- ─── 3. Storage RLS ─────────────────────────────────────────────────────────
-- storage.objects is shared by every bucket, so each policy checks bucket_id.
-- Upload with upsert (replacing your photo) needs insert, select and update.

drop policy if exists "memories: participants read" on storage.objects;
create policy "memories: participants read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'memories'
    and public.is_tap_in_participant(public.memory_object_tap_in(name))
  );

drop policy if exists "memories: upload my own photo" on storage.objects;
create policy "memories: upload my own photo"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memories'
    and public.is_tap_in_participant(public.memory_object_tap_in(name))
    and name = public.memory_object_name(public.memory_object_tap_in(name), auth.jwt()->>'sub')
  );

drop policy if exists "memories: replace my own photo" on storage.objects;
create policy "memories: replace my own photo"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'memories'
    and public.is_tap_in_participant(public.memory_object_tap_in(name))
    and name = public.memory_object_name(public.memory_object_tap_in(name), auth.jwt()->>'sub')
  )
  with check (
    bucket_id = 'memories'
    and public.is_tap_in_participant(public.memory_object_tap_in(name))
    and name = public.memory_object_name(public.memory_object_tap_in(name), auth.jwt()->>'sub')
  );

drop policy if exists "memories: delete my own photo" on storage.objects;
create policy "memories: delete my own photo"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memories'
    and public.is_tap_in_participant(public.memory_object_tap_in(name), true)
    and name = public.memory_object_name(public.memory_object_tap_in(name), auth.jwt()->>'sub')
  );


-- ─── 4. memories table ──────────────────────────────────────────────────────
-- 001 already has: participants read (not removed), insert only as yourself
-- into your own tap in, one row per (tap_in_id, uploader_id), no client updates.

-- storage_path can only be the uploader's own photo path. NOT VALID skips
-- checking rows saved before this file, so nothing existing is touched.
alter table public.memories drop constraint if exists memories_storage_path_check;
alter table public.memories
  add constraint memories_storage_path_check
  check (storage_path = public.memory_object_name(tap_in_id, uploader_id)) not valid;

create index if not exists memories_tap_in_idx on public.memories (tap_in_id);

-- Uploaders can delete their own memory (delete the photo from Storage too).
drop policy if exists "uploaders delete their own memory" on public.memories;
create policy "uploaders delete their own memory"
  on public.memories for delete to authenticated
  using (uploader_id = auth.jwt()->>'sub');

grant delete on public.memories to authenticated;


-- ─── 5. Functions for the app ───────────────────────────────────────────────

-- save_memory(tap_in_id): call right after uploading the photo to
-- memory_object_name(tap_in_id, me). Saves (or, after a retake, refreshes) my
-- memory row and returns it. Errors if I'm not in the tap in, it was removed,
-- or the photo isn't in Storage.
create or replace function public.save_memory(p_tap_in_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me     text := auth.jwt()->>'sub';
  v_path text;
  m      public.memories;
begin
  if me is null then
    raise exception 'save_memory: not logged in';
  end if;
  if not public.is_tap_in_participant(p_tap_in_id) then
    raise exception 'save_memory: not your tap in';
  end if;

  v_path := public.memory_object_name(p_tap_in_id, me);

  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'memories' and o.name = v_path
  ) then
    raise exception 'save_memory: upload the photo to % first', v_path;
  end if;

  insert into public.memories as mem (tap_in_id, uploader_id, storage_path)
  values (p_tap_in_id, me, v_path)
  on conflict (tap_in_id, uploader_id) do update
    set storage_path = excluded.storage_path,
        created_at = now()  -- a retake moves it to the front
  returning mem.* into m;

  return to_jsonb(m);
end;
$$;

revoke execute on function public.save_memory(uuid) from public, anon;
grant execute on function public.save_memory(uuid) to authenticated;


-- my_memories(other_user_id): memories from my tap ins that weren't removed,
-- newest first. Pass someone's id for "Memories Together" on /u/:userId, or
-- null for all of mine (Profile → Memories). Sign storage_path to show it.
create or replace function public.my_memories(p_other_user_id text default null)
returns table (
  id             uuid,
  tap_in_id      uuid,
  uploader_id    text,
  uploaded_by_me boolean,
  other_id       text,
  other_nickname text,
  storage_path   text,
  day            date,
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
    m.id,
    m.tap_in_id,
    m.uploader_id,
    m.uploader_id = me.uid,
    p.id,
    p.nickname,
    m.storage_path,
    t.day,
    m.created_at
  from public.memories m
  join public.tap_ins t on t.id = m.tap_in_id
  cross join me
  join public.profiles p
    on p.id = case when t.user_a = me.uid then t.user_b else t.user_a end
  where me.uid in (t.user_a, t.user_b)
    and not t.removed
    and (p_other_user_id is null or p.id = p_other_user_id)
  order by m.created_at desc;
$$;

revoke execute on function public.my_memories(text) from public, anon;
grant execute on function public.my_memories(text) to authenticated;
