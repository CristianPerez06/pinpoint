## Why

Open the account menu on the phone and it tells you who you are: a name, and the email
address underneath it. Open the same menu on the laptop and you get the name alone. If two
people share a laptop, the one question that menu exists to answer — *which account is
this?* — is the one it will not answer.

Neither application is disobeying anything. **No requirement anywhere says what the product
should show about who is signed in**, so each one decided for itself, and they decided
differently. That is the fourth time a behaviour nothing describes has let the two
applications drift apart (#57, #178, #125, now this), and the fourth time the phone turned
out to be the one in the right.

## What Changes

- **On the laptop, the open account menu shows the address under the name.** That is the
  whole of what a person sees change.
- **The trigger is untouched.** It shows the name at a laptop width and collapses to the
  menu glyph on a narrow screen, exactly as today. An address is thirteen characters
  answering a question nobody asked, and the comment already in the code saying so is
  right.
- **The phone is untouched.** It was already correct, and this change makes the
  specification say so rather than changing the phone to match a rule written from the
  laptop.
- **One requirement is added** saying what naming the signed-in person means, so the next
  surface that names them does not get a third answer.

**Not in this change:** the account menu's rows, the Settings screen, signing out, and
anything about `#49` or `#51`. The menu's contents are settled; only what it says about
the person is not.

### What this change is not fixing, and why

The ticket asks for something else as well: the label falls back to the literal word
`Account` when the signed-in account matches no member on the trip, and the ticket asks for
that fallback to name the account instead.

**That state cannot be reached.** A trip can only be read by an account that a member row on
it points at, so reading the trip and matching no member row are mutually exclusive.
Probed against a clean database rather than argued from the policies: a claimed member sees
the trip and finds their own row; an account with no row sees nothing at all; an invitation
that was never claimed sees nothing at all.

So there is no fallback to improve. It is left exactly as it is, and the reason is recorded
here so the next reader does not re-open it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-chrome`: gains one requirement stating that an application naming the
  signed-in person shows the address on the surface that opens, and not on the control
  that opens it. Nothing existing is rewritten — the placement and menu requirements
  govern where controls sit, not what they say about the person.

## Impact

- `apps/web/app/_components/account-menu.tsx` — the identity block gains a second line.
- `apps/web/app/_components/trip-workspace.tsx` and
  `apps/web/app/_components/trip-calendar.tsx` — both derive the name today, in two copies
  of one line. The address is already beside it on the client, so nothing new is read from
  the server.
- `apps/mobile/` — no change.
