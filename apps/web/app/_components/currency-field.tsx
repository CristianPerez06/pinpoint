'use client'

import { currencyLabel, searchCurrencies } from '@pinpoint/core'
import { Search, X } from 'lucide-react'
import { useId, useState } from 'react'

import styles from './currency-field.module.css'

/**
 * A city's optional second currency: none, or one chosen by searching a list.
 *
 * A search rather than a `<select>` of about 150 entries, because nobody knows
 * where the yen falls alphabetically by code, and a person who types `yen`
 * should find it. The list and the search live in `@pinpoint/core`, so the
 * phone offers the same currencies found by the same words.
 *
 * Once one is chosen it reads as `JPY — Japanese Yen` with a way to remove it,
 * rather than staying a text box, so what is set is never mistaken for what is
 * being typed.
 */
export function CurrencyField({
  value,
  onChange,
  hint,
}: {
  value: string | null
  onChange: (code: string | null) => void
  /** Under the field once a currency is chosen: what it means for this city. */
  hint?: string
}) {
  const id = useId()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const results = searchCurrencies(query)

  function choose(code: string) {
    onChange(code)
    setQuery('')
    setOpen(false)
    setActive(0)
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        Second currency (optional)
      </label>

      {value !== null ? (
        <>
          <div className={styles.chosen}>
            <span>{currencyLabel(value)}</span>
            <button
              type="button"
              className={styles.clear}
              onClick={() => onChange(null)}
              aria-label={`Remove ${value}`}
              title={`Remove ${value}`}
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          </div>
          {hint ? <span className={styles.hint}>{hint}</span> : null}
        </>
      ) : (
        <div>
          {/* The icon's own box, so it centres on the input and not on the list below. */}
          <div className={styles.combo}>
            <Search
              size={15}
              strokeWidth={2.2}
              className={styles.icon}
              aria-hidden="true"
            />
            <input
              id={id}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                open && results[active]
                  ? `${listId}-${results[active][0]}`
                  : undefined
              }
              autoComplete="off"
              value={query}
              placeholder="None · search by name or code"
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
                setOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setOpen(true)
                  setActive((index) => Math.min(index + 1, results.length - 1))
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  setActive((index) => Math.max(index - 1, 0))
                } else if (event.key === 'Enter') {
                  // Enter would otherwise submit the form around this field.
                  event.preventDefault()
                  const pick = results[active]
                  if (open && pick) choose(pick[0])
                } else if (event.key === 'Escape') {
                  setOpen(false)
                }
              }}
              className={styles.input}
            />
          </div>
          {open ? (
            <ul id={listId} role="listbox" className={styles.list}>
              {results.length === 0 ? (
                <li className={styles.empty}>No currency matches that.</li>
              ) : (
                results.map(([code, name], index) => (
                  <li
                    key={code}
                    id={`${listId}-${code}`}
                    role="option"
                    aria-selected={index === active}
                    className={styles.option}
                    // Before the input's blur, which would close the list first.
                    onMouseDown={(event) => {
                      event.preventDefault()
                      choose(code)
                    }}
                    onMouseEnter={() => setActive(index)}
                  >
                    <span className={styles.code}>{code}</span>
                    <span>{name}</span>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  )
}
