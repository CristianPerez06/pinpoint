-- A place records which days it is open and at what hours (#176).
--
-- One nullable column. Null means nobody has entered the hours, which is the
-- resting state of every place saved before this and of most places after it —
-- and it is never the same thing as "closed", which is why there is no value
-- that means "closed all week".

-- ---------------------------------------------------------------------------
-- Keyed by day, and stored per day
-- ---------------------------------------------------------------------------
--
-- `{ "tue": [["12:00","15:00"],["19:00","23:00"]], "sat": [["10:00","14:00"]] }`
--
-- Only open days are keys; a day that is not a key is closed. The form offers
-- "usual hours" plus "different on some days", but that is a way of entering
-- a week, not a fact about one, so it is derived when the form opens rather
-- than stored — and a later question like "is this place open on the day it is
-- planned for" reads one key rather than resolving an exception.
--
-- A column rather than a table of ranges: a place is saved in one write, and
-- the stale-read check on `updated_at` covers one row. Ranges in their own
-- table would make a save several writes that the check cannot see as one.
--
-- The database checks only the shape it can check cheaply: an object with at
-- least one day in it. The rules on the ranges themselves — to the minute, at
-- most two, in order, only the second crossing midnight, equal times meaning
-- all day — live in one schema in `@pinpoint/core`, which is what both
-- applications and the data layer validate through before writing. Restating
-- them here would be a second copy to keep in step with the first.
alter table public.markers
  add column hours jsonb;

alter table public.markers
  add constraint markers_hours_is_a_week
  check (
    hours is null
    or (jsonb_typeof(hours) = 'object' and hours <> '{}'::jsonb)
  );

-- No policy changes: row-level security on markers resolves through `trip_id`,
-- and a new column does not change who a row belongs to. No trigger changes:
-- `markers_touch_updated_at` fires on every update, so a change of hours is
-- subject to the same stale-read refusal as any other change to a place.
