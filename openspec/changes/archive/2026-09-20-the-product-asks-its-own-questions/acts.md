# Every act, and whether it asks

The rule from `write-feedback`: **ask before a write that destroys something a person
entered, or that cannot be got back.** Not "ask before anything irreversible" — the test
is what is lost, not whether the act has an inverse.

This is the list the rule was checked against. It is here so that the next person adding a
write has a worked example rather than a sentence.

## Asks

| Act | Where | What is lost |
| --- | --- | --- |
| Remove a place | `marker-details` (both), `trip-workspace`, `trip-calendar` | The place and everything recorded about it. Gone. |
| Remove a city | `city-bar`, `city-sheet` | The city. Its places survive but become unfiled, and any price in that city's currency goes with it. |
| Change a city's currency | `city-bar`, `city-sheet` | **The prices stored in the old currency.** The currency itself can be set back; those numbers cannot be recovered. |
| Discard a half-filled capture form | `marker-form` (both) | Everything typed **and the position found on the map**. `marker-capture` argues re-finding a spot is worse than retyping a name. |
| Remove a member | does not exist yet — `#51` | That person's membership and every interest they recorded. |

## Does not ask

| Act | Why not |
| --- | --- |
| Archive a trip | Reversible and loses nothing. The reason is already written at the control: it is the only way to remove a trip, so a confirmation would stand between a person and the one way out. |
| Restore a trip | Adds nothing back that was gone. |
| Record or withdraw interest | A toggle. Withdrawing removes a row, but the row holds one boolean and one press puts it back. |
| Mark a place visited or unvisited | The same toggle. |
| Rename a trip, a city or a place | The old name is replaced, not destroyed — and renaming *is* the act asked for. |
| Set or clear a trip's dates | Two values the person can retype, and clearing is the explicit act rather than a side effect of another one. |
| Edit a place | The act asked for. Saving a form is not a surprise. |
| Create anything | Nothing is lost by making something. |
| Sign out | Ruled on below. |

## The three cases `#50` left open

**Discarding a half-filled capture form — asks.** This is the strongest case in the list,
not the weakest: `marker-capture` deliberately preserves everything typed *and the found
position* through a rejected save, on the argument that re-finding a spot on a map is
worse than retyping a name. Discarding silently throws away exactly what that rule
protects. It is why `#62`'s question about Escape and `#50`'s question about confirming
are one question — see `design.md`.

**Signing out with a form open — asks, and it is the same question.** The loss is
identical to the one above, reached by a different door. It is asked by the form, not by
the account menu: the form is the surface holding the work, and the rule is that the
question is asked where the act would land.

**Removing a member (`#51`) — asks, and it needs a count.** It cascades that person's
recorded interest away, which is exactly the "consequence lands on records the person is
not looking at" case. It does not exist yet; this is recorded so that whoever builds it
inherits the verdict rather than deciding it again.

## What this changes about the code

Seven platform confirmations exist today — **three more than `#50` lists.** The ticket
names removing a place and removing a city on each platform. It misses both currency
changes, and the second place removal on the phone, in the calendar.

| | Laptop | Phone |
| --- | --- | --- |
| Remove a place | `marker-details.tsx` | `trip-workspace.tsx`, `trip-calendar.tsx` |
| Remove a city | `city-bar.tsx` | `city-sheet.tsx` |
| Change a currency | `city-bar.tsx` | `city-sheet.tsx` |

Two acts that should ask, ask nothing today: discarding a capture form, and signing out
with one open.
