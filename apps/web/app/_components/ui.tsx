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
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node
      // The trigger toggles itself on click; dismissing here as well would
      // close and reopen on one press.
      if (trigger.current?.contains(target)) return
      if (panel.current?.contains(target)) return
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
        onClick={() => onOpen(!open)}
        aria-expanded={open}
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

      {open ? (
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
