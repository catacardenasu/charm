-- WHEN TO RUN: only if you already pasted the OLD 001_schema.sql (the one with 'item')
-- into Supabase. Paste this once in the SQL Editor after it. If you're setting up a fresh
-- database with the current 001, you can skip this file (running it anyway does nothing).
--
-- Renames the cosmetics 'item' slot to 'hat': the art has hats, not items.

alter table public.cosmetics drop constraint if exists cosmetics_slot_check;

update public.cosmetics set slot = 'hat' where slot = 'item';

alter table public.cosmetics
  add constraint cosmetics_slot_check check (slot in ('hair', 'outfit', 'accessory', 'hat'));

-- Move any saved avatar.item value to avatar.hat.
update public.profiles
set avatar = (avatar - 'item') || jsonb_build_object('hat', avatar -> 'item')
where avatar ? 'item';
