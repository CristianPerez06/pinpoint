-- ---------------------------------------------------------------------------
-- Making a trip, and inviting somebody to it.
--
-- Until now the product could not gain a trip or a person. There was exactly
-- one trip, inserted by a migration, and its two members were inserted by the
-- same one — so the application had no way to reach a user who was not already
-- in the database.
--
-- The initial schema left this open deliberately and said why:
--
--   No insert or delete policy: nothing in the product creates or removes a
--   trip yet, and an insert policy cannot resolve to membership for a trip that
--   has no members. […] When creating a trip becomes a real flow it needs its
--   own decision (most likely: insert allowed, with a trigger adding the
--   creator as the first member) rather than a policy loosened in passing.
--
-- This is that decision, and it is not the trigger that comment guessed at.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- Creating a trip
--
-- WHY A FUNCTION AND NOT A POLICY
--
-- A trigger cannot do it. The creator's membership needs a display name, and a
-- trigger on `trips` sees the trip's own columns and `auth.jwt()` — a name the
-- person chose is in neither. Deriving one from the email's local part is how a
-- member list ends up reading `cristian.ap84`, which is a name nobody chose and
-- there is no later moment that asks.
--
-- Two client statements cannot do it either, and the reason is the one that
-- left this open in the first place. `insert into trips` needs a policy that
-- cannot resolve to membership, because the membership does not exist yet; and
-- the membership's own insert policy checks `is_trip_member(trip_id)`, which is
-- false until that insert has already happened. Even with both somehow written,
-- a failure between them leaves a trip with no members: unreachable by every
-- select policy in this schema, and impossible to remove, because there is no
-- delete policy either. An orphan nobody can see or clean up.
--
-- So both rows are written here, in one statement block, and `trips` gets no
-- insert policy at all. That is the difference between loosening a rule and
-- declining to state one: creation is expressible only through this function,
-- and "a trip always has at least one member" is therefore structural rather
-- than something every caller has to remember.
--
-- SECURITY DEFINER, with the same care as `claim_trip_memberships()`. The
-- account is taken from the verified session and never from an argument, so
-- there is nothing a caller can pass to create a trip as somebody else. An
-- explicit `search_path` keeps the body resolving to the tables it names.
-- ---------------------------------------------------------------------------

create or replace function public.create_trip(
  trip_name   text,
  member_name text
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

  -- The column constraints are the validation. Trimming here means a name of
  -- spaces is refused by the check rather than stored as whitespace.
  insert into public.trips (name)
  values (btrim(trip_name))
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

-- The function is the route in. Nothing else should be able to call it as a
-- bare table write, and `authenticated` is the only role the applications use.
revoke all on function public.create_trip(text, text) from public;
grant execute on function public.create_trip(text, text) to authenticated;


-- ---------------------------------------------------------------------------
-- Inviting somebody
--
-- An invitation is one row: a display name and an email address, with no
-- account attached. `claim_trip_memberships()` links it on the invited person's
-- next successful authentication — not only at sign-up — so being invited
-- before signing up and being invited long afterwards both work with no branch.
--
-- Nothing is sent. The address is the claim key, and delivery is out of band:
-- whoever invites tells them. That is a real limitation with a real failure
-- mode — a mistyped address produces an invitation nobody can claim, and two
-- screens that each look correct — which is why both applications now show
-- which members have not joined yet, and at what address. The database cannot
-- fix a typo; it can only make sure the person who can fix it is looking at it.
--
-- This policy does not recurse, and that is not luck: `is_trip_member` is
-- SECURITY DEFINER precisely so that a policy on `trip_members` can consult
-- `trip_members` without re-entering its own policy.
-- ---------------------------------------------------------------------------

create policy trip_members_insert_member on public.trip_members
  for insert to authenticated
  with check (public.is_trip_member(trip_id));

-- Note what is still absent, and deliberately.
--
-- `trips` has no insert policy: creation goes through create_trip() above.
--
-- Neither table has a delete policy. Removing a trip is settled as archiving
-- rather than deleting, and is a later change; removing a member would cascade
-- their recorded interest away, silently changing what the trip's filters match
-- for everybody else. Neither is a gap to be filled in passing.
