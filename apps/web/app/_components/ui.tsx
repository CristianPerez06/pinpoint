'use client'

import type { ReactNode } from 'react'

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
      type={type}
      onClick={onClick}
      disabled={disabled}
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
  type?: 'text' | 'url' | 'number'
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
