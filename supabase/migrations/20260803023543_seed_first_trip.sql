-- The first trip and the people on it.
--
-- ===========================================================================
--  EDIT THE TWO EMAIL ADDRESSES BELOW BEFORE RUNNING `pnpm db:push`.
--
--  They are the claim keys. After sign-up, claim_trip_memberships() links an
--  account to the member row whose email matches the address it registered
--  with. A placeholder left here means sign-up succeeds and the person sees no
--  trips, which looks like a bug and is not one.
-- ===========================================================================
--
-- Member rows are seeded with `user_id` null on purpose: the people exist on
-- the trip before either of them has an account. Nothing else needs to change
-- when the accounts arrive.
--
-- Idempotent, so re-running against a database that already has this trip is
-- harmless.

insert into public.trips (name)
select 'Japan'
where not exists (select 1 from public.trips where name = 'Japan');

insert into public.trip_members (trip_id, display_name, email)
select t.id, v.display_name, v.email
  from public.trips t
 cross join (values
   ('Cristian', 'cristian.ap84@gmail.com'),
   ('Julieta',  'julieta.malacalza@gmail.com')
 ) as v (display_name, email)
 where t.name = 'Japan'
   and not exists (
     select 1
       from public.trip_members m
      where m.trip_id = t.id
        and lower(m.email) = lower(v.email)
   );
