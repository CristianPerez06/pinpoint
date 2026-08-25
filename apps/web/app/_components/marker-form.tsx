'use client'

import type { City, FieldErrors } from '@pinpoint/core'
import { MARKER_TYPES } from '@pinpoint/map'
import { X } from 'lucide-react'
import { useState } from 'react'

import { MarkerGlyph } from '@/app/_components/marker-icon'
import { usePending } from '@/lib/use-pending'
import {
  Button,
  FormError,
  overlayPanelClass,
  SelectField,
  TextField,
} from '@/app/_components/ui'

import styles from './marker-form.module.css'

/**
 * The one form places are saved and edited through.
 *
 * Both ways of adding a place — choosing a search result and pointing at the map
 * — arrive here with a position and sometimes a name, and editing arrives here
 * with everything. Keeping it one component is what stops the two paths drifting
 * into two slightly different sets of fields.
 *
 * It owns no persistence. Every write is the parent's, so this file has no
 * client, no schema, and nothing to say about what a rejection means.
 */

export interface MarkerFormValues {
  name: string
  note: string | null
  cityId: string | null
  type: string
  link: string | null
  price: number | null
}

/** Blank is absent, never empty text. The two look identical in a form and are very different in a query. */
function absentIfBlank(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

const UNASSIGNED = '__unassigned'
const NEW_CITY = '__new'

export function MarkerForm({
  title,
  initial,
  cities,
  fieldErrors,
  message,
  notice,
  onSubmit,
  onCancel,
  onCreateCity,
}: {
  title: string
  initial: MarkerFormValues
  cities: readonly City[]
  fieldErrors: FieldErrors
  message: string | null
  /**
   * Something outside the form changed, rather than something in it being
   * wrong. Separate from `message` because the two ask for different things:
   * one says correct what you typed, the other says look at what somebody else
   * did and then decide.
   */
  notice: string | null
  /**
   * Awaited rather than fired, so this form knows when the write settled and
   * can say so on the control that started it. What it resolves to is the
   * parent's business — this only needs to know that it is over.
   */
  onSubmit: (values: MarkerFormValues) => Promise<unknown>
  onCancel: () => void
  onCreateCity: (name: string, currency: string | null) => Promise<City | null>
}) {
  const [name, setName] = useState(initial.name)
  const [note, setNote] = useState(initial.note ?? '')
  const [cityId, setCityId] = useState<string | null>(initial.cityId)
  const [type, setType] = useState(initial.type)
  const [link, setLink] = useState(initial.link ?? '')
  const [price, setPrice] = useState(
    initial.price === null ? '' : String(initial.price),
  )

  // Creating a city happens inside this form so the place being saved is never
  // lost to a detour. `null` means the detour is closed.
  const [newCity, setNewCity] = useState<{ name: string; currency: string } | null>(
    null,
  )
  const [cityError, setCityError] = useState<string | null>(null)

  /**
   * Two writes, two flags, because this form offers both at once.
   *
   * One flag would disable the city detour while a place is being saved and the
   * save while a city is being created, which is the shared-`busy` mistake in
   * miniature: the state has to be per write or it will eventually be read by a
   * control that has nothing to do with what is happening.
   */
  const [saving, startSave] = usePending()
  const [creatingCity, startCreateCity] = usePending()

  function submit() {
    // Routed through the same guard as the button because Enter in any field
    // submits a form, and `aria-disabled` does not stop that.
    startSave(() =>
      onSubmit({
      name: name.trim(),
      note: absentIfBlank(note),
      cityId,
      type,
      link: absentIfBlank(link),
      // A blank price is absent. A typed zero is a real answer — free entry is
      // worth recording — so it must not collapse into the same thing.
        price: price.trim() === '' ? null : Number(price),
      }),
    )
  }

  function createCity() {
    if (!newCity) return
    setCityError(null)

    startCreateCity(async () => {
      const created = await onCreateCity(
        newCity.name.trim(),
        absentIfBlank(newCity.currency)?.toUpperCase() ?? null,
      )

      if (!created) {
        setCityError('Could not create that city.')
        return
      }

      setCityId(created.id)
      setNewCity(null)
    })
  }

  return (
    <form
      className={`${overlayPanelClass} ${styles.form}`}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <button
          type="button"
          className={styles.dismiss}
          onClick={onCancel}
          aria-label="Discard"
          title="Discard"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      </div>

      {message ? <FormError message={message} /> : null}
      {notice ? (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      ) : null}

      <TextField
        label="Name"
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        placeholder="What is this place called?"
        autoFocus
      />

      {/*
        A grid of pins rather than a select. A type's icon is a drawn component
        now, and a dropdown cannot print one — but the better reason is that this
        answers the question the select could not: what this place will look like
        once it is on the map.
      */}
      <div>
        <span className={styles.typesLabel}>Type</span>
        <div className={styles.types} role="group" aria-label="Type">
          {MARKER_TYPES.map((definition) => {
            const chosen = definition.id === type

            return (
              <button
                key={definition.id}
                type="button"
                className={styles.type}
                aria-pressed={chosen}
                onClick={() => setType(definition.id)}
                title={definition.label}
              >
                <span
                  className={styles.typeChip}
                  style={{
                    backgroundColor: chosen
                      ? `var(--pp-family-${definition.family})`
                      : 'var(--pp-surface-muted)',
                    color: chosen ? 'var(--pp-marker-foreground)' : 'var(--pp-ink-muted)',
                  }}
                >
                  <MarkerGlyph icon={definition.icon} size={15} />
                </span>
                {definition.label}
              </button>
            )
          })}
        </div>
        {fieldErrors.type ? (
          <span role="alert" className={styles.typeError}>
            {fieldErrors.type}
          </span>
        ) : null}
      </div>

      <SelectField
        label="City"
        value={cityId ?? UNASSIGNED}
        onChange={(value) => {
          if (value === NEW_CITY) {
            setNewCity({ name: '', currency: '' })
            return
          }
          setCityId(value === UNASSIGNED ? null : value)
        }}
        error={fieldErrors.cityId}
        options={[
          { value: UNASSIGNED, label: 'Unassigned' },
          ...cities.map((city) => ({ value: city.id, label: city.name })),
          { value: NEW_CITY, label: '+ New city…' },
        ]}
      />

      {newCity ? (
        <div className={styles.newCity}>
          <TextField
            label="New city name"
            value={newCity.name}
            onChange={(value) => setNewCity({ ...newCity, name: value })}
            placeholder="Kyoto"
            autoFocus
          />
          <TextField
            label="Currency (optional)"
            value={newCity.currency}
            onChange={(value) => setNewCity({ ...newCity, currency: value })}
            placeholder="JPY"
          />
          <p className={styles.hint}>
            Prices filed under this city are read in its currency. Leave it blank
            and they show as plain numbers — nothing is assumed.
          </p>
          {cityError ? <FormError message={cityError} /> : null}
          <div className={styles.row}>
            <Button
              onClick={createCity}
              disabled={creatingCity || newCity.name.trim() === ''}
              tone="primary"
            >
              {creatingCity ? 'Creating…' : 'Create city'}
            </Button>
            <Button onClick={() => setNewCity(null)} tone="quiet">
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <TextField
        label="Note"
        value={note}
        onChange={setNote}
        error={fieldErrors.note}
        placeholder="Why is this worth going to?"
        multiline
      />

      <TextField
        label="Link"
        value={link}
        onChange={setLink}
        error={fieldErrors.link}
        placeholder="https://…"
        type="url"
      />

      <TextField
        label="Price"
        value={price}
        onChange={setPrice}
        error={fieldErrors.price}
        placeholder="Leave blank if unknown"
        type="number"
      />

      <div className={styles.actions}>
        <Button type="submit" tone="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save place'}
        </Button>
        <Button onClick={onCancel} tone="quiet">
          Cancel
        </Button>
      </div>
    </form>
  )
}
