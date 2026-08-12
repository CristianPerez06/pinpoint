'use client'

import type { City, FieldErrors } from '@pinpoint/core'
import { MARKER_TYPES } from '@pinpoint/map'
import { COLOUR, RADIUS, SPACE } from '@pinpoint/tokens'
import { useState } from 'react'

import {
  Button,
  FormError,
  overlayPanel,
  SelectField,
  TextField,
} from '@/app/_components/ui'

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
  busy,
  fieldErrors,
  message,
  onSubmit,
  onCancel,
  onCreateCity,
}: {
  title: string
  initial: MarkerFormValues
  cities: readonly City[]
  busy: boolean
  fieldErrors: FieldErrors
  message: string | null
  onSubmit: (values: MarkerFormValues) => void
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

  function submit() {
    onSubmit({
      name: name.trim(),
      note: absentIfBlank(note),
      cityId,
      type,
      link: absentIfBlank(link),
      // A blank price is absent. A typed zero is a real answer — free entry is
      // worth recording — so it must not collapse into the same thing.
      price: price.trim() === '' ? null : Number(price),
    })
  }

  async function createCity() {
    if (!newCity) return
    setCityError(null)

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
  }

  return (
    <form
      style={{ ...overlayPanel, display: 'grid', gap: SPACE.sm }}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
        <strong style={{ fontSize: 16 }}>{title}</strong>
        <span style={{ marginLeft: 'auto' }}>
          <Button tone="quiet" onClick={onCancel} title="Discard">
            ×
          </Button>
        </span>
      </div>

      {message ? <FormError message={message} /> : null}

      <TextField
        label="Name"
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        placeholder="What is this place called?"
        autoFocus
      />

      <SelectField
        label="Type"
        value={type}
        onChange={setType}
        error={fieldErrors.type}
        options={MARKER_TYPES.map((definition) => ({
          value: definition.id,
          label: `${definition.icon}  ${definition.label}`,
        }))}
      />

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
        <div
          style={{
            display: 'grid',
            gap: SPACE.sm,
            padding: SPACE.sm,
            border: `1px solid ${COLOUR.border}`,
            borderRadius: RADIUS.sm,
            backgroundColor: COLOUR.surfaceMuted,
          }}
        >
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
          <p style={{ margin: 0, fontSize: 12, color: COLOUR.textMuted }}>
            Prices filed under this city are read in its currency. Leave it blank
            and they show as plain numbers — nothing is assumed.
          </p>
          {cityError ? <FormError message={cityError} /> : null}
          <div style={{ display: 'flex', gap: SPACE.sm }}>
            <Button
              onClick={createCity}
              disabled={newCity.name.trim() === ''}
              tone="primary"
            >
              Create city
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

      <div style={{ display: 'flex', gap: SPACE.sm, marginTop: SPACE.xs }}>
        <Button type="submit" tone="primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save place'}
        </Button>
        <Button onClick={onCancel} tone="quiet">
          Cancel
        </Button>
      </div>
    </form>
  )
}
