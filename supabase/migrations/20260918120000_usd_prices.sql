-- Every price is in US dollars, and cities no longer declare a currency (#175).
--
-- A price used to be read in the currency of the city its marker was filed
-- under. That is reversed: one fixed currency is simpler to enter and to read,
-- and a trip crossing a border is not worth an extra step on every city.
--
-- A free place is a price of 0. No column is added for it — 0 and free are one
-- value, and storing them twice would only give them a way to disagree.

-- ---------------------------------------------------------------------------
-- Every stored price is cleared
-- ---------------------------------------------------------------------------
--
-- Before the currency goes, because every amount here was typed in whatever
-- its city declared: 5000 under a city set to ARS would otherwise read as
-- USD 5000, and a price shown in the wrong currency looks correct. Zeros are
-- cleared too, so nothing turns into `Free` that nobody chose. Decided not to
-- keep a copy.
--
-- Left to fire `markers_touch_updated_at`. The price did change, so a form
-- somebody has open on one of these places is told so rather than saving the
-- old amount back over the clear.
update public.markers set price = null where price is not null;

-- ---------------------------------------------------------------------------
-- A city is only a name
-- ---------------------------------------------------------------------------
alter table public.cities drop column currency;
