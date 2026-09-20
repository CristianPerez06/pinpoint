## Context

See `proposal.md` — Why. Four things shape the approach:

- **There is no dialog in this system and adding one is a design decision, not a
  component.** `ui.tsx` exports a `Button`, two fields, a `FormError` and one
  `overlayPanelClass`. `DESIGN.md` describes panels over the map, detour panels hung off
  the control that opened them, and sheets on the phone. A centred thing that takes the
  screen and demands an answer is not among them.
- **Both applications already swap a panel's face in place.** The laptop's trip bar moves
  between `root`, `rename`, `dates`, `people`, `create` and `archived`; the phone's trip
  sheet does the same through `openDetour`. A panel that changes what it shows without
  closing is the established pattern, not a new one.
- **There are seven platform confirmations, not the four `#50` lists.** Both currency
  changes (`city-bar.tsx`, `city-sheet.tsx`) and one in the phone's calendar
  (`trip-calendar.tsx`) are missing from the ticket.
- **`write-feedback` already requires what `#125` asks for**, and the phone already obeys
  it: its trip sheet takes a `problem` prop and draws the refusal inside itself. The
  laptop sends the same refusal to the note over the map, which the panel then covers.
  This is a requirement describing behaviour one application has and the other does not —
  the third time this pattern has turned up, after `#57` and `#178`.

## Goals / Non-Goals

**Goals:**

- One way the product asks a question, used by every act that destroys something.
- The two panels over the map get the dismissal and focus contract the chrome's menus have.
- A refusal from a panel is readable without moving the panel.

**Non-Goals:**

- A dialog, a modal, or a second kind of sheet — see the first decision below.
- `#196`, a refused field answering in the validation library's voice.
- Changing any of the existing wording. It is careful and it survives unchanged.
- A new dependency. `#50` forbids one and the chosen shape needs none.

## Decisions

### The panel that offered the act asks the question, in place

Rejected: a centred dialog on the laptop and a second sheet on the phone. Three reasons,
in order of weight.

It would be **a second kind of layer over a product that already has three**, and the
person would have to learn when each appears. It would put a `Modal` **inside** the city
sheet, which is itself a `Modal` — the failure mode `AGENTS.md` describes twice over,
where nested presentation behaves in the simulator and not on a device. And it would need
a focus trap, a focus return, and an Escape handler that a panel we are already fixing for
`#62` will have anyway.

What it costs: a question that can be dismissed by pressing outside, where a modal could
not be. That is the safe direction — dismissal declines — and it is written into the
specification rather than left implicit.

### How much of the panel the question replaces depends on what the panel is showing

**The rule: what is being removed stays; whatever offers other acts goes.**

- *Removing a place*, from the details card: the card **is** the place, so it stays and
  only the footer swaps. `This cannot be undone.` fits above the buttons.
- *Removing a city*, or changing its currency, from the city panel: the body is a list of
  **other** cities, each with its own delete control. Leaving it up means other
  destructive controls stay live beneath a standing question, and the consequence — at its
  longest, `31 places will become unassigned. They are not deleted. 12 of them lose their
  JPY prices.` — has nowhere to go. So the panel takes a question face: the city's name as
  the heading, the consequence as the body, confirm and decline as the footer.

The second case is where the requirement *no second destructive act beside a question*
comes from. It is the one safety property a modal buys, obtained without one.

### The test is "destroys something entered", not "irreversible"

Changing a city's currency is reversible — set it back — but the prices stored in the old
currency are gone, and retyping twelve of them is real work. Archiving a trip is also
reversible and loses nothing, so it stays silent.

Stating the rule this way is what keeps the currency changes in scope and keeps archiving
out, and it is why the rule is written into `write-feedback` rather than left as a list of
sites. A list goes stale the first time somebody adds a write.

### Escape on a form with entered work asks, using the same question

`marker-capture` deliberately preserves everything typed and the position found on the
map through a rejected save, arguing that re-finding a spot is worse than retyping a name.
An Escape that discards silently throws away exactly that.

Rejected: *Escape does nothing while dirty* — it makes the panel one you cannot dismiss
without hunting, which is the trap `#62` exists to remove. Rejected: *Escape always
discards* — consistent, and it destroys the found position.

So Escape asks, with the same question face. This is why the two tickets belong in one
change: `#62`'s open question has no good answer until `#50`'s question exists.

### The write begins when the question is answered

`window.confirm` blocks and returns a boolean; a question drawn in a panel cannot. The
decision becomes asynchronous, which moves where the pending state lives: the control that
**confirms** says `Removing…`, not the control that offered the act.

The phone already lives with this and has a workaround for it — the pending state was
hoisted into the workspace because *"the write does not start when either of them is
pressed — it starts when the alert is answered"*, and removing a place is offered from two
different surfaces. With the question inside the surface that offered it, the confirming
control **is** the control, so the hoist comes out and `write-feedback`'s *pending state
belongs to the control* is satisfied rather than worked around.

### The refusal moves into the panel, copying the phone

No new mechanism: the laptop's `TripBar` already imports `FormError`, and the phone's
sheet already renders a `problem`. This is threading the existing refusal into the panel
instead of past it.

## Risks / Trade-offs

- **Seven sites across two applications is a lot of surface for one change.** → The rule
  and the shape are decided once and each site is a small edit. If it runs long, the
  currency pair is the natural thing to split out: it is the only one where the act is not
  a deletion.
- **A question that can be dismissed by pressing outside could be dismissed by accident.**
  → Dismissal declines and writes nothing, so the accident costs a repeated press. The
  alternative costs a modal.
- **The danger-tinted footer may be too loud for something seen often.** → It is the
  cheapest thing to change once it is on screen, and the validation tasks look at it
  deliberately rather than in passing.
- **Focus moving into a panel opened from a map pin is new behaviour on the laptop**, and
  the only `.focus()` call in the application today is the `Menu`'s. → `#62` requires it,
  and the `Menu` primitive already carries the return-focus logic to copy — including its
  note about using `pointerdown` rather than `click`, which matters twice over for panels
  that sit *on* the map.
