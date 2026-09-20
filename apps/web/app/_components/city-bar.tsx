'use client'

import type { City, Marker } from '@pinpoint/core'
import { localPricesUnder, UNASSIGNED_CITY } from '@pinpoint/core'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'

import { CurrencyField } from '@/app/_components/currency-field'
import { Button, Menu, Question, TextField, WaitingMenu } from '@/app/_components/ui'
import { usePending } from '@/lib/use-pending'

import styles from './city-bar.module.css'

/**
 * Choosing which group of places is being worked on, and correcting a group
 * after the fact.
 *
 * Selecting a city does two things, and it used to do three: it frames the map
 * on that city's places and biases place search toward them. It no longer
 * becomes the default for the next place saved — where a place is filed is
 * decided by where the place actually is, because a selection says what is being
 * *looked at* and filing says where something *is*. It does not filter the map
 * either: hiding the rest would answer "what is near what" with a lie, and
 * filtering is a change with a whole vocabulary of its own.
 *
 * ## Unassigned is a row like any other
 *
 * `marker-capture` and `markers` both say a place saved without a city "appears
 * among the trip's markers, grouped as unassigned", and until this row existed
 * there was no such group: such a place sat in no bucket that could be selected
 * and was findable only by opening it. It is drawn whether or not it holds
 * anything, for the reason `marker-filtering` gives about the filter control — a
 * row that appears on demand moves everything beside it, and makes the way to a
 * place discoverable only once you already have one.
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
  /** Renaming a city, awaited so the editor can say it is saving. */
  onSave: (cityId: string, patch: CityEdit) => Promise<unknown>
  onDelete: (cityId: string) => Promise<unknown>
  /**
   * Making one, through the same path the place form uses.
   *
   * Resolves to the city, or to null where the write was refused — the same
   * contract the form's creation already has, so two routes cannot produce
   * differently formed cities.
   *
   * Creating deliberately does **not** select. A city with no places has
   * nothing for the map to frame on (`marker-capture`: a city holding no
   * markers claims nothing), so selecting it would put its name over a map
   * showing none of it, which reads as a failure rather than a fresh start.
   * The reason to make one early is that a searched place the geocoder reports
   * as being in Nara files itself under a city named Nara whether or not that
   * city holds anything yet.
   */
  onCreateCity: (name: string, currency: string | null) => Promise<City | null>
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
  onCreateCity,
  onShowCities,
  open,
  onOpen,
}: CityBarLiveProps) {
  /** Which city's editor is open, by id. Null while the list is just a list. */
  const [editing, setEditing] = useState<string | null>(null)
  /** Whether the creator is open. Never open at the same time as an editor. */
  const [creating, setCreating] = useState(false)
  const selected = cities.find((city) => city.id === selectedCityId) ?? null

  /**
   * What the bar calls the selection.
   *
   * Three states, so three names. Unassigned resolves to no city — it is defined
   * by the absence of one — and would otherwise fall through to `All places`,
   * which is the widest view rather than this narrow one and would leave the bar
   * saying the opposite of what is on the map.
   */
  const selectionName =
    selectedCityId === UNASSIGNED_CITY
      ? 'Unassigned'
      : (selected?.name ?? 'All places')

  /** Opening always starts at the list, never wherever it was last left. */
  function setOpen(next: boolean) {
    if (next) {
      setEditing(null)
      setCreating(false)
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
        What the selection is called — a city's name, `All places`, or
        `Unassigned` — not a `CITY` label beside a
        control that already says what it holds. The label was the only one of
        its kind in a row of controls that name themselves, and it shouted a
        category over a value reading `All places`, which is not a city.
      */
      label={<span className={styles.name}>{selectionName}</span>}
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

            {editing === city.id && !creating ? (
              <CityEditor
                city={city}
                markerCount={count}
                localCount={localPricesUnder(city.id, markers)}
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

      {/*
        Below the cities rather than beside `All places`, because it is a
        narrowing like a city and not a widening like that one. Its count is
        stated the same way, so the rows above plus this one account for the
        whole trip.
      */}
      <button
        type="button"
        onClick={() => {
          onSelect(UNASSIGNED_CITY)
          setOpen(false)
        }}
        aria-current={selectedCityId === UNASSIGNED_CITY}
        className={styles.row}
      >
        <span className={styles.rowName}>Unassigned</span>
        <span className={styles.rowNote}>
          {countLabel(markers.filter((marker) => marker.cityId === null).length)}
        </span>
        {/* Holds the pencil column, as `All places` does. There is nothing to
            edit here: a group defined by the absence of a city has no name of
            its own. */}
        <span className={styles.penSlot} aria-hidden />
      </button>

      {/*
        Making a city, pinned to the foot of the panel.

        Sticky rather than a sibling of the scrolling area, because the panel
        this renders into *is* the scrolling area — `.menuPanel` in `ui.tsx`
        carries the `max-height` and `overflow-y`, and it is shared by the trip,
        filter and account menus as well. Sticking the row to the panel's inner
        bottom edge keeps it reachable on a trip with more cities than fit,
        which `workspace-chrome` requires, without restructuring a primitive
        three other menus depend on.

        At the foot rather than the head: the first row is where the current
        selection is read, and an action there competes with the thing the
        control exists to show.
      */}
      <div className={styles.foot}>
        {creating ? (
          <CityCreator
            existing={cities}
            onCreate={onCreateCity}
            onClose={() => setCreating(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setCreating(true)
            }}
            className={styles.create}
          >
            <Plus size={14} strokeWidth={2.5} aria-hidden />
            <span>New city…</span>
          </button>
        )}
      </div>
    </Menu>
  )
}

/**
 * Making a city from the list, rather than while saving a place.
 *
 * It asks for the same two things `CityEditor` lets a person change afterwards,
 * and the same two the place form collects when it creates one mid-save. A
 * third shape for one record is how the routes start to disagree.
 *
 * It does not select what it creates — see `onCreateCity` on the props above.
 */
function CityCreator({
  existing,
  onCreate,
  onClose,
}: {
  existing: readonly City[]
  onCreate: (name: string, currency: string | null) => Promise<City | null>
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, startCreate] = usePending()

  const trimmed = name.trim()

  /**
   * Refused here rather than by the database, because the database has no
   * opinion about it: two cities of one name are legal rows and a nonsense
   * trip. The place form already declines to offer a name the trip holds, for
   * the same reason. Compared on the same normalised text `marker-capture`
   * uses to match a geocoded city name, so the two agree on what "already
   * holds" means.
   */
  function nameIsTaken(): boolean {
    const normalise = (value: string) =>
      value.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
    return existing.some((city) => normalise(city.name) === normalise(trimmed))
  }

  function create() {
    if (trimmed === '') {
      setError('Give the city a name.')
      return
    }
    if (nameIsTaken()) {
      setError(`This trip already has a city called “${trimmed}”.`)
      return
    }
    setError(null)
    startCreate(async () => {
      const created = await onCreate(trimmed, currency)
      // Nothing is cleared on a refusal. What was typed is the only copy of it,
      // and the workspace has already said why over the map.
      if (!created) return
      onClose()
    })
  }

  return (
    <div className={styles.editor}>
      <TextField
        label="Name"
        value={name}
        onChange={(next) => {
          setName(next)
          setError(null)
        }}
        error={error ?? undefined}
        autoFocus
      />
      <CurrencyField
        value={currency}
        onChange={setCurrency}
        hint={`Places in ${trimmed || 'this city'} get a ${currency ?? ''} price box beside the dollars.`}
      />

      <div className={styles.actions}>
        <Button tone="primary" onClick={create} disabled={creating}>
          {creating ? 'Creating…' : 'Create city'}
        </Button>
        <Button tone="quiet" disabled={creating} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

/** `1 place` or `N places`, said the same way here as on the phone. */
function countLabel(count: number): string {
  return count === 1 ? '1 place' : `${count} places`
}

/** What the editor writes: a name, and the second currency or none. */
export interface CityEdit {
  name: string
  currency: string | null
}

/**
 * `4 of them lose their JPY price; their USD prices stay.` — the sentence every
 * warning about clearing local prices shares, so the three say it the same way.
 */
function localLoss(count: number, currency: string, lead: string): string {
  return `${lead} ${count === 1 ? 'loses its' : 'lose their'} ${currency} price; ${
    count === 1 ? 'its USD price stays' : 'their USD prices stay'
  }.`
}

function CityEditor({
  city,
  markerCount,
  localCount,
  onSave,
  onDelete,
  onClose,
}: {
  city: City
  markerCount: number
  /** How many of this city's places have a local price, which a change of currency clears. */
  localCount: number
  onSave: (patch: CityEdit) => Promise<unknown>
  onDelete: () => Promise<unknown>
  onClose: () => void
}) {
  const [name, setName] = useState(city.name)
  const [currency, setCurrency] = useState(city.currency)

  /**
   * Two writes, two flags. Saving is optimistic — the picker shows the new name
   * at once — and removing is not, because unassigning a city's places cannot
   * be undone. Both keep this editor open until the database answers, which is
   * what gives each control somewhere to say what it is doing.
   */
  const [saving, startSave] = usePending()
  const [removing, startRemove] = usePending()
  const busy = saving || removing

  /**
   * Which question is standing, or none.
   *
   * Two acts here destroy something, and they ask the same way. One value
   * rather than two flags because only one can ever stand: the editor shows
   * the question *instead of* its fields, so there is nowhere for a second.
   */
  const [asking, setAsking] = useState<'currency' | 'remove' | null>(null)

  /**
   * Whether changing the currency would lose anything.
   *
   * Changing or removing a currency no place has used yet is just a save. The
   * rule is what is lost, not what the act is called.
   */
  const currencyLoses =
    currency !== city.currency && city.currency !== null && localCount > 0

  function currencyQuestion(): string {
    return currency === null
      ? `Remove ${city.currency} from “${city.name}”?`
      : `Change “${city.name}” to ${currency}?`
  }

  function currencyConsequence(): string {
    const places = localCount === 1 ? '1 place' : `${localCount} places`
    return `${places} in ${city.name} ${localCount === 1 ? 'has' : 'have'} a ${city.currency} price. ${
      localCount === 1 ? 'It' : 'They'
    } will lose it${currency === null ? '' : ', not have it converted'}. ${
      localCount === 1 ? 'Its USD price stays' : 'Their USD prices stay'
    }.`
  }

  /**
   * What removing this city costs, counted.
   *
   * The consequence lands on rows the person is not looking at, so the count is
   * stated rather than left to be discovered.
   */
  function removalConsequence(): string {
    const consequence =
      markerCount === 0
        ? 'It holds no places.'
        : `${markerCount} ${markerCount === 1 ? 'place' : 'places'} will become unassigned. They are not deleted.`
    // Unassigned is a city with no currency, so local prices go too.
    const loss =
      localCount === 0 || city.currency === null
        ? ''
        : ` ${localLoss(localCount, city.currency, markerCount === 1 ? 'It' : `${localCount} of them`)}`
    return `${consequence}${loss}`
  }

  function save() {
    startSave(async () => {
      await onSave({ name: name.trim(), currency })
      onClose()
    })
  }

  /*
    The question replaces the editor's body rather than merely swapping its
    footer, which is what the place card does.

    Two reasons. The fields above offer `Save`, a different write, and leaving
    them live invites somebody to type into a record they are being asked to
    destroy. And the removal consequence is the longest sentence in the product
    — it wants the body's width rather than a band beneath it.
  */
  if (asking !== null) {
    const removingCity = asking === 'remove'
    return (
      <div className={styles.editor}>
        <Question
          question={removingCity ? `Remove “${city.name}”?` : currencyQuestion()}
          consequence={
            removingCity ? removalConsequence() : currencyConsequence()
          }
          confirm={removingCity ? 'Remove city' : 'Save'}
          waiting={busy}
          onConfirm={() => {
            if (!removingCity) {
              save()
              return
            }
            startRemove(async () => {
              await onDelete()
              onClose()
            })
          }}
          onDecline={() => setAsking(null)}
        />
      </div>
    )
  }

  return (
    <div className={styles.editor}>
      <TextField label="Name" value={name} onChange={setName} autoFocus />
      <CurrencyField
        value={currency}
        onChange={setCurrency}
        hint={`Places in ${name.trim() || city.name} get a ${currency ?? ''} price box beside the dollars.`}
      />

      <div className={styles.actions}>
        <Button
          tone="primary"
          onClick={() => {
            // Nothing to write is not a write. Closing without sending is the
            // correct answer to a Save that changed nothing.
            if (name.trim() === city.name && currency === city.currency) {
              onClose()
              return
            }
            if (currencyLoses) {
              setAsking('currency')
              return
            }
            save()
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
            onClick={() => setAsking('remove')}
          >
            Remove city
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
