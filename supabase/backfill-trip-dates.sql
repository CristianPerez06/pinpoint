-- ---------------------------------------------------------------------------
-- Disposable. Run by hand, once, then delete.
--
-- This is NOT a migration and must not become one. The dates it fills in are
-- optional — every trip in the database is already valid without them — so
-- encoding a one-off convenience as a permanent schema step would make every
-- future clone of this database replay somebody's holiday dates. The seed
-- migrations were removed for the same reason in #138.
--
-- It is deleted when `trip-calendar` is archived.
--
-- Run it in the Supabase SQL editor, or through psql against the linked
-- project. Re-running it changes nothing: every statement only touches trips
-- whose dates are still absent.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. See what is there.
--
-- Run this on its own first. The update below names trips by name, so this is
-- how you learn what to name.
-- ---------------------------------------------------------------------------

select id, name, archived, starts_on, ends_on
  from public.trips
 order by created_at;

-- ---------------------------------------------------------------------------
-- 2. Fill in the dates.
--
-- One statement per trip. Replace the name and the two dates; add or remove
-- statements to match what the query above returned.
--
-- `and starts_on is null` is what makes this safe to run twice — a trip whose
-- dates have already been set is left exactly as it is, so this can never
-- overwrite a date somebody has since chosen in the application.
-- ---------------------------------------------------------------------------

update public.trips
   set starts_on = '2026-04-01',
       ends_on   = '2026-04-14'
 where name = 'REPLACE WITH A TRIP NAME'
   and starts_on is null;

-- ---------------------------------------------------------------------------
-- 3. Check the result.
-- ---------------------------------------------------------------------------

select id, name, starts_on, ends_on
  from public.trips
 order by created_at;
