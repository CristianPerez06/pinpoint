# Findings

Noticed while building this change. Not acted on; presented once it is archived.

## The web marker form and the phone's have drifted into two field lists

`MarkerFormValues` is declared separately in `apps/web/app/_components/marker-form.tsx`
and `apps/mobile/components/marker-form.tsx`. Adding the day meant editing one and
leaving the other, and nothing said so — both applications typecheck either way,
because `createMarker` takes `unknown`. What a person would notice: a field that
exists on one application and silently not on the other, which is the asymmetry the
specifications forbid, arriving by omission rather than by decision.

## A missing field on a write is invisible to the type system

`createMarker(client, input: unknown)` and `updateMarker(..., patch: unknown)` mean a
caller that forgets a required field fails at runtime, not at build. That is how
adding `plannedOn` broke every save on the phone, and it was a test rather than the
compiler that caught it. What a person would notice: nothing, until a save is refused
with a message about a field their form does not have.

## The trip's details panel never shows which city a place is filed under

`marker-details.tsx` shows the type, price, note, link, who wants to go and visited —
and now the day — but not the city. A place opened from the map cannot be checked for
whether it is filed where you meant, without opening the form.

## A place with a long note pushes Edit and Remove below the fold

Matching the details and edit cards to one height means a card whose content is
taller now scrolls inside itself — and the actions are at the bottom of that scroll.
Amerikamura's note is enough to do it. What a person would notice: opening a place
with a real note and finding no way to edit or remove it without scrolling the card,
where a shorter place shows both straight away. The fix is to pin the actions to the
bottom of the card so they stay while the content moves.
