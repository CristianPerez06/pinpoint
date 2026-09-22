'use client'

import { message, type Message } from '@pinpoint/wording'
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from 'react'

import { useSay } from '@/app/_components/language'

import styles from './ui.module.css'

/**
 * The controls the capture flow is built from.
 *
 * Web components, and they stay web components — the mobile application renders
 * its own from the same tokens and imports nothing from here, which is what the
 * `styling` spec requires. What is worth sharing is the logic, and none of it
 * is in a button.
 *
 * The styling itself moved out to `ui.module.css`. Nothing here writes a colour,
 * a size, or a radius: those are the generated custom properties, so a token
 * change repaints this without any of it being edited.
 */

/** A panel floating over the map. The details view and the form share it. */
export const overlayPanelClass = styles.panel

/**
 * Marks the part of a trigger's label that is *only* shown at a phone width.
 *
 * A class rather than a prop, and that is deliberate. Which spelling a trigger
 * uses is a question about the width of the screen, and a prop is answered once
 * when the component renders — so a prop would need the width in JavaScript,
 * which is a branch, a subscription and a first paint in the wrong shape, all
 * to choose between two glyphs. The cascade already knows the width.
 *
 * Carrying it here rather than at the call site is what lets `Menu` withhold the
 * caret from a trigger that has become an icon: the rule needs both classes in
 * one stylesheet, and CSS Modules scope them per file.
 */
export const iconOnlyLabelClass = styles.iconOnly

/**
 * The two halves of a control standing in the bar at the bottom as a tool: a
 * glyph, and beneath it one line of words.
 *
 * Exported for the same reason `iconOnlyLabelClass` is — the rules that shape a
 * tool are in this file, keyed on the bar's `role`, and CSS Modules scope class
 * names per file, so a call site cannot reach them without being handed the
 * name. Three controls wear these: `Search` and `Drop` in `workspace-chrome`,
 * and the filter's trigger, which had its own 22px glyph class and no label
 * class at all until it was the only tool in the row lettered at `control`
 * size.
 *
 * Named exports rather than letting a call site read another component's
 * stylesheet object, and the difference is not tidiness: a class that has moved
 * or been renamed comes back from `styles.whatever` as `undefined`, and a
 * `className={undefined}` renders silently and correctly-looking. A missing
 * export does not compile.
 */
export const toolGlyphClass = styles.toolGlyph
export const toolLabelClass = styles.toolLabel

/**
 * Where a name goes, before anybody knows what it is.
 *
 * Drawn rather than written, and the reason is the contrast floor rather than
 * taste: `styling` covers placeholder text at 4.5:1 like any other text, so
 * there is no colour recessive enough to read as "not yet" that is also legal
 * to write words in. A block sidesteps the question by making no claim a person
 * can read — and `ink-faint`, which that same rule reserves for what is drawn
 * and never read, is precisely the token for it.
 *
 * **It wears the label's own class, and is given that label's own measure.**
 *
 * The first version guessed a pixel width, and it was wrong in both directions:
 * measured, the city came out 24px narrow, which pushed search, drop and filter
 * 24px right, and left the header 5px shorter than it would be. The guess was
 * never necessary. Every name in this bar is already pinned in `ch` — the trip
 * to `12ch`, the city to `11ch`, the account to `13ch` — because a control whose
 * width follows its own contents moves whatever sits after it, which is the same
 * reason `.drop` reserves a slot for its longer label. So the measure is handed
 * in rather than invented, and the class is worn for the *type*: `1lh` inside it
 * is the line box the name would have had, which is what stops the header
 * changing height.
 *
 * The measure is given inline rather than left to the borrowed class because at
 * a phone width that class becomes `width: auto` — the live name sizes itself to
 * its own text there and truncates. An empty box sizing itself to its own text
 * is zero, and the placeholder disappeared: control drawn, class applied, rule
 * correct, nothing on screen.
 *
 * `aria-hidden`, because what this stands for is already being said: the
 * control around it reports itself unavailable. A second announcement of the
 * same fact is noise.
 */
