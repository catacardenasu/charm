-- tests/012_memories_checks.sql
-- Security checks for 012_memories.sql. Run it in the Supabase SQL Editor
-- after 012. Everything runs in one transaction that is ROLLED BACK at the
-- end, so it leaves no data, files or users behind.
--
-- It makes three throwaway profiles (memtest|a and memtest|b tap in together,
-- memtest|c is a stranger), then acts as each of them the same way an Auth0
-- token does (role authenticated + request.jwt.claims). Inserting into
-- storage.objects here runs the same RLS checks as a Storage upload, without
-- storing a real file.
--
-- Passing: the last result is 'ALL MEMORIES CHECKS PASSED'.
-- Failing: it stops with an error starting 'FAIL:'.
--
-- Not covered here (needs the live app, see the notes in the handoff):
-- real uploads through the Storage API, the 5 MB / JPEG limits, signed URLs,
-- and deleting files (Supabase blocks deleting storage.objects with SQL).

begin;

-- ─── Fixtures (as the SQL Editor's postgres role) ───────────────────────────
insert into public.profiles (id, nickname) values
  ('memtest|a', 'Mem Test A'),
  ('memtest|b', 'Mem Test B'),
  ('memtest|c', 'Mem Test C');

insert into public.tap_ins (id, user_a, user_b, scanner_id, day)
values ('00000000-0000-4000-8000-00000000a0b0', 'memtest|a', 'memtest|b', 'memtest|a', current_date);

do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'memories' and not public
      and file_size_limit = 5242880 and allowed_mime_types = array['image/jpeg']
  ) then
    raise exception 'FAIL: memories bucket missing or not private / 5 MB / image/jpeg';
  end if;
  if public.memory_object_name('00000000-0000-4000-8000-00000000a0b0', 'google-oauth2|123')
     <> '00000000-0000-4000-8000-00000000a0b0/google-oauth2:123.jpg' then
    raise exception 'FAIL: memory_object_name';
  end if;
end $$;


-- ─── As A (in the tap in) ───────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"memtest|a","role":"authenticated"}', true);
set local role authenticated;

-- A can upload their own photo.
insert into storage.objects (bucket_id, name)
values ('memories', '00000000-0000-4000-8000-00000000a0b0/memtest:a.jpg');

do $$
begin
  -- A can't upload as B.
  begin
    insert into storage.objects (bucket_id, name)
    values ('memories', '00000000-0000-4000-8000-00000000a0b0/memtest:b.jpg');
    raise exception 'FAIL: A uploaded to B''s path';
  exception when insufficient_privilege then null;
  end;

  -- A can't upload a different file name or type.
  begin
    insert into storage.objects (bucket_id, name)
    values ('memories', '00000000-0000-4000-8000-00000000a0b0/memtest:a.png');
    raise exception 'FAIL: A uploaded a non-.jpg name';
  exception when insufficient_privilege then null;
  end;

  -- A can't upload into a tap in that doesn't exist.
  begin
    insert into storage.objects (bucket_id, name)
    values ('memories', '00000000-0000-4000-8000-0000000000ff/memtest:a.jpg');
    raise exception 'FAIL: A uploaded to someone else''s tap in';
  exception when insufficient_privilege then null;
  end;

  -- A can't save a memory row as B, or with a made-up path.
  begin
    insert into public.memories (tap_in_id, uploader_id, storage_path)
    values ('00000000-0000-4000-8000-00000000a0b0', 'memtest|b', '00000000-0000-4000-8000-00000000a0b0/memtest:b.jpg');
    raise exception 'FAIL: A inserted a memory as B';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.memories (tap_in_id, uploader_id, storage_path)
    values ('00000000-0000-4000-8000-00000000a0b0', 'memtest|a', 'some/other/file.jpg');
    raise exception 'FAIL: A saved a memory pointing at another file';
  exception when check_violation then null;
  end;
end $$;

-- A saves their memory through the app's function.
select public.save_memory('00000000-0000-4000-8000-00000000a0b0');

do $$
begin
  if (select count(*) from public.my_memories(null)) <> 1 then
    raise exception 'FAIL: A should see 1 memory';
  end if;
  if (select count(*) from public.my_memories('memtest|b')) <> 1 then
    raise exception 'FAIL: A should see 1 memory with B';
  end if;
end $$;


-- ─── As B (the other person in the tap in) ──────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"memtest|b","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from storage.objects
      where bucket_id = 'memories' and name like '00000000-0000-4000-8000-00000000a0b0/%') <> 1 then
    raise exception 'FAIL: B should be able to read A''s photo';
  end if;
  if (select count(*) from public.my_memories('memtest|a')) <> 1 then
    raise exception 'FAIL: B should see A''s memory';
  end if;
  if (select count(*) from public.memories) <> 1 then
    raise exception 'FAIL: B should see the memory row';
  end if;
end $$;


-- ─── As C (a stranger) ──────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"memtest|c","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from storage.objects where bucket_id = 'memories'
      and name like '00000000-0000-4000-8000-00000000a0b0/%') <> 0 then
    raise exception 'FAIL: C can see the photo';
  end if;
  if (select count(*) from public.memories
      where tap_in_id = '00000000-0000-4000-8000-00000000a0b0') <> 0 then
    raise exception 'FAIL: C can see the memory row';
  end if;
  if (select count(*) from public.my_memories(null)) <> 0 then
    raise exception 'FAIL: my_memories shows C someone else''s memory';
  end if;

  begin
    insert into storage.objects (bucket_id, name)
    values ('memories', '00000000-0000-4000-8000-00000000a0b0/memtest:c.jpg');
    raise exception 'FAIL: C uploaded into A and B''s tap in';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.save_memory('00000000-0000-4000-8000-00000000a0b0');
    raise exception 'FAIL: C saved a memory';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
end $$;


-- ─── Logged out (anon) ──────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

do $$
begin
  if (select count(*) from storage.objects where bucket_id = 'memories') <> 0 then
    raise exception 'FAIL: anon can see memory photos';
  end if;
  begin
    perform public.my_memories(null);
    raise exception 'FAIL: anon can call my_memories';
  exception when insufficient_privilege then null;
  end;
end $$;


-- ─── After the tap in is removed ────────────────────────────────────────────
reset role;
update public.tap_ins set removed = true where id = '00000000-0000-4000-8000-00000000a0b0';

select set_config('request.jwt.claims', '{"sub":"memtest|a","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from storage.objects where bucket_id = 'memories'
      and name like '00000000-0000-4000-8000-00000000a0b0/%') <> 0 then
    raise exception 'FAIL: A can still read photos of a removed tap in';
  end if;
  if (select count(*) from public.memories) <> 0 then
    raise exception 'FAIL: A can still see memories of a removed tap in';
  end if;
  if (select count(*) from public.my_memories(null)) <> 0 then
    raise exception 'FAIL: my_memories still lists a removed tap in';
  end if;

  begin
    perform public.save_memory('00000000-0000-4000-8000-00000000a0b0');
    raise exception 'FAIL: A saved a memory to a removed tap in';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  begin
    update storage.objects set metadata = '{}'::jsonb
    where bucket_id = 'memories' and name = '00000000-0000-4000-8000-00000000a0b0/memtest:a.jpg';
    if found then raise exception 'FAIL: A replaced a photo on a removed tap in'; end if;
  end;
end $$;

reset role;
rollback;

-- Last, because the SQL Editor only shows the final statement's result.
select 'ALL MEMORIES CHECKS PASSED' as result;
