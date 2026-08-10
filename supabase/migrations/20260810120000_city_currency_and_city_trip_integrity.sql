-- A city declares the currency of the prices filed under it, and a marker's
-- city must belong to the marker's own trip.
--
-- Both exist because this is the first change that writes a city reference from
-- a client. Until now every marker was written by a seed migration that could
-- not get it wrong.

-- ---------------------------------------------------------------------------
-- A marker's city belongs to the same trip as the marker
-- ---------------------------------------------------------------------------
--
-- Nothing enforced this before. The foreign key required only that the city
-- exist, and row-level security resolves to `trip_id` without ever consulting
-- `city_id` — so a member of trip A could file one of their markers under a
-- city belonging to trip B, and every policy in the schema would agree it was
-- fine. Trip membership is the single authorization boundary in this product,
-- and that arrangement puts one row on two sides of it.
--
-- Verified empty before writing this: no existing marker references another
-- trip's city. Were that untrue the constraint below would refuse to be created
-- rather than silently accept the rows.

-- The target of a composite foreign key must itself be unique. `id` is already
-- the primary key, so this adds no real constraint on the data — it exists to
-- give the reference below something to point at.
alter table public.cities
  add constraint cities_id_trip_key unique (id, trip_id);

alter table public.markers
  drop constraint markers_city_id_fkey;

-- Note `set null (city_id)` rather than a bare `set null`.
--
-- A bare `on delete set null` nulls EVERY referencing column, which here means
-- `trip_id` as well — and `markers.trip_id` is `not null`. Deleting a city that
-- still held markers would therefore have failed outright, contradicting the
-- rule that removing a city unassigns its markers rather than throwing them
-- away. The column list, available since Postgres 15, is what keeps that rule
-- true; this database is 17.
alter table public.markers
  add constraint markers_city_id_fkey
    foreign key (city_id, trip_id)
    references public.cities (id, trip_id)
    on delete set null (city_id);

-- ---------------------------------------------------------------------------
-- A city declares its currency
-- ---------------------------------------------------------------------------
--
-- `price` has been a bare number since the schema was written, which is correct
-- for exactly one trip and wrong for the second.
--
-- The currency sits on the city rather than on the trip so that one trip can
-- cross a border — Japan and Korea in one wishlist — and on the city rather than
-- on each marker so that it is stated once instead of on all sixty places.
--
-- Nullable, and deliberately left null here. A marker whose city declares no
-- currency shows a bare amount: no currency is assumed and none is inherited
-- from anywhere else, because a price shown in the wrong currency is worse than
-- a price shown in none — it looks correct.
--
-- An ISO 4217 alphabetic code. The check is shape only; validating against the
-- real list would mean carrying that list in a migration and revising it by
-- migration whenever it changed.
alter table public.cities
  add column currency text check (currency ~ '^[A-Z]{3}$');
