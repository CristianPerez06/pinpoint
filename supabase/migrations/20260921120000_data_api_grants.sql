-- ---------------------------------------------------------------------------
-- The applications are allowed to address the tables.
--
-- Row-level security decides which rows an account may see. It does not decide
-- whether the account may address the table at all — that is a separate
-- privilege, granted per role — and until this migration no file in this
-- repository granted one. All five tables were protected and reachable by
-- nobody.
--
-- The hosted database did not notice, because it was created while Supabase
-- still granted every new table in `public` to `authenticated` automatically.
-- That grant is real and it is still there; it just exists in one database and
-- in no file, which is the same as not being written down. Replaying these
-- migrations into an empty database produced something no application could
-- read: `permission denied for table trips`, on the first query.
--
-- Supabase stopped issuing that grant for tables created from 30 October 2026.
-- Nothing already in the hosted database loses anything — the change governs
-- objects created after it — so there is no deadline and nothing breaks for
-- anyone using the product. What it means is that the next table added by a
-- migration is reachable by nobody until something grants it, in the hosted
-- database as well as on a laptop.
--
-- Running this against the hosted database asks for privileges it already
-- holds, which changes nothing. Everywhere else it is the fix.
--
-- There is deliberately no `alter default privileges` here. A standing rule
-- covering tables not yet created is the exact mechanism that produced this:
-- a fact about what the database permits, living in the database and in no
-- file. It would also invert the failure. Today a table whose migration forgot
-- its grant is unreachable — loud, immediate, and safe. Under a default, a
-- table whose migration forgot `enable row level security` would be readable in
-- full by every signed-in account from the moment it existed, which is the
-- failure this schema is built to make impossible. `pnpm check:tables` enforces
-- the per-table form.
-- ---------------------------------------------------------------------------

-- Each grant names exactly the operations that table has policies for, so that
-- the grant reads as a summary of the table and a mismatched pair is visible.
-- Granting all four everywhere would be equally safe — a grant without a policy
-- permits nothing, the policy still refuses — but it would say a member may
-- delete a trip when nothing allows it, and the next reader would have to go
-- and check the policies to find out the grant meant nothing.

-- `select` and `update` only. Trips are created through public.create_trip(),
-- which runs as its definer and so needs nothing from the caller — that is why
-- there is no insert policy on this table and no insert privilege here. There
-- is no delete policy either: a trip is archived, not deleted.
grant select, update on public.trips to authenticated;

-- No delete: taking somebody off a trip is not built, and there is no policy
-- for it. Insert is the invitation path, added in
-- 20260821120000_create_trip_and_invite.sql.
grant select, insert, update on public.trip_members to authenticated;

grant select, insert, update, delete on public.cities to authenticated;
grant select, insert, update, delete on public.markers to authenticated;
grant select, insert, update, delete on public.marker_interest to authenticated;

-- ---------------------------------------------------------------------------
-- And `anon` is granted nothing, stated rather than left to be inferred.
--
-- Nothing in this product is readable without a session: every policy in the
-- schema is written `to authenticated`, and both applications establish a
-- session before they read anything. So the correct privilege for the
-- unauthenticated role is none.
--
-- Saying so costs five lines and answers a question the next reader would
-- otherwise have to decide was deliberate. Unmentioned and decided look
-- identical in a schema.
--
-- These are `revoke` rather than an absence because the hosted database was
-- created when Supabase granted `anon` alongside `authenticated`, so there the
-- absence has to be made true rather than merely described. On a database built
-- from these migrations they are no-ops.
-- ---------------------------------------------------------------------------

revoke all on public.trips from anon;
revoke all on public.trip_members from anon;
revoke all on public.cities from anon;
revoke all on public.markers from anon;
revoke all on public.marker_interest from anon;
