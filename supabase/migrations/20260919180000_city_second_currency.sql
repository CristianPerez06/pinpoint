-- A city may carry a second currency, and its places a price in it (#186).
--
-- Every price stays in US dollars (#183). This adds a second, optional amount
-- beside it: the price as it was seen on a menu or at a ticket booth, in the
-- currency of the city the place is filed under. Nothing is converted, and
-- nothing that exists today changes — every new column starts null.

-- ---------------------------------------------------------------------------
-- The city's currency
-- ---------------------------------------------------------------------------
--
-- A three-letter code, or null for a city with none. The database checks the
-- shape only. Whether a code is a real currency is decided by the list the
-- applications offer, so retiring or adding one never needs a migration.
--
-- Never USD: every place already has a price in US dollars, and a second box
-- for the same currency would be two answers to one question.
alter table public.cities
  add column currency text;

alter table public.cities
  add constraint cities_currency_is_a_code
  check (currency is null or (currency ~ '^[A-Z]{3}$' and currency <> 'USD'));

-- ---------------------------------------------------------------------------
-- The place's local price, with the currency it was typed in
-- ---------------------------------------------------------------------------
--
-- The code is stored beside the amount rather than implied by the city. With
-- the amount alone, a form opened on a Tokyo place, refiled to Seoul and saved
-- with the old number would write 3800 into a won city, and nothing could tell
-- that it had been yen. With the code beside it, a mismatch is detectable, and
-- the trigger below clears it.
--
-- Greater than zero: a place whose only cost is 0 in any currency is free, and
-- free is `price = 0` (#183). There is no `JPY 0`.
alter table public.markers
  add column local_price numeric(10, 2),
  add column local_currency text;

alter table public.markers
  add constraint markers_local_price_is_positive
  check (local_price is null or local_price > 0);

alter table public.markers
  add constraint markers_local_price_has_a_currency
  check ((local_price is null) = (local_currency is null));

-- ---------------------------------------------------------------------------
-- A local price only ever sits under its own currency
-- ---------------------------------------------------------------------------
--
-- Cleared rather than refused, because two of the paths that reach this cannot
-- be refused: removing a city arrives here through the foreign key's
-- `on delete set null (city_id)`, and changing a city's currency arrives
-- through the trigger on `cities` below. A client write that mismatches is a
-- stale form, and that save is already refused by `updated_at`.
--
-- `security definer` so the city's currency is read as it is, whatever the
-- caller can see. It reads one column of the one city this row names, and only
-- ever decides this row.
create or replace function public.markers_local_price_fits_city()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  city_currency text;
begin
  if new.local_price is null and new.local_currency is null then
    return new;
  end if;

  if new.city_id is not null then
    select c.currency into city_currency
    from public.cities c
    where c.id = new.city_id;
  end if;

  if new.price = 0
    or city_currency is null
    or new.local_currency is distinct from city_currency
  then
    new.local_price := null;
    new.local_currency := null;
  end if;

  return new;
end;
$$;

create trigger markers_local_price_fits_city
  before insert or update on public.markers
  for each row
  execute function public.markers_local_price_fits_city();

-- Changing or removing a city's currency clears the local prices typed in the
-- old one. A yen amount is never relabelled as won.
--
-- Written as an update so it goes through the trigger above and through
-- `markers_touch_updated_at`: a form someone has open on one of those places is
-- told the place changed, rather than saving the old amount back.
create or replace function public.cities_currency_clears_local_prices()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.markers m
  set local_price = null, local_currency = null
  where m.city_id = new.id
    and m.local_currency is not null
    and m.local_currency is distinct from new.currency;

  return null;
end;
$$;

create trigger cities_currency_clears_local_prices
  after update of currency on public.cities
  for each row
  when (old.currency is distinct from new.currency)
  execute function public.cities_currency_clears_local_prices();

-- No policy changes: row-level security resolves through `trip_id` on both
-- tables, and new columns do not change who a row belongs to.
