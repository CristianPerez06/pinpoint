## 1. Settle what the mock left open

- [x] 1.1 Build and open the mock: `python3 openspec/changes/web-app-shell/mock/build-mock.py && open openspec/changes/web-app-shell/mock/pinpoint-app-shell-mock.html`
- [x] 1.2 Pick the placeholder block's fill from section 04 — `--pp-line`, `--pp-surface-sunk`, or `ink-faint` at 50%. Record the choice in `design.md` under Open Questions and strike the question
- [x] 1.3 Decide whether the account slot carries a placeholder at a laptop width. Record it the same way

## 2. The independent defect, fixed first

- [x] 2.1 Give `.full` in `app/page.module.css` what `.boundary` already has: `display: flex`, `align-items: center`, `justify-content: center`
- [x] 2.2 Give `.centred` `display: flex` so it passes on the height it takes from `.shell`, keeping `position: relative` — panels are absolutely placed inside it
- [x] 2.3 Look at all four states that route through these — loading, failed, empty, `TripSetup` — and confirm each occupies the screen rather than banding the top of it. This is the whole of the original bug and it is verifiable before any of the shell exists

## 3. The inert vocabulary

- [x] 3.1 Correct DESIGN.md's `clear-inert` token block from `{colors.ink-faint}` to `{colors.ink-muted}`, matching its own prose, the shipped `filter-bar.module.css`, and `styling`'s contrast floor
- [x] 3.2 Add the inert styling to `trip-workspace.module.css`: fill and weight carry the state as well as colour, text is `ink-muted`, and the cursor does not promise a press
- [x] 3.3 Add the drawn placeholder block, at the fill chosen in 1.2

## 4. One chrome that draws both states

- [x] 4.1 Lift the `<header>` and the `.tools` span out of `trip-workspace.tsx` into a chrome component that takes its names and its handlers as props and renders the same elements whether or not they are present
- [x] 4.2 Keep `<header>` a **sibling** of `<main>`, never inside it — a nested `<header>` exposes no `banner` landmark, and `page.tsx` carries the comment recording it
- [x] 4.3 Render each control inert when it cannot act: `aria-disabled="true"`, a no-op handler, inert styling, and **not** the `disabled` attribute. Cover all six — including search and drop, which need no data and still cannot complete
- [x] 4.4 Stand a drawn placeholder where each unread name goes, and none where the width already replaces the name with something static
- [x] 4.5 Have `app/loading.tsx` render that same chrome with no data, so the waiting state and the loaded state are one definition

## 5. The map's own wait

- [x] 5.1 Draw the waiting area on `--pp-map-land` rather than `surface-muted`, so the hole is map-shaped before the map arrives
- [x] 5.2 Confirm the spinner is DESIGN.md's: 20px, 2px hairline ring with a Signal Amber top edge, 0.8s linear
- [x] 5.3 Keep the words as well as the motion — an animation alone is indistinguishable from a stalled one

## 6. Look at it, because none of the above proves anything

- [x] 6.1 Run the app and load the workspace cold. The chrome is there before the map, inert, and nothing in it moves when the data lands
- [x] 6.2 Repeat at a phone width and confirm the tools stand on the bottom edge throughout, not only after the data arrives
- [x] 6.3 Repeat in **both** themes. The dark ground is where the header and the map area sit closest in value
- [x] 6.4 Throttle the network so the waiting state is on screen long enough to actually inspect, rather than inferring it from a frame
- [x] 6.5 Tab through the waiting chrome: every control is reachable, each reports itself unavailable, and none of them does anything when activated
- [x] 6.6 Inspect the accessibility tree and confirm the `banner` landmark still exists. Reading the JSX does not establish this
- [x] 6.7 Check the placeholder against a short trip name and a long one, and confirm nothing right of the names moves. If something does, it is the truncation defect in section 7, not this change

## 7. Hand off what is not ours

- [x] 7.1 Reproduce the laptop bar's truncation defect in the running app — **it does not reproduce.** With a 37-character trip name and a 23-character city at 1600px the name truncates at its declared `12ch` and there is 301px of clearance between the filter and the account; the bar does not overflow and nothing is drawn off screen
- [x] 7.2 **Nothing to file.** The defect was an artefact of the mock, whose `.name` sized itself to its text where the real one is pinned to `12ch` with `text-overflow: ellipsis`. Recorded in `mock/README.md` rather than raised as an issue
- [x] 7.3 Recorded rather than closed — moved to `openspec/ROADMAP.md` under Loose ends, since it outlives this change. Still unchecked: the same names at ~760px, just above the phone breakpoint. The measurement there came back self-inconsistent (search reported 505px against its own 480px cap) and the browser connection dropped before it could be repeated — so it is neither confirmed nor cleared

## 8. Close out

- [x] 8.0 Remove the `TEMP-LOOK` switches from `app/page.tsx` — the artificial delay and the `look=empty` / `look=failed` branches added to make the waiting and error states observable
- [x] 8.1 `pnpm lint`, `pnpm typecheck`, `pnpm build` — necessary, and on this surface historically not sufficient
- [x] 8.2 Record in `mock/README.md` anything section 6 found that the mock did not
- [x] 8.3 Update `openspec/ROADMAP.md` if this closes or opens a loose end
