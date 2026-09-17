-- ---------------------------------------------------------------------------
-- A trip runs between two dates, and a place is planned for one of them.
--
-- Places have been grouped by city since the initial schema, which answers
-- *where*. Nothing answered *when*. These three columns are the whole of it:
-- days are a second grouping standing beside cities rather than a level
-- underneath them, so a place can be filed under Kyōto and planned for a
-- Thursday without either deciding the other.
--
-- Every column here is nullable and constrains nothing. A trip with no dates is
-- an ordinary trip — most are created before the dates are known — and a place
-- with no date is one whose day has not been decided, which is a resting state
-- and not a gap to fill.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- `date`, not `timestamptz`, and this is the load-bearing decision.
--
-- A timestamp is an instant, and an instant is a different calendar day
-- depending on where it is read. A place dated Thursday while planning at home
-- would come back as Wednesday once somebody is standing in Kyōto — on the
-- phone, in the street, at the exact moment this product is supposed to be
-- worth trusting. A `date` has no zone to convert and so cannot drift.
--
-- Every other time column in this schema is `timestamptz` and correctly so:
-- `created_at` and `updated_at` record moments things happened. These record
-- days somebody chose. The two are not the same kind of value and the types
-- say which is which.
-- ---------------------------------------------------------------------------

alter table public.trips
  add column starts_on date,
  add column ends_on   date;

-- Either date may be absent independently of the other — a trip whose start is
-- known and whose return is not is an ordinary thing to hold. The constraint
-- therefore only has an opinion when both are present.
alter table public.trips
  add constraint trips_dates_ordered
  check (starts_on is null or ends_on is null or ends_on >= starts_on);

alter table public.markers
  add column planned_on date;

-- Deliberately unconstrained against the trip's own dates. A place dated a day
-- either side of the trip is somebody's decision, not an error, and refusing it
-- here would mean that shifting a trip by a day silently invalidated rows that
-- were already correct. `trips.starts_on` says roughly when the trip is; it is
-- not a boundary, and nothing in this schema treats it as one.

-- No policy changes. Row-level security on both tables already resolves to trip
-- membership through `trip_id`, and a date column does not change who a row
-- belongs to — a member who could read a marker can read its date, and one who
-- could not still reads no rows at all.

-- No trigger changes either. `markers_touch_updated_at` fires `before update`
-- for each row without naming columns, so changing which day a place is planned
-- for bumps `updated_at` like any other edit. That is what makes a date change
-- subject to the same stale-read refusal as every other change to a place.

-- ---------------------------------------------------------------------------
-- Creating a trip has to be able to carry its dates.
--
-- `create_trip` is the only route by which a trip row can be written — `trips`
-- has no insert policy at all, because the membership an insert policy would
-- resolve to is the one being created. So a trip created with dates has to
-- carry them through this function; the alternative is creating the trip and
-- then patching it, which is two writes where the whole point of this function
-- is that there is one.
--
-- Dropped and recreated rather than replaced. `create or replace function` with
-- a different parameter list creates an *overload*: the two-argument version
-- would still be there, `rpc('create_trip', …)` would have two candidates, and
-- which one answered would depend on how the arguments were named. Dropping
-- first is what makes this a replacement rather than an addition.
--
-- Dropping also drops the grants, so they are stated again below against the
-- new signature. Forgetting that half is how a function ends up existing and
-- being unexecutable by the only role that calls it.
-- ---------------------------------------------------------------------------

drop function public.create_trip(text, text);

create function public.create_trip(
  trip_name       text,
  member_name     text,
  trip_starts_on  date default null,
  trip_ends_on    date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_trip_id  uuid;
  caller_email text;
begin
  -- No session is not an error worth describing. Returning null rather than
  -- raising keeps this from being a way to ask the database questions: every
  -- unauthenticated call looks identical regardless of what was passed.
  if auth.uid() is null then
    return null;
  end if;

  caller_email := auth.jwt() ->> 'email';
  if caller_email is null or caller_email = '' then
    return null;
  end if;

  -- The column constraints are the validation, dates included: a reversed pair
  -- is refused by `trips_dates_ordered` rather than being quietly swapped. Both
  -- default to null, so every existing caller creates a dateless trip exactly
  -- as it did before.
  insert into public.trips (name, starts_on, ends_on)
  values (btrim(trip_name), trip_starts_on, trip_ends_on)
  returning id into new_trip_id;

  -- `user_id` is set here, and leaving it out was a real defect caught by the
  -- probe that verifies this function.
  --
  -- Membership resolves through `is_trip_member`, which matches on `user_id` and
  -- not on the address. A creator whose row carried only an email would be a
  -- member the database could not recognise: every select policy would refuse
  -- them their own trip, and it would stay invisible until they signed out and
  -- back in, at which point `claim_trip_memberships()` would match the address
  -- and link the row. Creating something and not being able to see it is a poor
  -- way to learn that.
  --
  -- The address is recorded as well, and still matters. It is what a second
  -- account would claim this row by, and it keeps the creator's membership the
  -- same shape as an invited one.
  insert into public.trip_members (trip_id, display_name, email, user_id)
  values (new_trip_id, btrim(member_name), caller_email, auth.uid());

  return new_trip_id;
end;
$$;

revoke all on function public.create_trip(text, text, date, date) from public;
grant execute on function public.create_trip(text, text, date, date) to authenticated;
