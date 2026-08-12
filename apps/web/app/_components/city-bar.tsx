'use client'

import type { City, Marker } from '@pinpoint/core'
import { useState } from 'react'

import { Button, TextField } from '@/app/_components/ui'

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
  onRename,
  onSetCurrency,
  onDelete,
}: {
  cities: readonly City[]
  markers: readonly Marker[]
  selectedCityId: string | null
  onSelect: (cityId: string | null) => void
  onRename: (cityId: string, name: string) => void
  onSetCurrency: (cityId: string, currency: string | null) => void
  onDelete: (cityId: string) => void
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
          onRename={(name) => {
            onRename(selected.id, name)
            setEditing(false)
          }}
          onSetCurrency={(currency) => {
            onSetCurrency(selected.id, currency)
            setEditing(false)
          }}
          onDelete={() => {
            onDelete(selected.id)
            setEditing(false)
          }}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </div>
  )
}

function CityEditor({
  city,
  markerCount,
  onRename,
  onSetCurrency,
  onDelete,
  onClose,
}: {
  city: City
  markerCount: number
  onRename: (name: string) => void
  onSetCurrency: (currency: string | null) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [name, setName] = useState(city.name)
  const [currency, setCurrency] = useState(city.currency ?? '')

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
            if (name.trim() !== city.name) onRename(name.trim())
            const next = currency.trim().toUpperCase()
            const value = next === '' ? null : next
            if (value !== city.currency) onSetCurrency(value)
            onClose()
          }}
          disabled={name.trim() === ''}
        >
          Save
        </Button>
        <Button tone="quiet" onClick={onClose}>
          Cancel
        </Button>
        <span className={styles.spacer}>
          <Button
            tone="danger"
            onClick={() => {
              // The consequence lands on rows the person is not looking at, so
              // the count is stated rather than left to be discovered.
              const consequence =
                markerCount === 0
                  ? 'It holds no places.'
                  : `${markerCount} ${markerCount === 1 ? 'place' : 'places'} will become unassigned. They are not deleted.`
              if (window.confirm(`Remove “${city.name}”?\n\n${consequence}`)) {
                onDelete()
              }
            }}
          >
            Remove city
          </Button>
        </span>
      </div>
    </div>
  )
}
