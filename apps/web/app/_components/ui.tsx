'use client'

import { COLOUR, RADIUS, SPACE } from '@pinpoint/tokens'
import type { CSSProperties, ReactNode } from 'react'

/**
 * The controls the capture flow is built from.
 *
 * Web components, and they stay web components — the mobile application renders
 * its own from the same tokens and imports nothing from here, which is what the
 * `styling` spec requires. What is worth sharing is the logic, and none of it
 * is in a button.
 *
 * Factored out of the five components that would otherwise each carry the same
 * forty lines of inline style. Still inline, because this application has no
 * styling system and inventing one is a different change; every value comes from
 * `@pinpoint/tokens` and nothing here writes a colour of its own.
 */

/** A panel floating over the map. The details view and the form share it. */
export const overlayPanel: CSSProperties = {
  position: 'absolute',
  left: SPACE.md,
  bottom: SPACE.md,
  width: 360,
  maxWidth: `calc(100% - ${SPACE.xl}px)`,
  maxHeight: '70%',
  overflowY: 'auto',
  backgroundColor: COLOUR.surface,
  color: COLOUR.text,
  border: `1px solid ${COLOUR.border}`,
  borderRadius: RADIUS.md,
  padding: SPACE.md,
  boxShadow: '0 6px 24px rgba(0, 0, 0, 0.18)',
  zIndex: 3,
}

const controlBase: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  padding: `${SPACE.xs}px ${SPACE.sm}px`,
  border: `1px solid ${COLOUR.border}`,
  borderRadius: RADIUS.sm,
  backgroundColor: COLOUR.surface,
  color: COLOUR.text,
  fontSize: 14,
  fontFamily: 'inherit',
}

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
  const palette = {
    default: { bg: COLOUR.surface, fg: COLOUR.text, border: COLOUR.border },
    primary: { bg: COLOUR.text, fg: COLOUR.surface, border: COLOUR.text },
    danger: { bg: COLOUR.dangerSurface, fg: COLOUR.danger, border: COLOUR.danger },
    quiet: { bg: 'transparent', fg: COLOUR.textMuted, border: 'transparent' },
  }[tone]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: `${SPACE.xs}px ${SPACE.sm}px`,
        border: `1px solid ${palette.border}`,
        borderRadius: RADIUS.sm,
        backgroundColor: palette.bg,
        color: palette.fg,
        fontSize: 14,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  type?: 'text' | 'url' | 'number'
  multiline?: boolean
  autoFocus?: boolean
}) {
  const invalid = error !== undefined

  return (
    <label style={{ display: 'grid', gap: SPACE.xs }}>
      <span style={{ fontSize: 13, color: COLOUR.textMuted }}>{label}</span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          aria-invalid={invalid}
          style={{
            ...controlBase,
            resize: 'vertical',
            borderColor: invalid ? COLOUR.danger : COLOUR.border,
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid}
          autoFocus={autoFocus}
          style={{
            ...controlBase,
            borderColor: invalid ? COLOUR.danger : COLOUR.border,
          }}
        />
      )}

      {invalid ? (
        <span role="alert" style={{ fontSize: 12, color: COLOUR.danger }}>
          {error}
        </span>
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
    <label style={{ display: 'grid', gap: SPACE.xs }}>
      <span style={{ fontSize: 13, color: COLOUR.textMuted }}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error !== undefined}
        style={{
          ...controlBase,
          borderColor: error === undefined ? COLOUR.border : COLOUR.danger,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error === undefined ? null : (
        <span role="alert" style={{ fontSize: 12, color: COLOUR.danger }}>
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
    <p
      role="alert"
      style={{
        margin: 0,
        padding: `${SPACE.xs}px ${SPACE.sm}px`,
        borderRadius: RADIUS.sm,
        backgroundColor: COLOUR.dangerSurface,
        border: `1px solid ${COLOUR.danger}`,
        color: COLOUR.danger,
        fontSize: 13,
      }}
    >
      {message}
    </p>
  )
}
