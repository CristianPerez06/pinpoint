-- Trips, the people on them, and the places they save.
--
-- Every table here has row-level security enabled in this same migration, and
-- every policy resolves to trip membership. A table without RLS is readable in
-- full by anyone holding the publishable key, which is embedded in both shipped
-- client bundles — so "enable it later" is the same as "ship it open".

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.trips (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

-- A member is a person on a trip. A user is an authenticated account.
--
-- `user_id` is nullable on purpose: a member exists before the person signs up,
-- and everything attributed to that person points here rather than at the
-- account. When the account arrives, this one column is filled in and no
-- attributed row changes.
--
-- `email` is the claim key — it is how a brand-new account finds the member row
-- that was seeded for it. See public.claim_trip_memberships() below.
create table public.trip_members (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  email        text not null check (position('@' in email) > 1),
  user_id      uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create unique index trip_members_trip_email_key
  on public.trip_members (trip_id, lower(email));

create unique index trip_members_trip_user_key
  on public.trip_members (trip_id, user_id)
  where user_id is not null;

-- Cities belong to one trip and are never shared between trips. Two trips
-- visiting Kyoto get two rows; the duplicated name costs nothing and avoids
-- renames that reach across trips.
create table public.cities (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create unique index cities_trip_name_key
  on public.cities (trip_id, lower(name));

-- `type` is deliberately unconstrained text. The list of marker types lives in
-- @pinpoint/core and is validated on write by the shared schema, so adding a
-- type is a one-line code edit rather than a migration. The default is the
-- fallback type, so no marker can end up unrenderable.
--
-- `city_id` is null on delete rather than cascade: removing a city unassigns
-- its markers, it does not throw them away.
create table public.markers (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  city_id    uuid references public.cities (id) on delete set null,
  name       text not null check (char_length(name) between 1 and 200),
  note       text check (char_length(note) <= 2000),
  lng        double precision not null check (lng >= -180 and lng <= 180),
  lat        double precision not null check (lat >= -90 and lat <= 90),
  type       text not null default 'other',
  link       text check (char_length(link) <= 2000),
  price      numeric(10, 2) check (price >= 0),
  visited    boolean not null default false,
  created_at timestamptz not null default now()
);

create index markers_trip_id_idx on public.markers (trip_id);
create index markers_city_id_idx on public.markers (city_id);

-- Interest is per member. The absence of a row means undecided, which is a
-- different thing from a row saying `interested = false`.
--
-- `visited` is not here: it lives on the marker, shared by the whole trip,
-- because travelling companions visit a place together.
create table public.marker_interest (
  marker_id  uuid not null references public.markers (id) on delete cascade,
  member_id  uuid not null references public.trip_members (id) on delete cascade,
  interested boolean not null,
  updated_at timestamptz not null default now(),
  primary key (marker_id, member_id)
);

-- ---------------------------------------------------------------------------
-- Membership predicates
--
-- These are SECURITY DEFINER so they read trip_members with RLS bypassed.
-- Without that, the policy on trip_members would query trip_members and
-- recurse. Each is STABLE and sets an explicit search_path.
-- ---------------------------------------------------------------------------

create or replace function public.is_trip_member(target_trip uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.trip_members m
     where m.trip_id = target_trip
       and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_member_of_marker_trip(target_marker uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.markers mk
      join public.trip_members m on m.trip_id = mk.trip_id
     where mk.id = target_marker
       and m.user_id = auth.uid()
  );
$$;

-- Is this member row the caller's own? Used to stop one traveller recording
-- interest on the other's behalf.
create or replace function public.is_own_member(target_member uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.trip_members m
     where m.id = target_member
       and m.user_id = auth.uid()
  );
$$;

-- Link the caller's account to every unclaimed member row seeded for their
-- email address. Called once, right after sign-up.
--
-- SECURITY DEFINER because the caller is not yet a member of anything, so no
-- membership policy can let them reach the row. The email match is the
-- authorization: the account proves the address, the seeded row names it.
create or replace function public.claim_trip_memberships()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed integer;
  caller_email text;
begin
  if auth.uid() is null then
    return 0;
  end if;

  caller_email := auth.jwt() ->> 'email';
  if caller_email is null or caller_email = '' then
    return 0;
  end if;

  update public.trip_members m
     set user_id = auth.uid()
   where m.user_id is null
     and lower(m.email) = lower(caller_email);

  get diagnostics claimed = row_count;
  return claimed;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.trips           enable row level security;
alter table public.trip_members    enable row level security;
alter table public.cities          enable row level security;
alter table public.markers         enable row level security;
alter table public.marker_interest enable row level security;

-- trips ---------------------------------------------------------------------
--
-- No insert or delete policy: nothing in the product creates or removes a trip
-- yet, and an insert policy cannot resolve to membership for a trip that has no
-- members. Trips are seeded. When creating a trip becomes a real flow it needs
-- its own decision (most likely: insert allowed, with a trigger adding the
-- creator as the first member) rather than a policy loosened in passing.

create policy trips_select_member on public.trips
  for select to authenticated
  using (public.is_trip_member(id));

create policy trips_update_member on public.trips
  for update to authenticated
  using (public.is_trip_member(id))
  with check (public.is_trip_member(id));

-- trip_members --------------------------------------------------------------

create policy trip_members_select_member on public.trip_members
  for select to authenticated
  using (public.is_trip_member(trip_id));

-- A member may edit their own row (their display name). Claiming an unclaimed
-- row goes through claim_trip_memberships(), not through this policy.
create policy trip_members_update_own on public.trip_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- cities --------------------------------------------------------------------

create policy cities_select_member on public.cities
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy cities_insert_member on public.cities
  for insert to authenticated
  with check (public.is_trip_member(trip_id));

create policy cities_update_member on public.cities
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

create policy cities_delete_member on public.cities
  for delete to authenticated
  using (public.is_trip_member(trip_id));

-- markers -------------------------------------------------------------------

create policy markers_select_member on public.markers
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy markers_insert_member on public.markers
  for insert to authenticated
  with check (public.is_trip_member(trip_id));

create policy markers_update_member on public.markers
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

create policy markers_delete_member on public.markers
  for delete to authenticated
  using (public.is_trip_member(trip_id));

-- marker_interest -----------------------------------------------------------
--
-- Readable by everyone on the trip — seeing who wants to go is the point.
-- Writable only for your own member row.

create policy marker_interest_select_member on public.marker_interest
  for select to authenticated
  using (public.is_member_of_marker_trip(marker_id));

create policy marker_interest_insert_own on public.marker_interest
  for insert to authenticated
  with check (
    public.is_member_of_marker_trip(marker_id)
    and public.is_own_member(member_id)
  );

create policy marker_interest_update_own on public.marker_interest
  for update to authenticated
  using (public.is_own_member(member_id))
  with check (public.is_own_member(member_id));

create policy marker_interest_delete_own on public.marker_interest
  for delete to authenticated
  using (public.is_own_member(member_id));