export function NamePlaceholder({
  className,
  measure,
}: {
  className?: string
  /** The label's own width, in `ch`, so both states occupy the same box. */
  measure: string
}) {
  return (
    <span
      aria-hidden
      className={`${className ?? ''} ${styles.namePlaceholderBox}`}
      style={{ width: measure }}
    >
      <span className={styles.namePlaceholderBar} />
    </span>
  )
}

/**
 * A menu whose data has not been read, so there is nothing behind it yet.
 *
 * The same `Menu` the live control renders, given the one thing that differs:
 * a label nobody knows. That is the whole reason this is three lines rather
 * than a second trigger built to match the first — a lookalike is a thing to
 * keep in agreement, and this bar's whole point is that there is nothing to
 * keep in agreement.
 *
 * `open={false}` with a `onOpen` that does nothing rather than the workspace's
 * real handler: the panel is guarded inside `Menu` as well, but a control that
 * cannot act should not be reaching for state it has no business in.
 */
export function WaitingMenu({
  name,
  labelClassName,
  measure,
}: {
  name: string
  /** The class the live label wears, so the type is identical in both states. */
  labelClassName?: string
  /** That label's own `ch` measure. */
  measure: string
}) {
  return (
    <Menu
      name={name}
      label={<NamePlaceholder className={labelClassName} measure={measure} />}
      open={false}
      onOpen={() => {}}
      tone="quiet"
      disabled
    >
      {null}
    </Menu>
  )
}

/**
 * A control that reveals a panel, and everything that owes the reader.
 *
 * There were five of these in the chrome, built four different ways: three
 * dismissal contracts, five widths, two anchoring rules and three words for
 * close. Only one of the five — the filter's — dismissed on an outside press or
 * on Escape, and none of them returned focus or told a screen reader that
 * anything had opened.
 *
 * So the contract lives here rather than at each call site, for the same reason
 * `Button` owns `aria-disabled`: a rule that has to be remembered five times is
 * a rule that is already false somewhere. What a call site supplies is a label
 * and what goes inside.
 *
 * `open` is passed in rather than held here. Only one menu in the chrome may be
 * open at a time, and that is a fact about the whole bar — no component can
 * enforce it about panels it cannot see.
 */
/**
 * Dismissing something raised over the workspace: a press outside, and Escape.
 *
 * Extracted from `Menu` when `workspace-chrome` widened past what is raised
 * *from the chrome* to cover the two panels raised over the map. Every line
 * below was written for the menus and carries its own reasoning; none of it is
 * less true for a panel that sits on the map, and a second copy of it would be
 * two contracts where the requirement asks for one.
 *
 * What differs between the callers is passed in rather than detected here. A
 * menu hangs off a trigger and may dim the screen behind it at a phone width; a
 * panel over the map has neither, so it supplies no trigger and is never
 * dimmed.
 */
/**
 * Nothing behind this is dimmed.
 *
 * Module scope so its identity survives a render, which is what keeps the
 * listeners from being torn down and re-armed on every one of them.
 */
export const notDimmed = () => false

/**
 * Focus moves into a panel when it opens, and back where it was when it goes.
 *
 * For the panels raised over the map, which mount and unmount rather than
 * toggling an `open` flag the way `Menu` does — so the effect's own lifetime is
 * the panel's, and its cleanup is the moment to give focus back.
 *
 * The details card is opened by pressing a marker, and a marker is a real
 * `<button>` on the map, so "whatever was focused" and "the pin that was
 * pressed" are the same element. That is why this restores to what it found
 * rather than being told what to go back to: it needs no opinion about which
 * control opened the panel, and it is right for the ones opened from search as
 * well.
 *
 * It does not steal focus from inside itself. A form autofocuses its first
 * field, and moving focus to the panel root afterwards would put the caret
 * nowhere and announce the container instead of the field.
 */
