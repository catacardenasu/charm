-- dev/fake_friends_remove.sql
-- Removes every fake charmling made by dev/fake_friends_add.sql (ids starting
-- 'fake|'), along with their tap ins, streaks, notifications and memories.
-- Real accounts and their real tap ins are untouched.

delete from public.profiles where left(id, 5) = 'fake|';

select count(*) as fake_charmlings_left
from public.profiles
where left(id, 5) = 'fake|';
