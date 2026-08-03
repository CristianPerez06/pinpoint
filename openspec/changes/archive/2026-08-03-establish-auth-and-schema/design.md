## Context

The workspace skeleton stands: two applications, three packages, a cycle check, and a
`database.types.ts` placeholder waiting for a real schema. Nothing reads or writes data
yet, and nothing knows who the user is.

Two constraints shape everything below. The publishable key is embedded in both shipped
bundles, so the database's only real defence is row-level security — which means every
policy has to be correct on the day its table is created. And the shared-package
boundary is enforced by the build, so anything that touches cookies or secure storage
cannot live under `packages/`.

There is a working reference implementation of email-and-password authentication in a
sibling project of the author's, covering both a Next.js App Router web client and an
Expo client against the same Supabase project. The implementation is lifted from there
rather than designed from scratch; the decisions below record only where this change
deliberately diverges from it.

## Goals / Non-Goals

**Goals:**

- A person can create an account, sign in on both applications, and stay signed in.
- Every table exists with row-level security enabled and policies resolving to trip
  membership, written once.
- Attribution of records to a person survives the arrival of real accounts without a
  data migration.
- Authentication logic that is not platform-specific lives in a package, per the
  standing preference for shared packages over per-app duplication.
- End-to-end proof: a signed-in person on either platform sees the trips they belong to,
  filtered by the database rather than by application code.

**Non-Goals:**

- The map. Nothing in this change renders a map or a marker.
- Creating, editing, or searching for markers. Tables exist; no interface writes to them.
- Email confirmation, password recovery, and password change.
- Any third-party identity provider.
- Realtime synchronisation between the two travellers.
- An invite flow, roles, permissions, profile screens, or account deletion.

## Decisions

### D1 — Authentication before the domain tables, in one change

The tables could have been created first and secured later. They are created together
with authentication instead, because a row-level security policy is written when its
table is created, and the "tighten the policies once auth lands" task is the one that
gets forgotten. Doing both at once means every policy is written once, against a real
authenticated user, and never in a permissive form.

The cost is a larger change, and a set of tables that no interface writes to yet. That
is accepted: the model was designed as a whole, and splitting it across changes would
mean re-deciding the same questions with less context.

### D2 — Email and password only, with email confirmation disabled

No third-party provider and no magic link. Both were considered and rejected: a provider
adds an external console to configure, and magic links require the platform to send
email.

Email confirmation is switched **off**, which is the divergence from the reference
implementation — that project confirms sign-up with a one-time code delivered by email.
Disabling it means this change sends no email at all, which matters because the built-in
mail service on the free plan is tightly rate-limited and documented as suitable for
development only. Turning confirmation on would mean either living with that limit or
signing up for a mail service, and the project's cost constraint treats a new metered
service as rejected by default.

This is safe here and would not be safe in general: sign-up is not public in any
meaningful sense — two people are expected to use this application, and both are known.
It is also the most reversible decision in this change. Turning confirmation on later is
a dashboard setting plus lifting the existing verification screens from the reference
implementation, and it does not touch the schema.

Password recovery is deferred for the same reason. With two users, a forgotten password
is resolved from the Supabase dashboard.

### D3 — A new `@pinpoint/auth` package holding the operations

Signing in is: validate the input, call the authentication service, interpret the
result. None of those steps is platform-specific — only *which client instance* is used
and *where the session is stored* are, and both already arrive as arguments to the
existing client factory.

So `packages/auth/` exports functions taking an already-constructed client plus the
input, and returning a discriminated result. The web application calls them from a
server action with its cookie-backed server client; the mobile application calls them
directly with its secure-storage-backed client. The package depends on `@pinpoint/core`
for the schemas and `@pinpoint/supabase` for the client type, and on no platform API —
so it stays inside the existing boundary rules and the cycle check.

The alternative — write the flows in each application, as the reference implementation
does — was rejected because it puts the interpretation of an authentication result in
two places, where the two will drift.

### D4 — Auth input schemas go in `@pinpoint/core`, using zod

The reference implementation keeps validation in a dedicated package using yup. This
repository already validates with zod in `@pinpoint/core`, and adding a second
validation library so that two schemas can be copied verbatim is a bad trade. The
schemas are rewritten in zod and placed alongside the existing domain schemas rather
than in a new package — four schemas do not justify a fourth package, and `core` is
already the place validation lives.

### D5 — Members are a table; users are a reference from it

`trip_members` carries the display name and a **nullable** reference to an account.
Everything attributed to a person points at a member, never at an account.

This is what makes the identity question separable from the authorization question. A
member row can exist before the person signs up; when they do, one row gains an account
reference and nothing that referenced them changes. Merging the two — attributing
records straight to accounts — would mean every attributed row has to be rewritten the
first time someone joins a trip before creating an account.

Policies therefore resolve through the member table: a row is visible when its trip has
a member whose account reference equals the requesting account.

