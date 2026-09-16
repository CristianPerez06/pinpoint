-- ---------------------------------------------------------------------------
-- Probes for the trip-calendar migration. Run AFTER `pnpm db:push`.
--
-- Each block does real work, reports through an error message, and rolls back
-- everything it touched — which is how a claim about the database becomes an
-- observation instead of an assumption. Nothing here leaves a row behind.
--
-- Run them in the Supabase SQL editor, one block at a time. Every block is
-- expected to raise; read the `RESULT:` line it raises with.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 1. The date columns, and the ordering constraint. (task 1.1)
--
-- Expected: accepted=t reversed_refused=t start_only=t end_only=t
-- ---------------------------------------------------------------------------
do $$
declare
  accepted        boolean := false;
  reversed_refused boolean := false;
  start_only      boolean := false;
  end_only        boolean := false;
  t               uuid;
begin
  insert into public.trips (name, starts_on, ends_on)
  values ('probe ordered', '2026-04-01', '2026-04-14')
  returning id into t;
  accepted := true;

  begin
    insert into public.trips (name, starts_on, ends_on)
    values ('probe reversed', '2026-04-14', '2026-04-01');
  exception when check_violation then
    reversed_refused := true;
  end;

  insert into public.trips (name, starts_on) values ('probe start only', '2026-04-01');
  start_only := true;

  insert into public.trips (name, ends_on) values ('probe end only', '2026-04-14');
  end_only := true;

  raise exception 'RESULT: accepted=% reversed_refused=% start_only=% end_only=%',
    accepted, reversed_refused, start_only, end_only;
end $$;


-- ---------------------------------------------------------------------------
-- 2. A marker's day is not bounded by its trip's. (task 1.1)
--
-- Expected: before=t after=t none=t
--
-- The trip's dates say roughly when it is and are not a boundary. Refusing a
-- day either side would mean shifting a trip silently invalidated decisions
-- that were already correct.
-- ---------------------------------------------------------------------------
do $$
declare
  t      uuid;
  before boolean := false;
  after_ boolean := false;
  none   boolean := false;
begin
  insert into public.trips (name, starts_on, ends_on)
  values ('probe marker days', '2026-04-01', '2026-04-14')
  returning id into t;

  insert into public.markers (trip_id, name, lng, lat, planned_on)
  values (t, 'before the trip', 135.0, 35.0, '2026-03-30');
  before := true;

  insert into public.markers (trip_id, name, lng, lat, planned_on)
  values (t, 'after the trip', 135.0, 35.0, '2026-04-20');
  after_ := true;

  insert into public.markers (trip_id, name, lng, lat)
  values (t, 'no day at all', 135.0, 35.0);
  none := true;

  raise exception 'RESULT: before=% after=% none=%', before, after_, none;
end $$;


-- ---------------------------------------------------------------------------
-- 3. Changing a day bumps the version, so a date change is subject to the same
--    stale-read refusal as any other edit. (task 1.1)
--
-- Expected: bumped=t
-- ---------------------------------------------------------------------------
do $$
declare
  t      uuid;
  m      uuid;
  was    timestamptz;
  now_   timestamptz;
begin
  insert into public.trips (name) values ('probe version') returning id into t;
  insert into public.markers (trip_id, name, lng, lat)
  values (t, 'somewhere', 135.0, 35.0)
  returning id, updated_at into m, was;

  perform pg_sleep(0.01);
  update public.markers set planned_on = '2026-04-03' where id = m;
  select updated_at into now_ from public.markers where id = m;

  raise exception 'RESULT: bumped=%', now_ > was;
end $$;


-- ---------------------------------------------------------------------------
-- 4. `create_trip` carries the dates, and is the only signature left. (task 1.2)
--
-- Expected: signatures=1 args=4
--
-- One row, not two. `create or replace` with a differing parameter list would
-- have left the old two-argument function beside the new one, and `rpc()` would
-- have had two candidates.
-- ---------------------------------------------------------------------------
select count(*)                             as signatures,
       max(pronargs)                        as args,
       pg_get_function_identity_arguments(oid) as identity
  from pg_proc
 where pronamespace = 'public'::regnamespace
   and proname = 'create_trip'
 group by oid;


-- ---------------------------------------------------------------------------
-- 5. The grant survived the drop. (task 1.2)
--
-- Expected: one row, has_execute=t
-- ---------------------------------------------------------------------------
select has_function_privilege(
         'authenticated',
         'public.create_trip(text, text, date, date)',
         'execute'
       ) as has_execute;


-- ---------------------------------------------------------------------------
-- 6. A non-member still reads nothing, dates or no dates. (task 1.3)
--
-- Expected: policies_intact=t — every policy on both tables still resolves to
-- membership, and no policy mentions the new columns.
--
-- Row-level security in Postgres is per row, not per column, so adding a column
-- widens nothing. This is what turns that from a claim into an observation.
-- ---------------------------------------------------------------------------
select tablename,
       policyname,
       cmd,
       qual::text  as using_clause,
       with_check::text
  from pg_policies
 where schemaname = 'public'
   and tablename in ('trips', 'markers')
 order by tablename, policyname;
