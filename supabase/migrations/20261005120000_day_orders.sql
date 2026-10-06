-- ---------------------------------------------------------------------------
-- A day's places can be put in order.
--
-- Until now a day was a set of places listed by name. This gives each day of a
-- trip an order of its own: the one the people on the trip have dragged it into
-- in the calendar, which the map shows as numbered pins.
--
-- One row per (trip, day), holding that day's places as an ordered list of ids.
-- Not a column on `markers`, for two reasons that each decide it alone:
--
--   * A place planned for a run of days sits on every day of it, and has an
--     independent position on each. A hotel on the 3rd–6th is first on one day
--     and last on another; a single column cannot say that.
--
--   * Every update to a marker bumps `updated_at`, which is what refuses a save
--     made against a stale read. A position stored on the marker would make
--     every reorder invalidate whoever happens to be editing that place.
--
-- And a whole day is saved at once — one upsert of one row — which is what the
-- calendar does a second after the last change.
-- ---------------------------------------------------------------------------

create table public.day_orders (
  trip_id    uuid        not null references public.trips (id) on delete cascade,
  day        date        not null,
  -- No foreign key into `markers`: an array cannot carry one. Nothing depends
  -- on that. The applications order a day by these ids and ignore any that are
  -- not on the day, so an id left behind is harmless, and the trigger below
  -- removes them in the ordinary course of things.
  marker_ids uuid[]      not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (trip_id, day)
);

alter table public.day_orders enable row level security;

-- Membership, as every other table here. No delete policy: a day's row goes
-- with its trip, and an empty list is an ordinary state for a day to be in.
create policy day_orders_select_member on public.day_orders
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy day_orders_insert_member on public.day_orders
  for insert to authenticated
  with check (public.is_trip_member(trip_id));

create policy day_orders_update_member on public.day_orders
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- The grant is the other half of the pair (`pnpm check:tables`): policies say
-- which rows, the grant says whether the table can be addressed at all.
grant select, insert, update on public.day_orders to authenticated;
revoke all on public.day_orders from anon;

-- ---------------------------------------------------------------------------
-- Every day a place is planned for, as the applications read it.
--
-- `runOfDays` in `@pinpoint/core` is the other statement of this. The pair is
-- already held to the rules by `markers_planned_run_valid`, so this needs none
-- of the tolerance the reading side has.
-- ---------------------------------------------------------------------------
create function public.marker_run_days(planned_on date, planned_until date)
returns date[]
language sql
immutable
set search_path = public
as $$
  select coalesce(
    array_agg(day::date order by day),
    '{}'
  )
  from generate_series(
    planned_on,
    coalesce(planned_until, planned_on),
    interval '1 day'
  ) as day
  where planned_on is not null
$$;

-- ---------------------------------------------------------------------------
-- The database keeps every day's list complete.
--
-- A place that joins a day goes last on it; a place that leaves a day comes
-- off its list, which is what closes the gap. Done here rather than by the
-- applications for the reason `updated_at` is maintained here: it then holds
-- for every writer, including the place's own form, which knows nothing about
-- ordering and should not have to.
--
-- Runs as whoever saved the marker. They are a member of its trip — the marker
-- policies already established that — so the policies above admit the write.
-- ---------------------------------------------------------------------------
create function public.markers_keep_day_orders()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  left_trip   uuid;
  joined_trip uuid;
  left_days   date[] := '{}';
  joined_days date[] := '{}';
  each_day    date;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    left_trip := old.trip_id;
    left_days := public.marker_run_days(old.planned_on, old.planned_until);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    joined_trip := new.trip_id;
    joined_days := public.marker_run_days(new.planned_on, new.planned_until);
  end if;

  -- A day kept across the update is neither left nor joined: the place keeps
  -- its position there. Only when the trip itself is unchanged, though — the
  -- same date on another trip is another day.
  if tg_op = 'UPDATE' and left_trip = joined_trip then
    select coalesce(array_agg(d), '{}') into left_days
      from unnest(left_days) as d where d <> all (joined_days);
    select coalesce(array_agg(d), '{}') into joined_days
      from unnest(joined_days) as d
      where d <> all (public.marker_run_days(old.planned_on, old.planned_until));
  end if;

  foreach each_day in array left_days loop
    update public.day_orders
       set marker_ids = array_remove(marker_ids, old.id),
           updated_at = now()
     where trip_id = left_trip and day = each_day;
  end loop;

  -- Removed before appending, so a stale entry from a write this trigger never
  -- saw cannot leave the place listed twice.
  foreach each_day in array joined_days loop
    insert into public.day_orders (trip_id, day, marker_ids)
    values (joined_trip, each_day, array[new.id])
    on conflict (trip_id, day) do update
      set marker_ids = array_append(array_remove(day_orders.marker_ids, new.id), new.id),
          updated_at = now();
  end loop;

  return null;
end;
$$;

create trigger markers_keep_day_orders
  after insert or delete or update of planned_on, planned_until, trip_id
  on public.markers
  for each row
  execute function public.markers_keep_day_orders();

-- ---------------------------------------------------------------------------
-- Every day that already holds places starts with a list, in the order it was
-- shown in until now: by name, then by id.
--
-- `und-x-icu` is the root ICU collation, the closest Postgres has to the
-- `localeCompare` the applications sorted with. An unusual name may land a
-- place or two apart from where it was shown; it only affects the order a day
-- starts with, and every day can be dragged back.
-- ---------------------------------------------------------------------------
insert into public.day_orders (trip_id, day, marker_ids)
select m.trip_id,
       d.day,
       array_agg(m.id order by m.name collate "und-x-icu", m.id::text collate "C")
  from public.markers m
  cross join lateral unnest(public.marker_run_days(m.planned_on, m.planned_until)) as d (day)
 group by m.trip_id, d.day;
