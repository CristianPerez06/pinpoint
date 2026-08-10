-- Disposable seed data: one city and eighteen Kyoto markers.
--
-- ===========================================================================
--  THIS DATA IS NOT REAL TRIP DATA AND IS MEANT TO BE DELETED.
--
--  It exists so the `render-trip-map` change has something to draw — the
--  markers table was empty, so a correct map rendered nothing and there was
--  no way to tell a working map from a broken one.
--
--  The change that removes it is the write path (`openspec/ROADMAP.md`, step
--  "adding markers"): once places can be saved from the applications, delete
--  this city and its markers rather than editing them into real entries.
-- ===========================================================================
--
-- Coordinates are approximate to roughly a hundred metres and were NOT
-- geocoded. Do not treat them as a reference for anything.
--
-- The distribution is deliberately lopsided — fourteen `see` against one each
-- of `eat`, `buy` and `move`, plus a `sleep` — because a real wishlist is, and
-- an even spread would make the map look better than it will be. Several
-- markers sit within a kilometre downtown while others are five to nine
-- kilometres out, so the density is realistic rather than tidy.
--
-- Three markers share Kyoto Station's exact coordinates. That is the case a
-- geocoder produces when it answers with a building's centre point for the
-- places inside it, and it is what the coincident-marker requirement is
-- exercised against. Do not "fix" them by nudging the coordinates apart.
--
-- Idempotent, like the seed before it: re-running against a database that
-- already holds this data is harmless.

-- ---------------------------------------------------------------------------
-- The city
-- ---------------------------------------------------------------------------

insert into public.cities (trip_id, name)
select t.id, 'Kyoto'
  from public.trips t
 where t.name = 'Japan'
   and not exists (
     select 1
       from public.cities c
      where c.trip_id = t.id
        and lower(c.name) = 'kyoto'
   );

-- ---------------------------------------------------------------------------
-- The markers
--
-- Matched on (trip_id, name) rather than on coordinates, because three of them
-- deliberately share a position and matching on that would collapse them.
-- ---------------------------------------------------------------------------

insert into public.markers (trip_id, city_id, name, note, lng, lat, type, link, price)
select c.trip_id,
       c.id,
       v.name,
       v.note,
       v.lng,
       v.lat,
       v.type,
       v.link,
       v.price
  from public.cities c
  join public.trips t on t.id = c.trip_id
 cross join (values
   -- Downtown and the eastern hills, within a couple of kilometres.
   ('Nishiki Market',           'Covered market street. Go hungry.',        135.7649::double precision, 35.0050::double precision, 'market',     'https://www.kyoto-nishiki.or.jp/',            null::numeric),
   ('Pontocho Alley',           'Narrow lane along the river, best at dusk.', 135.7707::double precision, 35.0050::double precision, 'restaurant', null::text,                                    null::numeric),
   ('Gion / Hanamikoji',        null::text,                                 135.7752::double precision, 35.0036::double precision, 'attraction', null::text,                                    null::numeric),
   ('Yasaka Shrine',            'Free, open late.',                         135.7786::double precision, 35.0036::double precision, 'temple',     null::text,                                    0::numeric),
   ('Kyoto Imperial Palace',    'Grounds are a park; the palace needs a slot.', 135.7621::double precision, 35.0254::double precision, 'attraction', null::text,                                 0::numeric),
   ('Nijo Castle',              'Nightingale floors.',                      135.7481::double precision, 35.0142::double precision, 'castle',     null::text,                                 1300::numeric),
   ('Sanjusangen-do',           '1001 statues. No photographs inside.',     135.7717::double precision, 34.9879::double precision, 'temple',     null::text,                                  600::numeric),
   ('Kiyomizu-dera',            'Wooden stage over the hillside.',          135.7850::double precision, 34.9949::double precision, 'temple',     'https://www.kiyomizudera.or.jp/',            500::numeric),

   -- Five to nine kilometres out, in three different directions.
   ('Fushimi Inari Taisha',     'The torii gates. Early or late, never midday.', 135.7727::double precision, 34.9671::double precision, 'temple', 'https://inari.jp/',                            0::numeric),
   ('To-ji',                    'Tallest wooden pagoda in Japan.',          135.7476::double precision, 34.9812::double precision, 'temple',     null::text,                                  800::numeric),
   ('Kinkaku-ji',               'The golden pavilion. Very busy.',          135.7292::double precision, 35.0394::double precision, 'temple',     null::text,                                  500::numeric),
   ('Ryoan-ji',                 'The rock garden.',                         135.7182::double precision, 35.0345::double precision, 'temple',     null::text,                                  600::numeric),
   ('Ginkaku-ji',               null::text,                                 135.7982::double precision, 35.0270::double precision, 'temple',     null::text,                                  500::numeric),
   ('Philosopher''s Path',      'Walk it down from Ginkaku-ji.',            135.7947::double precision, 35.0270::double precision, 'park',       null::text,                                    0::numeric),
   ('Arashiyama Bamboo Grove',  'Furthest west. Half a day with the monkeys.', 135.6716::double precision, 35.0170::double precision, 'park',    null::text,                                    0::numeric),

   -- Three at one point. See the header: this is the geocoder case, not a bug.
   ('Kyoto Station',            'Where everything starts.',                 135.7588::double precision, 34.9858::double precision, 'station',    null::text,                                 null::numeric),
   ('Kyoto Tower',              'Observation deck across from the station.', 135.7588::double precision, 34.9858::double precision, 'attraction', null::text,                                 900::numeric),
   ('Hotel Granvia Kyoto',      'Inside the station building.',             135.7588::double precision, 34.9858::double precision, 'lodging',    null::text,                               22000::numeric)
 ) as v (name, note, lng, lat, type, link, price)
 where t.name = 'Japan'
   and lower(c.name) = 'kyoto'
   and not exists (
     select 1
       from public.markers m
      where m.trip_id = c.trip_id
        and m.name = v.name
   );
