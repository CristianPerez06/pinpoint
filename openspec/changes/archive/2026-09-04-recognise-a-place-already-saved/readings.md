# Readings

## What was verified, and how

**Everything the repository can check itself.** `pnpm verify` — the full CI set — passes:
lint and typecheck on both applications, typecheck on all seven packages, the package
tests, the production web build, tokens, fonts, RLS, the dependency graph, and
`openspec validate --all --strict`.

**The match rule, by test.** Eight new cases in `packages/map/src/marker-view.test.ts`,
including the two that would fail first if the rule ever drifted:

- a position ten metres from a saved marker matches nothing — the near-miss `#83` names
- `markersAt` and `groupCoincident` return the **same key** for the same markers, asserted
  as one comparison rather than as two tests each stating its own answer, and again at
  `-0`. This is the invariant both cards depend on to open at all.

**That the web application starts and serves.** `pnpm dev` boots, `/` answers 200, the
sign-in page renders.

## What was NOT verified, and why

**Sections 1 and 5 of `tasks.md` are not done.** Both require an authenticated session
against the live Supabase project with real trip data — an account, a trip with saved
markers, and a filter to narrow it. That was not available, and no attempt was made to
obtain credentials.

Nothing in those sections was ticked. They are the tasks this change most needs, because
its whole shape is behaviour that type-checks and renders whether or not it is right:

- **The camera on the web, on both branches.** The move was lifted out of `beginCreate`
  precisely because a diverted branch would lose it silently. Nothing here can report that
  it did not.
- **The filtered case.** A card over a place with no pin under it is a screen nobody has
  seen. The note's wording, and whether the empty map behind it reads as deliberate, are
  open questions in `design.md` for that reason.
- **The phone's camera inset on the match branch.** `flyTo` is now called without
  `openingHeight(windowHeight)` on that branch, on the reasoning that a details sheet is
  not the form and does not cover the same amount. That reasoning is untested. If the
  place lands too low behind the sheet, this is the line to change.
- **Both themes.** No screen was looked at on either ground.

The readings section 1 asks for — the coordinates of a saved marker against the candidate
for the same place — were not taken. The premise they were meant to confirm (that a
marker saved from search holds the geocoder's exact numbers) is argued from the code and
is *not* an observation.


## Verified in the running applications

**Web — confirmed by the author.** The premise (a marker saved from search holds the
geocoder's exact coordinates, so the second search matches it), the reported repro, the
camera on both branches of the search path, a place saved on another trip, a place saved
nowhere, a near-miss a few metres away, a match filed under another city, and the chooser
where two markers share a point.

**Two defects found by looking, both invisible to types and tests.**

1. *The filtered case, on the phone.* The note alone was not enough: camera centred on the
   place, sheet over the lower half, nothing else on screen, and it read as the map having
   failed. Fixed by drawing the place while its card is open. `marker-filtering` reworded.
2. *The none-in-view offer, on the web.* An open card and "none of them in view" could not
   coexist before — a marker selected by pointing is necessarily in view — so the offer's
   condition never had to say more than that the drawn set was off screen. A pin drawn
   outside the drawn set broke that: the offer appeared beside the just-found place and
   `Show it` framed the filter's matches, a different place by name. Fixed by withholding
   the offer while a place is revealed; `anyInView` untouched, because it was not wrong.
   Confirmed fixed: the offer is gone beside a revealed place, and `Show it` works again
   once the card is dismissed. `map-rendering` gained the missing half.

## The phone, and a third defect

**The camera inset on the match branch, found by looking.** The branch was written to pass
no inset at all, on the argument that a details sheet is not the capture form and does not
cover as much of the map. On the phone the sheet sat squarely on top of the pin.

The numbers say the argument was wrong rather than imprecise: the form opens at **52%** of
the window (`DETENTS[0]`) and the details sheet is capped at **50%** (`SHEET_CAP`). At the
sizes that matter they are the same thing, and the distinction the reasoning rested on does
not exist. `marker-details.tsx` now exports its own `openingHeight` the way the form does,
and each branch asks the sheet that is actually about to open.

It answers with the **cap** rather than the height the sheet will take — it sizes to its
content, which is not known before it mounts. A place therefore sometimes sits higher than
it needed to. That is the recoverable direction; behind the sheet is not.

**Everything else on the phone was then confirmed by the author**: the revealed pin appears
under the sheet and goes when it is dismissed, it frames nothing and is counted nowhere, a
removed marker does not open a sheet on a place that is gone, and both themes are correct.

## What this change cost to get right

Three defects reached the running application. All three type-checked, rendered, and were
wrong; none was reachable by any test this repository can run.

1. The note alone over an empty map, on the phone.
2. The none-in-view offer standing beside a just-found place and leading away from it.
3. The camera inset, argued from a premise that two measured constants contradict.

The first two came from the same root: an invariant that held by coincidence until a pin
could be drawn outside the filtered set. A marker selected by pointing is necessarily on
screen, so "a description is open" and "nothing is in view" had never been able to occur
together, and two separate pieces of code quietly depended on that.

The standing lesson in the project context — budget for looking, not just for building —
held again, and the tasks that meant looking are the ones that found everything.
