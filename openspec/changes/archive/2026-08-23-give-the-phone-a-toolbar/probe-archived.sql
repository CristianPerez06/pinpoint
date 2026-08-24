-- Task 1.4 — does `trips_update_member` already cover `archived`?
--
-- Reasoning says yes: the policy is `for update to authenticated using
-- (is_trip_member(id)) with check (is_trip_member(id))` with no column list,
-- there are no column-level grants anywhere in the schema, and row-level
-- security in Postgres is per row rather than per column. Widening what
-- `tripPatchSchema` accepts should therefore have widened nothing in the
-- database.
--
-- AGENTS.md says not to settle that by reasoning. Run this instead: it does the
-- work, reports through an error message, and rolls back everything it touched.
--
--   pnpm db:login && pnpm db:link     # once, if not already linked
--   supabase db execute --file openspec/changes/2026-08-23-give-the-phone-a-toolbar/probe-archived.sql
--
-- Expect: RESULT: member=t archived=t nonmember=f restored=t
--
--   member      a member's update of `archived` is permitted
--   archived    the column actually changed
--   nonmember   somebody who is not a member cannot archive it
--   restored    un-archiving works through the same path
--
-- Nothing is committed. The exception is how the block reports, not a failure.

do $$
declare
  v_trip     uuid;
  v_member   uuid;
  v_outsider uuid;
  r_member    boolean := false;
  r_archived  boolean := false;
  r_nonmember boolean := false;
  r_restored  boolean := false;
begin
  select id into v_trip from public.trips order by created_at limit 1;
  if v_trip is null then
    raise exception 'RESULT: no trips to probe against';
  end if;

  select user_id into v_member
    from public.trip_members
   where trip_id = v_trip and user_id is not null
   limit 1;
  if v_member is null then
    raise exception 'RESULT: the first trip has no claimed member to act as';
  end if;

  -- Somebody with an account who is not on this trip. Skipped rather than
  -- faked if there is nobody: inventing an account would prove nothing.
  select tm.user_id into v_outsider
    from public.trip_members tm
   where tm.user_id is not null
     and not exists (
       select 1 from public.trip_members x
        where x.trip_id = v_trip and x.user_id = tm.user_id)
   limit 1;

  -- Act as the member.
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_member, 'role', 'authenticated')::text,
                     true);
  perform set_config('role', 'authenticated', true);

  update public.trips set archived = true where id = v_trip;
  r_member := found;
  select archived into r_archived from public.trips where id = v_trip;

  update public.trips set archived = false where id = v_trip;
  r_restored := found;

  -- Act as somebody who is not on the trip.
  if v_outsider is not null then
    perform set_config('request.jwt.claims',
                       json_build_object('sub', v_outsider, 'role', 'authenticated')::text,
                       true);
    update public.trips set archived = true where id = v_trip;
    r_nonmember := found;
  else
    raise notice 'no outsider available; the nonmember leg proves nothing';
  end if;

  raise exception 'RESULT: member=% archived=% nonmember=% restored=%',
    r_member, r_archived, r_nonmember, r_restored;
end $$;
