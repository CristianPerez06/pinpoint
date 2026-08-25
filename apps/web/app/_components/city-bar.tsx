'use client'

import type { City, Marker } from '@pinpoint/core'
import { useState } from 'react'

import { Button, TextField } from '@/app/_components/ui'
import { usePending } from '@/lib/use-pending'

import styles from './city-bar.module.css'

/**
 * Choosing which group of places is being worked on, and correcting a group
 * after the fact.
 *
 * Selecting a city does three things and deliberately not a fourth: it frames
 * the map on that city's places, it biases place search toward them, and it
 * becomes the default for the next place saved. It does not filter the map —
 * hiding the rest would answer "what is near what" with a lie, and filtering is
 * a later change with a whole vocabulary of its own.
 */

const ALL = '__all'

export function CityBar({
  cities,
  markers,
  selectedCityId,
  onSelect,
  onSave,
  onDelete,
}: {
  cities: readonly City[]
  markers: readonly Marker[]
  selectedCityId: string | null
  onSelect: (cityId: string | null) => void
  /**
   * One write for both fields, awaited.
   *
   * This used to be two callbacks fired from one press, which could store the
   * name and have the currency refused — a half-applied edit with no way to
   * report itself. `updateCity` takes a partial patch, so one call carries
   * both and there is one outcome to report.
   */
  onSave: (
    cityId: string,
    patch: { name: string; currency: string | null },
  ) => Promise<unknown>
  onDelete: (cityId: string) => Promise<unknown>
}) {
  const [editing, setEditing] = useState(false)
  const selected = cities.find((city) => city.id === selectedCityId) ?? null

  return (
    <div className={styles.bar}>
      <label className={styles.picker}>
        <span className={styles.label}>City</span>
        <select
          value={selectedCityId ?? ALL}
          onChange={(event) => {
            const value = event.target.value
            onSelect(value === ALL ? null : value)
            setEditing(false)
          }}
          className={styles.select}
        >
          <option value={ALL}>All places</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
              {city.currency ? ` (${city.currency})` : ''}
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <Button
          tone="quiet"
          onClick={() => setEditing((open) => !open)}
          title="Rename, set a currency, or remove this city"
        >
          Edit city
        </Button>
      ) : null}

      {selected && editing ? (
        <CityEditor
          city={selected}
          markerCount={markers.filter((marker) => marker.cityId === selected.id).length}
          // The editor closes itself when its write settles, rather than being
          // closed here as the write is sent. It is the only thing on screen
          // that can say the write is still happening.
          onSave={(patch) => onSave(selected.id, patch)}
          onDelete={() => onDelete(selected.id)}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </div>
  )
}

function CityEditor({
  city,
  markerCount,
  onSave,
  onDelete,
  onClose,
}: {
  city: City
  markerCount: number
  onSave: (patch: { name: string; currency: string | null }) => Promise<unknown>
  onDelete: () => Promise<unknown>
  onClose: () => void
}) {
  const [name, setName] = useState(city.name)
  const [currency, setCurrency] = useState(city.currency ?? '')

  /**
   * Two writes, two flags. Saving is optimistic — the picker shows the new name
   * at once — and removing is not, because unassigning a city's places cannot
   * be undone. Both keep this editor open until the database answers, which is
   * what gives each control somewhere to say what it is doing.
   */
  const [saving, startSave] = usePending()
  const [removing, startRemove] = usePending()
  const busy = saving || removing

  return (
    <div className={styles.editor}>
      <TextField label="Name" value={name} onChange={setName} />
      <TextField
        label="Currency"
        value={currency}
        onChange={setCurrency}
        placeholder="JPY — blank shows plain numbers"
      />

      <div className={styles.actions}>
        <Button
          tone="primary"
          onClick={() => {
            const next = currency.trim().toUpperCase()
            const value = next === '' ? null : next
            // Nothing to write is not a write. Closing without sending is the
            // correct answer to a Save that changed nothing.
            if (name.trim() === city.name && value === city.currency) {
              onClose()
              return
            }
            startSave(async () => {
              await onSave({ name: name.trim(), currency: value })
              onClose()
            })
          }}
          disabled={busy || name.trim() === ''}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button tone="quiet" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <span className={styles.spacer}>
          <Button
            tone="danger"
            disabled={busy}
            onClick={() => {
              // The consequence lands on rows the person is not looking at, so
              // the count is stated rather than left to be discovered.
              const consequence =
                markerCount === 0
                  ? 'It holds no places.'
                  : `${markerCount} ${markerCount === 1 ? 'place' : 'places'} will become unassigned. They are not deleted.`
              if (window.confirm(`Remove “${city.name}”?\n\n${consequence}`)) {
                startRemove(async () => {
                  await onDelete()
                  onClose()
                })
              }
            }}
          >
            {removing ? 'Removing…' : 'Remove city'}
          </Button>
        </span>
      </div>
    </div>
  )
}
