-- 002_keychains.sql
-- Phase 1: what /k/:code needs. Run after 001_schema.sql.


-- keychain_lookup(code): works logged out too, so /k/:code can show the teaser
-- ("Natalia wants to tap in with you!") before login.
-- status: not_found | inactive | unclaimed | mine | owned
create or replace function public.keychain_lookup(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me text := auth.jwt()->>'sub';
  k  public.keychains;
  o  public.profiles;
  has_profile boolean := exists (select 1 from public.profiles where id = me);
begin
  select * into k from public.keychains where code = p_code;

  if not found then
    return jsonb_build_object('status', 'not_found', 'has_profile', has_profile);
  end if;
  if not k.active then
    return jsonb_build_object('status', 'inactive', 'has_profile', has_profile);
  end if;
  if k.owner_id is null then
    return jsonb_build_object('status', 'unclaimed', 'has_profile', has_profile);
  end if;

  select * into o from public.profiles where id = k.owner_id;

  return jsonb_build_object(
    'status', case when k.owner_id = me then 'mine' else 'owned' end,
    'has_profile', has_profile,
    'owner', jsonb_build_object('nickname', o.nickname, 'avatar', o.avatar)
  );
end;
$$;

revoke execute on function public.keychain_lookup(text) from public;
grant execute on function public.keychain_lookup(text) to anon, authenticated;


-- claim_keychain(code): the "Claim this keychain?" button.
-- status: claimed | no_profile | not_found | inactive | mine | owned | already_have_one
create or replace function public.claim_keychain(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me text := auth.jwt()->>'sub';
  k  public.keychains;
begin
  if me is null then
    raise exception 'not logged in';
  end if;
  if not exists (select 1 from public.profiles where id = me) then
    return jsonb_build_object('status', 'no_profile');
  end if;

  -- Lock the row so two people can't claim the same keychain at once.
  select * into k from public.keychains where code = p_code for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if not k.active then
    return jsonb_build_object('status', 'inactive');
  end if;
  if k.owner_id = me then
    return jsonb_build_object('status', 'mine');
  end if;
  if k.owner_id is not null then
    return jsonb_build_object('status', 'owned');
  end if;
  if exists (select 1 from public.keychains where owner_id = me and active) then
    return jsonb_build_object('status', 'already_have_one');
  end if;

  update public.keychains
  set owner_id = me, claimed_at = now()
  where code = p_code;

  return jsonb_build_object('status', 'claimed');
end;
$$;

revoke execute on function public.claim_keychain(text) from public, anon;
grant execute on function public.claim_keychain(text) to authenticated;


-- ─── Making keychain codes (run separately when you need more) ──────────────
-- Creates 20 random 10-character codes and lists them, so you can write
-- https://<PRODUCTION_URL>/k/<code> onto each NFC keychain.
--
-- insert into public.keychains (code)
-- select string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
--                          (floor(random() * 62) + 1)::int, 1), '')
-- from generate_series(1, 20) as k, generate_series(1, 10) as c
-- group by k
-- returning code;