export function useFocusReturn(
  panel: RefObject<HTMLElement | null>,
  /**
   * Where to give focus back, found again at the moment it is needed.
   *
   * A function rather than an element, because the element that opened a panel
   * over the map does not survive until the panel closes: selecting a marker
   * redraws the marker layer, so the button that was pressed is detached and
   * replaced by an equal one. Looking it up on the way out finds the
   * replacement; holding it finds a node no longer in the document, and
   * focusing that silently drops focus to the body.
   *
   * Omitted, focus goes back to whatever held it when the panel opened, which
   * is right for a panel opened from a control that stays put.
   */
  findOpener?: () => HTMLElement | null,
) {
  useEffect(() => {
    const held = document.activeElement
    const surface = panel.current
    if (surface && !surface.contains(held)) surface.focus()
    return () => {
      /*
       * Given back a frame later, not in the cleanup itself.
       *
       * Dismissing a panel opened from a pin is one render: the selection
       * clears, this panel unmounts, and *then* the map's own effect redraws
       * the marker layer. Looking for the pin inside the cleanup therefore runs
       * before the pin it is looking for exists — the lookup finds nothing,
       * focus is left on the body, and nothing about it is visible. A frame
       * later the layer has been redrawn and the replacement is there.
       *
       * Only where nothing else has taken focus in the meantime. A frame is
       * long enough for a person to have pressed something, and the way back
       * should never pull focus off whatever they chose instead.
       */
      requestAnimationFrame(() => {
        const settled = document.activeElement
        if (settled !== null && settled !== document.body) return
        const back = findOpener?.() ?? held
        if (back instanceof HTMLElement && document.contains(back)) back.focus()
      })
    }
    // `findOpener` is read only in the cleanup, so a fresh identity each render
    // would tear this down and re-run it — taking focus back into the panel on
    // every keystroke inside it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel])
}

export function useDismissible({
  open,
  onDismiss,
  panel,
  trigger,
  isDimmed,
}: {
  open: boolean
  onDismiss: () => void
  /** What counts as inside. A press within it never dismisses. */
  panel: RefObject<HTMLElement | null>
  /**
   * The control that opened it, where there is one.
   *
   * Excluded from the outside test because it toggles itself on click, and
   * dismissing here as well would close and reopen on a single press.
   */
  trigger?: RefObject<HTMLElement | null>
  /**
   * Whether the screen behind is drawn as stepped back, asked now rather than
   * read off a width. See the note inside about why the question is asked of
   * the thing that answers it.
   */
  isDimmed: () => boolean
}) {
  useEffect(() => {
    if (!open) return

    /*
      Outside is measured against the trigger and the panel, not against the
      anchor that holds them.

      Those used to be the same test, and at a phone width they stopped being.
      The sheet's backdrop is drawn as the anchor's own `::after` — a
      pseudo-element cannot be an event target, so a press on the backdrop
      arrives reporting the *anchor* as its target, which the old test read as
      "inside" and refused to dismiss. The backdrop covers the whole screen, so
      the effect was that a sheet could not be dismissed by pressing away from
      it at all, and the press was swallowed rather than falling through to
      whatever was behind.

      **Learn the shape of this one**: nothing about it is visible. The sheet is
      drawn correctly, Escape still works, the control still toggles, and every
      other menu in the chrome behaves — it is only the one gesture, on the one
      shape, and a backdrop that looks exactly like it is doing its job.
    */
    /**
     * Whether this press is spent on the dismissal alone.
     *
     * `workspace-chrome` — *Anything that opens can be dismissed without
     * hunting* — splits this in two, and splits it on what is drawn rather than
     * on a width:
     *
     * - Where the screen behind is dimmed, nothing beneath the press acts. The
     *   dimming is a claim that the rest of the screen has stepped back, and a
     *   screen drawn as stepped back should be stepped back. At a phone width
     *   every menu here is a sheet with a scrim, and the whole toolbar under it
     *   — `Drop pin` included, which is how this was found.
     * - Where nothing is dimmed the panel hangs off its own control and makes
     *   no such claim, so another control of the chrome still acts on the same
     *   press: pressing the next trigger switches menus, which is what somebody
     *   means by pressing it. The map is the exception at either width, because
     *   it turns a press into a pin or a selection and there is no reading of
     *   "I am closing this" that also means either of those.
     *
     * The dimming is read off the scrim itself rather than from a `matchMedia`
     * repeating the stylesheet's breakpoint. A second copy of a width is a
     * second copy to keep in agreement, and `NamePlaceholder` above already
     * carries the scar from guessing one the stylesheet owned. This asks the
     * question the requirement asks — is the screen dimmed, now — of the thing
     * that answers it.
     *
     * The map is found by `.maplibregl-map`, which `trip-map.module.css` states
     * is carried by the canvas element. The credit's own menu is a sibling of
     * that element rather than a child, so it stays a control of the chrome and
     * is not mistaken for the map it sits over.
     */
    const spent = (target: Node) => {
      if (isDimmed()) return true
      const element = target instanceof Element ? target : target.parentElement
      return element?.closest('.maplibregl-map') != null
    }

    /**
     * Take the click this press is about to become.
     *
     * Capture, so it lands before its target rather than after: a bubbling
     * listener on `document` runs once the map and the buttons have already had
     * the event, which is this same bug moved into a different phase.
     *
     * Armed here rather than inside the effect's own lifetime, because closing
     * is what arms it — tying it to `open` would tear it down on the render
     * that the dismissal causes, before the click it exists to catch arrives.
     *
     * It has to stand down again, because not every press becomes a click: a
     * touch that turns into a scroll ends in `pointercancel`, and a secondary
     * button ends in a context menu. One left armed would eat an unrelated
     * click later on — this bug again, with a longer fuse and nothing to
     * reproduce it from.
     *
     * **It stands down on a signal, never on a clock.** The first version
     * released a task after `pointerup`, on the reasoning that `click` follows
     * immediately. It does — for a press with no duration. A press somebody
     * actually makes has a gap between going down and coming up, the click
     * lands in a later task than the timer, and the swallower is gone before
     * the thing it exists to catch arrives:
     *
     *     instant press:  pointerdown, pointerup, click, timer   → held
     *     real press:     pointerdown, pointerup, timer, click   → released
     *
     * Every automated test passed because synthesised clicks dispatch the whole
     * sequence in one task, which is exactly the shape that cannot show this.
     *
     * The next `pointerdown` is the honest signal. Nothing can release the
     * swallower before its own click, because the only thing that releases it
     * is a fresh press — and a fresh press *should*. It is registered in
     * capture during a pointerdown that has already passed that phase, so it
     * cannot hear the press that armed it.
     *
     * The residue: between a press that never became a click and the next
     * press, a click raised by the keyboard would still be swallowed.
     * `pointercancel` covers the common way into that state, and the rest is
     * narrower than the failure it replaces.
     */
    const swallowNextClick = () => {
      const armed = new AbortController()
      const { signal } = armed
      document.addEventListener(
        'click',
        (event) => {
          event.stopPropagation()
          event.preventDefault()
          armed.abort()
        },
        { capture: true, signal },
      )
      document.addEventListener('pointerdown', () => armed.abort(), {
        capture: true,
        signal,
      })
      document.addEventListener('pointercancel', () => armed.abort(), {
        capture: true,
        signal,
      })
    }

    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node
      // The trigger toggles itself on click; dismissing here as well would
      // close and reopen on one press.
      if (trigger?.current?.contains(target)) return
      if (panel.current?.contains(target)) return
      if (spent(target)) {
        /*
          Say nothing was pressed, as well as doing nothing.

          Swallowing only the click leaves the press looking answered: `.button`
          above depresses on `:active` and runs a background transition, both of
          which the browser applies on `mousedown`, long before anything here
          knows the press is spent. The control sinks under the finger, springs
          back, and nothing happens — which reads as a control that failed
          rather than one that was never going to act.

          `preventDefault` on the pointerdown suppresses the compatibility mouse
          events, and `mousedown` is where both of those come from. `click` is
          explicitly *not* suppressed by it, which is why the swallower below is
          still needed rather than replaced.
        */
        event.preventDefault()
        swallowNextClick()
      }
      onDismiss()
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }

    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open, onDismiss, panel, trigger, isDimmed])
}

export function Menu({
  label,
  children,
  name,
  hint,
  open,
  onOpen,
  align = 'start',
  tone = 'default',
  marked = false,
  disabled = false,
}: {
  /** What the trigger shows. May carry a count or a caret, so not a plain string. */
  label: ReactNode
  /**
   * What the panel is called.
   *
   * Required, and separate from `label`, because the two answer different
   * questions: the trigger may read `Filter · 9 of 17`, which is a state, while
   * the panel it opens is `Filter`. Without this the panel is an unnamed region
   * and a reader is told only that a group appeared.
   */
  name: string
  /**
   * What the *trigger* is called, where its own contents do not say enough.
   *
   * The mechanism the `name` comment above anticipated, finally needed. A
   * trigger's accessible name is otherwise computed from what is inside it —
   * which is correct for a control whose label is a word, and silent for one
   * whose state is drawn. The filter's trigger declares a narrowed trip with a
   * recolour and a dot, both of which are `aria-hidden` because they are
   * decoration, and the only child carrying the state in text was the count.
   * Where the count is not shown — a tool has no line for it — the control
   * announced exactly what an *unfiltered* control announces. The declaration
   * did not exist for that reader.
   *
   * So this is not a convenience. `marker-filtering` requires the declaration to
   * be conveyed to somebody who is not looking at the screen, in every rendering
   * of the control, and this is where that is satisfied. The phone's `Tool` takes
   * the same prop under the same name and carries the same two sentences.
   *
   * **It must contain the trigger's visible word.** `aria-label` replaces the
   * computed name rather than adding to it, and WCAG 2.5.3 asks that a control's
   * accessible name contain its visible label — otherwise somebody driving the
   * page by voice cannot say what they can see. `Filter this trip` satisfies
   * that; `Some places are hidden` would not.
   *
   * Omitted, the name is computed from the contents as before, which is what the
   * trip, city and account menus want — their trigger *is* a word.
   */
  hint?: string
  children: ReactNode
  open: boolean
  onOpen: (open: boolean) => void
  /** `end` hangs the panel from the right, for a trigger near the viewport edge. */
  align?: 'start' | 'end'
  tone?: 'default' | 'primary' | 'danger' | 'quiet'
  /**
   * The trigger is declaring a state, not merely opening something.
   *
   * Fills the control **and** draws a dot, because a state carried only in hue
   * survives neither a greyscale screen nor a colour-blind reader — the same
   * rule that keeps a visited marker from being recoloured. Two signals, and
   * whatever the label says is the third.
   */
  marked?: boolean
  /**
   * There is nothing to open yet.
   *
   * The same treatment `Button` already gives its own `disabled`, and for the
   * same reason: `aria-disabled` and a no-op, never the attribute, which leaves
   * the tab order and is skipped by a screen reader. Somebody arriving at the
   * bar before its data has to be told this control is unavailable rather than
   * find that it is absent.
   *
   * It guards `onOpen` as well as the styling. Without that, a menu with no
   * data could still be opened onto an empty panel — and `Escape` and the
   * outside-press listeners would go on running for a panel nobody can see.
   */
  disabled?: boolean
}) {
  const anchor = useRef<HTMLDivElement | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const panel = useRef<HTMLDivElement | null>(null)
  /**
   * Whether this menu was open on the previous render.
   *
   * Focus is restored on the transition from open to closed, never on every
   * render where it happens to be closed — which would steal focus from
   * wherever the reader actually is, on every keystroke elsewhere in the bar.
   */
  const wasOpen = useRef(false)

  /**
   * Closing the way a dropdown closes.
   *
   * Pointer down rather than click, kept from the filter bar along with its
   * reason: a click listener fires after the map has already decided what the
   * press meant, so pressing the map to dismiss this would also drop a pin
   * while the map is armed.
   *
   * That reason is also the whole of the difficulty. The decision to close is
   * taken on `pointerdown`, and everything that would act on the same press —
   * the map's drop, a marker, another control's `onClick` — acts on `click`,
   * which is a separate event dispatched later. Nothing done to the pointerdown
   * reaches it: `stopPropagation` and `preventDefault` act on the event they
   * are handed, not on the one that follows. Even the phone's scrim does not
   * help, and for the same reason inverted — it is torn down by the very press
   * it looks like it should absorb, so it is already gone by the time the click
   * is hit-tested. A press that dismisses therefore has to be *followed*, and
   * the click it is about to become taken out of the air.
   */
  useDismissible({
    open,
    onDismiss: useCallback(() => onOpen(false), [onOpen]),
    panel,
    trigger,
    isDimmed: useCallback(
      () =>
        anchor.current !== null &&
        getComputedStyle(anchor.current, '::after').content !== 'none',
      [],
    ),
  })

  /**
   * Focus back to the trigger when the panel goes.
   *
   * Dismissing from a control inside the panel destroys the focused element, and
   * focus then falls to the document body — so the way back is to tab through
   * the whole of the chrome again. A layout effect, so it lands before the
   * browser paints and the ring never appears in the wrong place.
   */
  useLayoutEffect(() => {
    if (wasOpen.current && !open) trigger.current?.focus()
    wasOpen.current = open
  }, [open])

  return (
    <div ref={anchor} className={styles.menuAnchor}>
      <button
        ref={trigger}
        type="button"
        onClick={() => {
          if (disabled) return
          onOpen(!open)
        }}
        aria-label={hint}
        aria-disabled={disabled || undefined}
        aria-expanded={disabled ? undefined : open}
        /*
         * `menu` would be a lie. These panels hold checkboxes, fields and
         * forms, and a reader told to expect a menu is told to expect
         * `menuitem` children that are not there. `dialog` is the honest
         * answer for a panel with a form in it.
         */
        aria-haspopup="dialog"
        className={`${styles.button} ${styles[tone]} ${marked ? styles.live : ''}`}
      >
        {label}
        {marked ? <span aria-hidden className={styles.liveDot} /> : null}
        {/*
          Drawn, not typed, and both halves of that matter.

          Drawn here rather than by each call site, so a label-shaped control is
          never mistaken for a label — the phone's header names the caret as the
          thing that makes a name findable as a control.

          And drawn as a path rather than set as `▾`, for the reason the zoom
          control already records about `+` and `−`: a typed glyph takes the
          font's own weight, width and vertical centring, so its size is
          whatever the face decided rather than what this asked for, and it
          sits off the optical centre of the row. A path is the size it is
          given on every face.
        */}
        <svg
          viewBox="0 0 16 16"
          className={styles.caret}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6.5 8 10.5l4-4" />
        </svg>
      </button>

      {open && !disabled ? (
        <div
          ref={panel}
          role="group"
          aria-label={name}
          className={`${styles.menuPanel} ${align === 'end' ? styles.menuPanelEnd : ''}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Unavailable is `aria-disabled` and a no-op, never the `disabled` attribute.
 *
 * The attribute takes the control out of the tab order and hides it from a
 * screen reader, so somebody arriving by keyboard is told the action is gone
 * rather than that it is unavailable — and told nothing about why. `DESIGN.md`
 * forbids it outright; `Clear` in the filter bar has been the only control
 * honouring that, and this puts it in the primitive so no call site can get it
 * wrong.
 *
 * The guard lives here rather than at each call site, and it covers both routes
 * in: `onClick` returns early, and `type="submit"` is downgraded to a plain
 * button, because `aria-disabled` does not stop a form submitting and the
 * Enter key in any field would otherwise still send it.
 */
export function Button({
  children,
  onClick,
  type = 'button',
  tone = 'default',
  disabled,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  tone?: 'default' | 'primary' | 'danger' | 'quiet'
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type={disabled ? 'button' : type}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault()
          return
        }
        onClick?.()
      }}
      aria-disabled={disabled || undefined}
      title={title}
      className={`${styles.button} ${styles[tone]}`}
    >
      {children}
    </button>
  )
}

/**
 * A labelled input carrying its own error.
 *
 * The error sits against the field rather than above the form because that is
 * the whole reason writes return errors keyed by field name: a form that says
 * "something is wrong" makes the person hunt for it.
 *
 * The refusal arrives as a **name** and is resolved here, which is the line
 * where it is actually drawn. Every field in this file takes it the same way,
 * so no form has to remember to resolve one on the way in — and none of them
 * can hold a sentence in state long enough for it to be the wrong language.
 */
export function TextField({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  multiline,
  autoFocus,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: Message
  placeholder?: string
  /**
   * `date` renders the browser's own date control, which anchors its picker to
   * the field rather than raising a layer of ours over a form that is already
   * raised over the map. Its value is a `YYYY-MM-DD` string in and out, which
   * is the shape the day is stored and carried in everywhere.
   */
  type?: 'text' | 'url' | 'number' | 'email' | 'date'
  multiline?: boolean
  autoFocus?: boolean
  hint?: string
}) {
  const invalid = error !== undefined
  const say = useSay()

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          aria-invalid={invalid}
          className={`${styles.control} ${styles.textarea}`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid}
          autoFocus={autoFocus}
          className={styles.control}
        />
      )}

      {invalid ? (
        <span role="alert" className={styles.error}>
          {say(error)}
        </span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </label>
  )
}

/**
 * A price in US dollars, with a `Free` toggle beside it — and, in a city with a
 * second currency, a second box on the same row for the price as it was seen
 * there.
 *
 * One bounded section labelled `Price`, drawn like the hours group beside it
 * (#191). The currency code sits *on* each box rather than in a label above it,
 * which is what lets both amounts share one label and one row. Because the
 * label no longer names a currency, any message about one of the two amounts
 * has to name it instead — see `local.error` and the caller.
 *
 * Free and a price are one value — a free place is a price of 0 — so only one
 * of them can ever be set. Turning Free on empties both boxes and greys them
 * out; going into either box, or pressing Free again, turns it off and leaves
 * empty boxes to type into. The boxes are greyed rather than `disabled` for
 * exactly that reason: a disabled input cannot be clicked, and clicking one is
 * a way back to a price.
 *
 * The two amounts are independent. Nothing converts one into the other, which
 * is what the hint under the row says.
 */
/**
 * The first price's currency, as its code.
 *
 * A code rather than words: it reads the same in every language, exactly as
 * the second box's code beside it does.
 */
const DOLLARS = 'USD'

export function PriceField({
  value,
  onChange,
  free,
  onFreeChange,
  error,
  local,
  warning,
}: {
  value: string
  onChange: (value: string) => void
  free: boolean
  onFreeChange: (free: boolean) => void
  error?: Message
  /** The second box, present only when the chosen city has a second currency. */
  local?: {
    currency: string
    value: string
    onChange: (value: string) => void
    /** `Tokyo's currency. …` — which city the currency comes from. */
    hint: string
    error?: Message
  }
  /**
   * A saved local amount that saving will clear, said under the boxes. Present
   * whether or not the second box is — refiling to a city with no currency
   * loses the amount as surely as refiling to one with another.
   */
  warning?: string | null
}) {
  const invalid = error !== undefined
  const localInvalid = local?.error !== undefined
  const id = useId()
  const localId = useId()
  const labelId = useId()
  const say = useSay()

  return (
    <div className={styles.priceFields} role="group" aria-labelledby={labelId}>
      <span id={labelId} className={styles.label}>
        {say(message('priceField.label'))}
      </span>

      <div className={styles.priceRow}>
        <div className={styles.money}>
          <label htmlFor={id} className={styles.code}>
            {DOLLARS}
          </label>
          <input
            id={id}
            type="number"
            min={0}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => {
              if (free) onFreeChange(false)
            }}
            /*
              No placeholder beyond `Free`. "Blank if unknown" does not fit a box
              sized for an amount — it truncated to "Blank if unk…" on the phone
              and in the narrow card — so what it said moved to the line beneath,
              which is where this form says everything else of that kind.
            */
            placeholder={free ? say(message('price.free')) : ''}
            aria-invalid={invalid}
            data-free={free}
            className={styles.amount}
          />
        </div>

        {local ? (
          <div className={styles.money} data-invalid={localInvalid}>
            <label htmlFor={localId} className={styles.code}>
              {local.currency}
            </label>
            <input
              id={localId}
              type="number"
              min={0}
              value={local.value}
              onChange={(event) => local.onChange(event.target.value)}
              onFocus={() => {
                if (free) onFreeChange(false)
              }}
              placeholder={free ? say(message('price.free')) : ''}
              aria-invalid={localInvalid}
              data-free={free}
              className={styles.amount}
            />
          </div>
        ) : null}

        <button
          type="button"
          aria-pressed={free}
          onClick={() => {
            if (!free) {
              onChange('')
              local?.onChange('')
            }
            onFreeChange(!free)
          }}
          className={styles.freeToggle}
        >
          {say(message('price.free'))}
        </button>
      </div>

      {invalid ? (
        <span role="alert" className={styles.error}>
          {say(error)}
        </span>
      ) : null}

      {local?.error !== undefined ? (
        /*
          Prefixed with the code, because the label no longer carries it. With
          two amounts under one `Price` label, an unprefixed message does not
          say which of them is being refused. Done here rather than at the call
          site so neither app can forget it.
        */
        <span role="alert" className={styles.error}>
          {local.currency}: {say(local.error)}
        </span>
      ) : null}

      {/*
        Always said, with or without a second currency: it is where the boxes'
        placeholder used to say it. The currency sentence joins it when there is
        a second amount to explain.
      */}
      <span className={styles.hint}>
        {local ? (
          <>
            {say(message('priceField.blankHintEither'))} {local.hint}
          </>
        ) : (
          say(message('priceField.blankHint'))
        )}
      </span>

      {warning ? (
        <span role="status" className={styles.priceWarning}>
          {warning}
        </span>
      ) : null}
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  error?: Message
}) {
  const say = useSay()

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error !== undefined}
        className={styles.control}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error === undefined ? null : (
        <span role="alert" className={styles.error}>
          {say(error)}
        </span>
      )}
    </label>
  )
}

