## 1. Somewhere for a write to live

- [x] 1.1 Add a workspace component between `index.tsx` and `TripMap`, owning the trip's
      markers, its interest records and the current filter
- [x] 1.2 ~~Seed that state from the queries when they first become ready~~ **Hold the
      overrides instead.** Seeding was the wrong shape and the React linter said so before
      anything ran: copying a query result into state inside an effect is the pattern React
      tells you not to write, and it carried the very hazard it was meant to avoid. What is
      held is a map of local visited values and a map of the reader's own answers, laid over
      the query result on the way out. Nothing is copied, so nothing can re-seed; a refetch
      is respected for free; and reverting drops the override, restoring what is stored
      rather than a snapshot. `design.md` records this.
- [x] 1.3 Read the trip's interest and members alongside its markers and cities, joining
      the existing queries rather than chaining a new one
- [x] 1.4 Resolve the reader's own member id, since every write is attributed to a member
      rather than an account, and null is ordinary — a member exists before the account

## 2. Recording, on the phone

- [x] 2.1 Add the per-member rows to the marker sheet — own row interactive, everybody
      else's read-only, undecided drawn as its own state rather than as an unfilled "not
      interested"
- [x] 2.2 Add the visited control to the sheet
- [x] 2.3 Write optimistically and revert on failure, reporting what went wrong
- [ ] 2.4 Confirm the sheet still sizes to its content with the rows added, and that a
      trip with several members does not push the actions off screen

## 3. Filtering, on the phone

- [x] 3.1 Add the filter control to the header, opening a sheet rather than taking a
      permanent row
- [x] 3.2 Build the picker in the sheet: the people on the trip as its entries, plus
      `Nobody has answered yet`, plus hiding visited — the same questions the laptop asks
- [x] 3.3 Apply the shared predicate to produce one filtered set and feed it to the map,
      so the two platforms cannot disagree about what a trip contains
- [x] 3.4 State in the header that the view is narrowed whenever it is, with clearing
      available from there — the requirement a sheet-based control is most likely to miss,
      because the choice is invisible once the sheet is dismissed
- [x] 3.5 Say "no places match this filter" when nothing matches, distinctly from the trip
      being empty — the mobile screen already distinguishes empty from failed, and this is
      a third state alongside them

## 4. The shared half, confirmed rather than assumed

- [ ] 4.1 Confirm `matchesFilter` selects identically on both platforms against the same
      trip and the same filter
- [x] 4.2 Confirm no file under `packages/` needed changing.
      **It held.** `git status packages/` is empty: `matchesFilter`, `recordInterest`,
      `withdrawInterest`, `setMarkerVisited`, `ownMemberOf` and `MarkerView`'s visited all
      worked unchanged under Metro. The claim both "web only" requirements were written on
      — that lifting them would be a change to one application rather than a
      reimplementation — is true for the reading half.

## 5. Checks, and looking

- [ ] 5.1 Record interest on the phone and confirm it appears on the laptop, and the
      reverse, without either being reloaded beyond re-reading the trip
- [ ] 5.2 Confirm withdrawing returns a marker to undecided and that it is
      indistinguishable from never having answered
- [ ] 5.3 Confirm no control is offered for changing another member's record
- [ ] 5.4 Mark a place visited on the phone and confirm the pin mutes there and on web
- [ ] 5.5 Work through the filter: one name, two names, `Nobody has answered yet`, and
      hiding visited — and confirm each selects what the laptop selects
- [ ] 5.6 Confirm a marker every member declined is reachable with the filter cleared
- [ ] 5.7 Filter to nothing and confirm the phone says so without claiming the trip is
      empty
- [ ] 5.8 Confirm the narrowed statement appears in the header and clears from there
- [ ] 5.9 Check both themes, and check the safe areas — the header gains a control and the
      sheet gains rows, and both sit against system furniture
- [ ] 5.10 Confirm a refused write reverts what is displayed rather than leaving the phone
      asserting something the database does not say
- [ ] 5.11 Run `pnpm lint`, `pnpm lint:mobile`, `pnpm typecheck`, `pnpm typecheck:mobile`,
      `pnpm test`, `pnpm build`, `pnpm check:cycles`, `pnpm check:tokens`,
      `pnpm check:fonts` and `pnpm check:specs`
- [ ] 5.12 Build and run the iOS application. **Not optional and not inferable from the
      JavaScript checks** — a stale native build crashes inside Hermes with no JavaScript
      error, which cost roughly a day once already
- [ ] 5.13 Run `openspec validate mobile-reads-what-web-writes --strict`
