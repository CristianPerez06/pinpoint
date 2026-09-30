## Why

On the phone, signing out does not forget which trip was open. Signing back in — with the
same account or another — can land on that trip instead of the account's first one. Nothing
leaks today, because a trip the new account cannot see is ignored, but the phone is holding
on to something about the previous person after they asked it to let go (#234). It also
matters for #128, which will remember the chosen trip between launches: from then on,
forgetting it on sign-out is no longer optional, and today's code comments say it already
happens when it does not.

## What Changes

- Signing out on the phone forgets which trip was being viewed, at the same moment it
  already removes the kept trip copies and waiting changes.
- Signing in afterwards, with any account, opens that account's first trip.
- A downloaded map, and everything else about signing out, is unchanged.

Not being done: remembering the chosen trip between launches (#128), and anything on the
laptop, where this was not found.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `offline-use`: *Signing out removes what the phone kept about the person* also names
  which trip was being viewed.

## Impact

- `apps/mobile/lib/sign-out.ts`, `apps/mobile/lib/trip-choice.tsx`, and the two screens
  offering *Sign out* (`components/trip-workspace.tsx`, `components/trip-calendar.tsx`).
- The comment in `apps/mobile/app/_layout.tsx` claiming sign-out already clears the choice.
- No database, package or dependency changes.