/**
 * A refusal that belongs above the form rather than against a field — the
 * database said no, and no single input is to blame.
 */
/**
 * A question the product asks before it destroys something.
 *
 * **Not a dialog, and deliberately so.** There is no dialog in this system —
 * `DESIGN.md` has panels over the map, detour panels hung off the control that
 * opened them, and sheets on the phone. Adding a centred thing that takes the
 * screen would be a second kind of layer a person has to learn, and on the
 * phone it would put a modal inside the city sheet's own modal, which is the
 * shape `AGENTS.md` records as behaving in the simulator and not on a device.
 *
 * So the panel that offered the act asks the question itself, the way the trip
 * bar already swaps between its rename, dates and archive faces. This renders
 * the question and its two controls; **where it sits, and how much of the panel
 * it replaces, is the caller's decision** — see `DESIGN.md`, *Asking Before
 * Destroying*: what is being removed stays, whatever offers other acts goes.
 *
 * `role="group"` with `aria-live="assertive"`, because the question appears
 * where a footer was rather than arriving as a new region. Without the live
 * region a screen reader is told only that the controls changed, which is the
 * one thing a person who cannot see it does not need to know.
 *
 * The confirming control carries the wait. The act begins when the question is
 * answered, not when it was offered — `window.confirm` blocked and returned a
 * boolean, and nothing here can.
 */
