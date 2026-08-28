'use client'

import type { City, Marker } from '@pinpoint/core'
import { Pencil } from 'lucide-react'
import { useState } from 'react'

import { Button, Menu, TextField, WaitingMenu } from '@/app/_components/ui'
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
 *
 * ## Picking and fixing are separate, and used not to be
 *
 * Every row carries its own way into the editor. This replaced a single
 * `Edit "<city>"` entry at the foot of the menu which acted on whatever was
 * selected, and which had two consequences that were not noticed until the
 * phone was given the same list. With `All places` selected it offered no way
 * to edit any city at all — the entry simply was not rendered. And correcting
 * a city meant selecting it first, which is a request to re-frame: fixing a
 * typo in `Osaka` took the map to Osaka.
 *
 * So the two are now independent. Pressing a row changes what is being worked
 * on and moves the camera; pressing its pencil opens the editor and does
 * neither.
 */

export type CityBarLiveProps = {
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
  /**
   * This list has just been shown.
   *
   * The same signal as the People view: opening it is a request to look at this
   * list, so the workspace reads the cities again, through that list's own
   * freshness floor.
   *
   * It used to fire when the editor was opened, which was the only moment the
   * rows' contents mattered. Now that every row states how many places are filed
   * under it, opening the menu is that moment.
   */
  onShowCities: () => void
  open: boolean
  onOpen: (open: boolean) => void
}

/**
 * Either this control has what it names, or it is waiting for it.
 *
 * A union rather than a bag of optionals, so the waiting form cannot be
 * rendered with half its handlers and the live form cannot be rendered
 * without them. There is nothing to pass while waiting, and the type says so.
 */
export type CityBarProps =
  | { waiting: true }
  | ({ waiting?: false } & CityBarLiveProps)

function CityBarLive({
  cities,
  markers,
  selectedCityId,
  onSelect,
  onSave,
  onDelete,
  onShowCities,
  open,
  onOpen,
}: CityBarLiveProps) {
  /** Which city's editor is open, by id. Null while the list is just a list. */
  const [editing, setEditing] = useState<string | null>(null)
  const selected = cities.find((city) => city.id === selectedCityId) ?? null

  /** Opening always starts at the list, never wherever it was last left. */
  function setOpen(next: boolean) {
    if (next) {
      setEditing(null)
      // Outside any state updater. React calls an updater twice in development
      // on purpose, so a read fired from in there would be sent twice every
      // time.
      onShowCities()
    }
    onOpen(next)
  }

  return (
    <Menu
      name="City"
      /*
        The selected city's name, or `All places` — not a `CITY` label beside a
        control that already says what it holds. The label was the only one of
        its kind in a row of controls that name themselves, and it shouted a
        category over a value reading `All places`, which is not a city.
      */
      label={<span className={styles.name}>{selected?.name ?? 'All places'}</span>}
      open={open}
      onOpen={setOpen}
      tone="quiet"
    >
      <p className={styles.heading}>Working on</p>

      <button
        type="button"
        onClick={() => {
          onSelect(null)
          setOpen(false)
        }}
        aria-current={selectedCityId === null}
        className={styles.row}
      >
        <span className={styles.rowName}>All places</span>
        <span className={styles.rowNote}>{countLabel(markers.length)}</span>
        {/* Holds the column the pencils occupy, so the names of the cities
            below line up with this one instead of stepping sideways. */}
        <span className={styles.penSlot} aria-hidden />
      </button>

      {cities.map((city) => {
        const count = markers.filter((marker) => marker.cityId === city.id).length
        return (
          <div key={city.id} className={styles.entry}>
            {/*
              Two controls on one line, and deliberately not one control with
              two meanings. Nesting a button inside a button is invalid markup
              and unreachable by keyboard, so they are siblings drawn as a row.
            */}
            <div className={styles.rowPair}>
              <button
                type="button"
                onClick={() => {
                  onSelect(city.id)
                  setOpen(false)
                }}
                aria-current={city.id === selectedCityId}
                className={styles.row}
              >
                <span className={styles.rowName}>{city.name}</span>
                <span className={styles.rowNote}>
                  {countLabel(count)}
                  {city.currency ? ` · ${city.currency}` : ' · no currency'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditing((current) => (current === city.id ? null : city.id))
                }
                aria-expanded={editing === city.id}
                aria-label={`Edit ${city.name}`}
                className={styles.pen}
              >
                <Pencil size={14} strokeWidth={2} aria-hidden />
              </button>
            </div>

            {editing === city.id ? (
              <CityEditor
                city={city}
                markerCount={count}
                // The editor closes itself when its write settles, rather than
                // being closed here as the write is sent. It is the only thing
                // on screen that can say the write is still happening.
                onSave={(patch) => onSave(city.id, patch)}
                onDelete={() => onDelete(city.id)}
                onClose={() => setEditing(null)}
              />
            ) : null}
          </div>
        )
      })}
    </Menu>
  )
}

/** `1 place` or `N places`, said the same way here as on the phone. */
function countLabel(count: number): string {
  return count === 1 ? '1 place' : `${count} places`
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
      <TextField label="Name" value={name} onChange={setName} autoFocus />
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

/**
 * CityBar, before and after its data.
 *
 * `waiting` is a variant of this control rather than a choice made by whoever
 * renders it, for the reason `write-feedback` gives about pending state: a flag
 * held by the screen cannot say *which* control it is about, and the control is
 * the only thing that knows what it looks like with nothing to show.
 *
 * The waiting form is the same `Menu` the live one renders. Only the label
 * differs, because the label is the part nobody knows yet.
 */
export function CityBar(props: CityBarProps) {
  if (props.waiting)
    return (
      <WaitingMenu name="City" labelClassName={styles.name} measure="11ch" />
    )
  return <CityBarLive {...props} />
}
