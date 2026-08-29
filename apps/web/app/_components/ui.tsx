'use client'

import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react'

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
export function Menu({
  label,
  children,
  name,
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
      const dimmed =
        anchor.current !== null &&
        getComputedStyle(anchor.current, '::after').content !== 'none'
      if (dimmed) return true
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
     * It stands down again as soon as the press ends, because not every press
     * becomes a click: a touch that turns into a scroll ends in `pointercancel`
     * and a secondary button ends in a context menu. One left armed would eat
     * an unrelated click later on — this bug again, with a longer fuse and
     * nothing to reproduce it from. Standing down is deferred by a task on
     * `pointerup` because `click` follows immediately after it, and releasing
     * on the spot would release before the thing being waited for.
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
      document.addEventListener(
        'pointerup',
        () => setTimeout(() => armed.abort(), 0),
        { capture: true, signal },
      )
      document.addEventListener('pointercancel', () => armed.abort(), {
        capture: true,
        signal,
      })
    }

    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node
      // The trigger toggles itself on click; dismissing here as well would
      // close and reopen on one press.
      if (trigger.current?.contains(target)) return
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
      onOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpen(false)
    }

    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open, onOpen])

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
  error?: string
  placeholder?: string
  type?: 'text' | 'url' | 'number' | 'email'
  multiline?: boolean
  autoFocus?: boolean
  hint?: string
}) {
  const invalid = error !== undefined

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
          {error}
        </span>
      ) : hint ? (
        <span className={styles.label}>{hint}</span>
      ) : null}
    </label>
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
  error?: string
}) {
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
          {error}
        </span>
      )}
    </label>
  )
}

/**
 * A refusal that belongs above the form rather than against a field — the
 * database said no, and no single input is to blame.
 */
export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className={styles.formError}>
      {message}
    </p>
  )
}
