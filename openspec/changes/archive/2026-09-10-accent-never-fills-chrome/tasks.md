## 1. The change

- [x] 1.1 In `apps/web/app/_components/workspace-chrome.tsx`, change the drop control's tone
      from `dropping ? 'danger' : 'primary'` to `dropping ? 'danger' : 'default'`. This is
      the whole behavioural change; everything below is making sure it stays made.
- [x] 1.2 Confirm by reading that no other `tone="primary"` on web stands in the chrome —
      `grep -rn 'tone="primary"' apps/web/app` should return only commits inside forms and
      panels (`Save`, `Add to trip`, `Create city`, `Save place`, `Create trip`).

## 2. The arguments that are no longer where the decision lives

- [x] 2.1 Rewrite the comment above `[role='toolbar'] .primary, .default, .danger` in
      `apps/web/app/_components/ui.module.css`. Keep the rule — it is a guard against a
      regression this project has already made twice — but stop it arguing the phone's
      local case, and point it at the rule in DESIGN.md instead.
- [x] 2.2 Update the toolbar comment in `apps/mobile/components/trip-workspace.tsx` the same
      way. No code changes on mobile: it is the surface this converges on, and its comment
      should say that rather than re-arguing a phone-shaped case that is now general.
- [x] 2.3 Check `.drop`'s slot width comment in `trip-workspace.module.css` still describes
      what is there. The slot is sized to `+ Drop a pin`, and the label is unchanged — so
      this is a read, and an edit only if the comment mentions the fill.

## 3. DESIGN.md

- [x] 3.1 Add the rule to **Named Rules**, beside the Amber Pair Rule and the Converged-Pair
      Rule: the accent fills a control that commits an act inside a form or a panel, and
      never fills a control standing in the chrome at rest. State that arming, opening and
      narrowing are not committing.
- [x] 3.2 Add the matching **Don't**, and check the existing "Do reserve the raw `accent`
      for fills, the focus ring, and the pin halo" line still reads correctly beside the new
      rule — it now needs to say *which* fills.
- [x] 3.3 Check the **Navigation & Chrome** section's web-header bullet. It lists what the
      bar holds and should not imply one of the three tools is drawn more strongly.
- [x] 3.4 Write down *why*, not only *what*: the reason is that chrome is on screen at all
      times in a fixed place, so a fill there spends the pins' budget continuously. A rule
      without its reason is a rule the next change deletes.

## 4. Looking, which is where this change is actually validated

Nothing in this change is caught by a type-check: every rule involved is a colour on a
control that renders. The last two changes each shipped three defects that type-checked,
rendered, and were wrong.

- [x] 4.1 Open the web app at a laptop width on a trip with pins on screen, **light theme**.
      Judge the bar at rest: calm, or dead?

      **Pass**, confirmed by the author on a machine set to Light appearance, over a trip
      with pins on screen. The eye lands on the map; the bar is there when looked for and
      quiet when not. Drop and filter read as a deliberate matched pair rather than as two
      controls that lost something.

      Recorded because the route mattered: the agent's own light check got as far as the bar
      at 1460px and no further — the browser stopped rendering map tiles mid-session after
      repeated window resizing and did not recover across a fresh tab. That was an
      environment failure, not a defect, and the check was handed over rather than assumed.
- [x] 4.2 The same, **dark theme**. `.default`'s background is `--pp-surface`, which is the
      bar's own background, so every pill here is border-only on both themes — confirm that
      reads as consistent rather than as the drop control having lost something.
- [x] 4.3 Arm the map at a laptop width, both themes. The control now goes `default` →
      `danger` rather than `primary` → `danger`, a smaller jump at the moment the interface
      most needs to say the map is doing something unusual. Confirm the banner over the map
      is still carrying that message.
- [x] 4.4 Apply a filter, both themes. The filter's `.live` state is now the only amber fill
      in the bar — confirm it reads as a state rather than as the primary control.
- [x] 4.5 Open the web app below 700px, both themes. Nothing should have changed: `primary`
      and `default` already flatten identically inside `[role='toolbar']`. If anything moved,
      the tone swap was not as invisible as the design says and that is a finding.
- [x] 4.6 Open `apps/mobile` on a device or simulator, both themes, and confirm the two
      bottom bars now agree. This is the claim the change is named for; it should be checked
      rather than assumed.
- [x] 4.7 Look at the point — the 9px amber dot — in every one of the above. It is now the
      only amber in the chrome at rest. If it reads as a stray speck rather than as the
      mark, that is a `product-mark` question and a separate change, not a reason to put a
      fill back. Record what you saw either way.

      **Pass, and it reads as the mark.** Seen directly on the dark theme over thirty pins:
      the dot is small, distinct, and being the only amber in the chrome is what makes it
      read as identity rather than as a stray speck. The light side rests on 4.1's pass
      rather than on a separate look at the dot, which is stated rather than glossed.

## 5. The question held open on purpose

`+ Drop a pin` **keeps its `+`** — decided, not open. The `+` says what the control does
rather than emphasising it, and it makes no claim about weight, fill or size, so three tools
can be equals and still say different things. The label and the `.drop` slot are unchanged.

- [x] 5.1 Decide whether the bar wants any compensating weight, after 4.1 and 4.2 and not
      before. If it reads under-weighted, the fix is weight rather than colour — but the
      weight goes up on **all three tools together**. Raising `Drop` alone is forbidden by
      *the session's tools weigh the same at every width*: it is the same hierarchy the fill
      was asserting, bought more cheaply, and it looks like typography rather than like a
      claim, which is what makes it easy to do by accident. If you change nothing here,
      record that you looked and decided not to.

      **Looked, and changed nothing.** The bar did not read under-weighted in either theme,
      so no weight was raised on any tool. Recorded as a decision taken after looking rather
      than as a task that was skipped.

## 6. Checks

- [x] 6.1 `pnpm typecheck`, `pnpm typecheck:mobile`, `pnpm lint`, `pnpm lint:mobile`.
- [x] 6.2 `pnpm check:specs` and `openspec validate --changes accent-never-fills-chrome`.
- [x] 6.3 `pnpm verify`.
- [x] 6.4 Confirm `pnpm check:tokens` is unaffected — this change introduces no token value
      and should not regenerate anything.
