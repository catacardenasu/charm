-- Rename the cosmetics 'item' slot to 'hat': the art has hats, not items.
-- For databases where 001_schema.sql was run before this change. On a fresh database
-- (001 already says 'hat') this does nothing, so it's always safe to run.

alter table public.cosmetics drop constraint if exists cosmetics_slot_check;

update public.cosmetics set slot = 'hat' where slot = 'item';

alter table public.cosmetics
  add constraint cosmetics_slot_check check (slot in ('hair', 'outfit', 'accessory', 'hat'));

-- Move any saved avatar.item value to avatar.hat.
update public.profiles
set avatar = (avatar - 'item') || jsonb_build_object('hat', avatar -> 'item')
where avatar ? 'item';
