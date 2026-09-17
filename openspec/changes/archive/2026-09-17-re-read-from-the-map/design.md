## Context

See `proposal.md` — *Why*. What matters here is the state of the two map screens.

Both applications already draw a control floating on the map's right edge: the zoom
pair. Both position it by **measuring what stands on that edge** rather than by guessing
a height — `cornerHeight + floor + creditHeight` plus a token on web, `lift + SPACE.md`
on the phone, where `lift` is the bar or the open form sheet. Both of those expressions
were got wrong at least once and corrected; the web comment records the version that put
the control off the document at every laptop width.

Both applications also already have the function this control needs:
`rereadEverything({ force: true })`, which reads all five lists and ignores the freshness
floor. On the phone it is wired to the menu row being removed. On the web it is wired to
the tab becoming visible and to nothing a person can press.

One thing is **not** in place on either platform. `useRows`' `refresh` (web) returns
`void` and discards `settled.status === 'failed'` deliberately — an unasked read has no
press to answer. `usePending` (phone) releases on both outcomes without distinguishing
them. So a re-read a person asked for cannot currently report that it failed, on either
platform, and `data-freshness` has required that it does since the requirement was
written — it exempts a read "a person asked for and is waiting on" from the silence rule
and hands it to `write-feedback`. The old placement is why nobody noticed: a row in a
menu that dismisses itself has nowhere to report anything.

## Goals / Non-Goals

**Goals:**

- One expression per platform for what stands on the map's bottom edge, still.
- The two controls on that edge are separate to a thumb and to the eye, and stay separate
  at every size either platform draws them at.
- A re-read somebody pressed says it is working and says when it failed, without making
  an unasked one say anything.

**Non-Goals:**

- No change to what is read, when it is read automatically, or to the freshness floor.
- No shared component. The two applications draw this from their own vocabularies, as
  they do the zoom control — `@pinpoint/map` declares no renderer and cannot hold a
  button.
- No new reporting surface. Each application reports a refused act somewhere already, and
  this uses it.

## Decisions

### One positioned container owns the edge; both controls are its children

The measured offset stays where it is and stops being about zoom. Each platform wraps the
re-read and the zoom group in a single absolutely-positioned element carrying the existing
`bottom` expression, laid out as a column, bottom-aligned, with a gap of `md` between its
two children.

Why: the alternative is a second `bottom` expression for the re-read, which would have to
clear the floor *and* the zoom group's height — and that height changes with the platform
(34px buttons on web, 44px on the phone) and with whether the zoom group is drawn at all.
Two expressions computing one edge is how the corrected web comment came to exist in the
first place. With a container, the gap is a token and the offset is measured once.

The container is laid out from the bottom up, so when the zoom group is absent the re-read
falls to where zoom would have been rather than floating above a gap.

### The re-read is shown and hidden by whatever already governs the zoom control

On the phone the zoom group yields to the marker sheet and to the capture form
(`formSheet === null && selection === null`); the re-read takes the same conditions. On
the web it is drawn whenever the map is; so is the re-read.

Why: they are the same kind of thing — instruments of the screen rather than acts on the
trip — and a sheet that covers that edge covers both. Giving the re-read its own condition
would mean two rules about one edge that can disagree, which is the defect the container
above is also avoiding. The cost is that the escape hatch is not reachable while a sheet
is open on the phone; dismissing the sheet is one press and is how every other control on
that edge comes back.

The phone's zoom group also waits for `currentZoom !== null`, which is readiness to
*zoom* and not readiness to read. The container is not gated on it; only the zoom group
inside it is.

### The web keeps one control at every width and hides it above the breakpoint in CSS

The control is rendered unconditionally and removed by the same 700px media query that
relocates the tools, rather than by asking in JavaScript how wide the window is.

Why: it is the idiom the bar already holds — one `<input>` exists at any width, relocated
by stylesheet — and it keeps the first paint out of the wrong shape while JavaScript
decides. `display: none` also takes the control out of the tab order and the accessibility
tree, which is what a control that does not exist at that width should do.

### `refresh` reports its outcome; the automatic trigger ignores it

`useRows`' `refresh` returns what it read rather than `void`, and `rereadEverything`
resolves to whether every list succeeded. The silence an unasked read owes stays silence
because **the caller** ignores the result — `useVisibleAgain(() => void rereadEverything())`
is unchanged — rather than because the hook threw the information away.

Why: the two triggers want different things from the same function, and the hook is the
wrong place to decide which. The current arrangement makes the quiet behaviour unavailable
to opt out of, which is why the requirement that a pressed re-read reports its failure has
been unmet since it was written. Moving the decision to the call site satisfies both
without a second code path doing the reads.

The phone reaches the same end from the other side: `rereadEverything` already returns the
settled results of five queries, so only the press has to look at them.

### The check is a grep scoped to the account menu, not to the web application

One script under `.github/scripts/`, added to `pnpm verify` as well as to the workflow,
failing if `apps/web/app/_components/account-menu.tsx` mentions a re-read.

Why that file and not the app: after this change the web *does* carry a re-read control,
on the map, so a check over the whole application would have to encode which file is
allowed one and would fail on the change that adds it. The defect being prevented is
specific — a row reappearing in that menu — and the file that held it is the honest scope.
It goes into `verify` as well as the workflow because `package.json`'s own
`comment:verify` says every new CI step does, and because the checks that answer in
milliseconds run first.

## Risks / Trade-offs

- **Two objects floating over the map is the arrangement both applications wrote off.**
  `trip-map.module.css` and `trip-map.tsx` each say, in nearly the same words, that two
  pills over open map read as debris rather than as chrome — a verdict reached by looking
  at a phone, and the reason the zoom pair is one object rather than two circles. This
  change makes the edge carry two. → Mitigated by the gap being a full `md` rather than a
  hairline, so the pair reads as two deliberate objects rather than one group with a seam,
  and by a task that looks at it on both grounds on a real device before the change is
  called done. If it reads as debris, the arrangement is what changes, not the number.

- **The separation and the tidiness pull in opposite directions.** A gap wide enough to
  stop a mis-aimed press is a gap wide enough to stop the two reading as related. → `md`
  is the starting number because it is the inset the edge already uses; the requirement
  states the property rather than the value, so the number can move without reopening the
  specification.

- **Reporting a failure touches the read path both applications share.** Changing
  `refresh`'s return type reaches every caller. → The change is additive — callers that
  ignore the value keep working — and the one behaviour that must not change, an unasked
  read staying silent, is asserted by leaving its call site untouched.

- **The phone loses its re-read while a sheet is open.** → Accepted. It is one press to
  dismiss, and the state the control exists for — a read that failed while offline — is
  not one somebody reaches while reading a place's details.

## Migration Plan

Nothing stored changes, so there is no migration and no rollback beyond reverting. Two
ordering notes:

- The phone's menu row and the phone's new control belong in the same commit. A commit
  with neither leaves the phone with no way to ask, which is the one thing the requirement
  being replaced was there to prevent.
- The check lands with the change rather than before it. Run against `main` today it
  passes, because #153 already removed the row; landing it early would assert a rule
  while the requirement it enforces is still being rewritten.