### D6 — Marker type is a code-defined value, not a table

There is no `marker_types` table. The list lives in `@pinpoint/core` and the marker's
type is stored as text, validated on write by the shared schema.

The reason is that a type is a design decision, not data. It carries an icon and a
colour family, so a user-created type would need an icon picker, a colour choice, and
some way to stop the map turning into confetti. A map stops being readable somewhere
around eight distinguishable colours, and a user-extensible list has no ceiling.
Splitting the two visual channels — colour by family, icon by type — lets the list grow
without the map degrading, but only if the families stay fixed, which a table would not
guarantee.

Trade-off: referential integrity for the type value lives in application code rather
than in the database. With a bounded set, a fallback value, and shared validation on
every write, that is acceptable. A check constraint was considered and rejected because
it turns adding a type back into a migration, which is the exact friction this decision
removes.

### D7 — Cities belong to a trip and are never shared between trips

Two trips visiting Kyoto get two city rows. The duplicated name costs nothing, and the
alternative — a shared city referenced by many trips — introduces renaming that affects
other trips, orphaning on trip deletion, and a merge interface for the two spellings two
people will inevitably use.

Types are the opposite case and are global, because they are a design system rather than
trip data.

### D8 — Sign-up is web-only; mobile gets sign-in

Planning happens on a laptop and the mobile application is used during the trip, so an
account is created once, on web. Mobile implements sign-in, sign-out, and session
persistence — enough to prove that the shared package resolves and behaves identically
under Metro, which is the point of building it on both platforms at all.

### D9 — Migrations are files in the repository, not dashboard edits

`supabase/migrations/` becomes the source of truth for the schema, and
`packages/supabase/src/database.types.ts` is generated from it rather than hand-written.
The generation command is added to the root scripts, as the placeholder file's own
comment anticipates.

`supabase/` sits at the repository root. It is configuration and repository automation
rather than product code, so the no-code-at-the-root rule is not violated.

### D10 — What the change proves at the end

A signed-in person, on either platform, sees a list of the trips they are a member of,
read from the database. That is the smallest thing that exercises the whole stack —
sign-in, session persistence, membership, and a policy filtering rows — without building
any part of the map.

### D11 — Amendments made during implementation

Three things this design did not anticipate, recorded here rather than folded
silently into the tasks.

**A member row carries an email, and claiming goes through a function.** D5 said
a member row exists before the account and is linked afterwards, but not *how*
the account finds its row. It cannot be a policy: a brand-new account is not yet
a member of anything, so no membership policy can reach the row it needs to
claim. `trip_members.email` is the claim key, and
`claim_trip_memberships()` — `SECURITY DEFINER`, matching on the caller's
verified address — does the linking. The account proves the address; the seeded
row names it.

This also gives the eventual invite flow its shape: adding somebody to a trip is
inserting a member row with their email, whether or not they have an account.

**`trips` has no client insert or delete policy.** An insert policy cannot
resolve to membership for a trip that has no members yet, so requiring one on
every table is not satisfiable. Trips are seeded. When creating a trip becomes a
real flow it needs its own decision — most likely insert allowed with a trigger
adding the creator as first member — rather than a policy loosened in passing to
satisfy a checklist.

**`database.types.ts` was hand-written from the migration.** Generating it needs
a linked project, which did not exist while the apps were being built. The file
says so at the top. It is replaced by `pnpm db:types` output at the first
opportunity, and if the generator disagrees with it the generator is right.

## Risks / Trade-offs

- **Tables with no reader.** `cities`, `markers`, and `marker_interest` are created here
  and first written by a later change. If the model turns out wrong, the correction is a
  migration. Mitigated by the model having been worked through in detail first, and by
  the fields being few and independent.
- **Confirmation disabled means sign-up is open.** Anyone who finds the deployed web
  application can create an account. They will see nothing — an account without a
  membership sees no trips — but the account exists. Accepted while the application is
  unlisted and has two users; revisited if it is ever shared more widely.
- **Password recovery is a dashboard operation.** Fine for two users, and a support
  burden the moment there is a third.
- **Policy correctness is not enforced by a test.** Nothing fails if a future migration
  forgets to enable row-level security on a new table. A check for this is worth adding,
  and is noted below rather than built here.
- **The reference implementation targets a different validation library and a different
  auth flow.** Copying it is not mechanical; the divergences in D2 and D4 have to be
  applied deliberately rather than discovered during review.

## Open Questions

- Should a check that every table has row-level security enabled run in CI? It would
  have caught the failure mode this change is structured to avoid, and it gets more
  valuable as tables are added.
- Does the mobile application need the trips list at all in this change, or is proving
  session persistence enough? The list is what proves policies work under Metro's
  resolution, which argues for including it.
- `price` has no currency. One trip, one currency makes that fine; a second trip in a
  different country makes it wrong. Left as a plain number until that happens.