export function Question({
  question,
  consequence,
  confirm,
  waiting,
  onConfirm,
  onDecline,
}: {
  /** What will happen, in one line and in the product's voice. */
  question: string
  /**
   * What it costs, where the cost lands somewhere the person is not looking.
   *
   * Omitted where the act speaks for itself. Present for a city, whose places
   * survive as unfiled and whose local prices do not — a count discovered
   * afterwards arrived too late to inform the decision.
   */
  consequence?: string
  /** The confirming control's words. Names the act, never `OK`. */
  confirm: string
  /** The write is running. The control says so and cannot be fired again. */
  waiting?: boolean
  onConfirm: () => void
  onDecline: () => void
}) {
  const say = useSay()

  return (
    <div role="group" aria-live="assertive" className={styles.question}>
      <p className={styles.questionText}>{question}</p>
      {consequence ? <p className={styles.consequence}>{consequence}</p> : null}
      <div className={styles.questionControls}>
        <Button onClick={onDecline} disabled={waiting}>
          {say(message('common.cancel'))}
        </Button>
        <Button tone="danger" onClick={onConfirm} disabled={waiting}>
          {waiting ? `${confirm}…` : confirm}
        </Button>
      </div>
    </div>
  )
}

export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className={styles.formError}>
      {message}
    </p>
  )
}
