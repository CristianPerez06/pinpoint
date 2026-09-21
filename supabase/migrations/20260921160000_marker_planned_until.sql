-- ---------------------------------------------------------------------------
-- A place can be planned for a run of days, not only for one.
--
-- The case that makes it obvious is somewhere you sleep: a hotel booked for
-- three nights belongs on each of those days, not only the one you check in.
-- Until now the only ways to say that were to date it to the first day and have
-- it vanish from the calendar for the rest of the stay, or to save the same
-- hotel three times — three pins on one point, three entries in every count,
-- and three rows to edit when the booking changes.
--
-- `planned_on` keeps its meaning exactly: the first day. This column is the
-- last one. A place with no `planned_until` is planned for one day, which is
-- every row already in this table — so there is nothing to backfill and the
-- product behaves identically for every place saved so far the moment this
-- column exists.
-- ---------------------------------------------------------------------------

-- `date`, for the reason the migration that added `planned_on` gives at length:
-- a timestamp is an instant, and an instant is a different calendar day
-- depending on where it is read. These are days somebody chose, not moments
-- things happened, and a `date` has no zone to convert and so cannot drift.
alter table public.markers
  add column planned_until date;

-- ---------------------------------------------------------------------------
-- Four rules, one constraint.
--
-- They are one statement about one pair of columns, so a reader asking whether
-- a pair is legal has one place to look rather than four.
--
--   * No end without a beginning. A last day with no `planned_on` describes a
--     run that starts nowhere, and nothing could place it on a calendar.
--
--   * Strictly after, not on or after. `>` is what keeps a single day from
--     having two representations: without it, "the 3rd" could be stored as
--     (3rd, null) or (3rd, 3rd), and every piece of code that reads a day would
--     have to handle both, for ever. The applications normalise an equal pair
--     to null before writing, so nobody meets this as a refusal — it is the
--     backstop for a caller the compiler never sees, which is the population
--     the defaults in `packages/core/src/marker.ts` are already written for.
--
--   * At most a year. These dates are typed by hand, so a slipped year turns a
--     three-night stay into a run of some thirty-six thousand days: one place
--     claiming every day of a century, which no calendar can draw and which
--     would make working out what is on today take as long as the trip. Nothing
--     anybody plans on a trip runs longer than a year, so this refuses typos and
--     nothing else.
--
-- The bound is stated *here* rather than guarded where the days are drawn, and
-- that is deliberate. A run silently shortened to fit would put the place on
-- some of its days and not others, with nothing on screen to say why — the
-- failure would read as the calendar losing rows. Refused at the source, it
-- reads as what it is: a date that cannot be right.
-- ---------------------------------------------------------------------------
alter table public.markers
  add constraint markers_planned_run_valid
  check (
    planned_until is null
    or (
      planned_on is not null
      and planned_until > planned_on
      and planned_until - planned_on <= 365
    )
  );

-- Deliberately unconstrained against the trip's own dates, exactly as
-- `planned_on` is. A run reaching a day either side of the trip is somebody's
-- decision, not an error, and refusing it here would mean that shifting a trip
-- by a day silently invalidated rows that were already correct.

-- No policy changes. Row-level security on `markers` already resolves to trip
-- membership through `trip_id`, and a second date column does not change who a
-- row belongs to — a member who could read a marker can read both its dates,
-- and one who could not still reads no rows at all.

-- No grant changes either. `markers` was granted by
-- `20260921120000_data_api_grants.sql`, and a grant is on the table rather than
-- on its columns, so a new column is reachable by whoever could already reach
-- the row. `pnpm check:tables` covers this.

-- No trigger changes. `markers_touch_updated_at` fires `before update` for each
-- row without naming columns, so changing a place's last day bumps `updated_at`
-- like any other edit — which is what makes it subject to the same stale-read
-- refusal as every other change to a place.

-- `create_trip` is untouched: it writes trips and memberships, not places.
