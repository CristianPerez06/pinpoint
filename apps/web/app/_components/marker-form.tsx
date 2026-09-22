'use client'

import {
  type City,
  type CityNotice,
  type FieldErrors,
  type MarkerFormValues,
  joinHours,
  localPriceClearedBy,
  pricesFromDraft,
  splitHours,
} from '@pinpoint/core'
import { MARKER_TYPES } from '@pinpoint/map'
import { ENGLISH_LANGUAGE, say } from '@pinpoint/wording'
import { X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { CurrencyField } from '@/app/_components/currency-field'
import { HoursField } from '@/app/_components/hours-field'
import { MarkerGlyph } from '@/app/_components/marker-icon'
import { markerTypeMessage } from '@/app/_components/marker-type-name'
import { usePending } from '@/lib/use-pending'
import {
  Button,
  FormError,
  notDimmed,
  overlayPanelClass,
  PriceField,
  Question,
  SelectField,
  TextField,
  useDismissible,
  useFocusReturn,
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

/** Blank is absent, never empty text. The two look identical in a form and are very different in a query. */
function absentIfBlank(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

const UNASSIGNED = '__unassigned'
const NEW_CITY = '__new'

export function MarkerForm({
  title,
  capturing,
  initial,
  cities,
  cityNotice,
  fieldErrors,
  message,
  notice,
  onSubmit,
  onCancel,
  onCreateCity,
}: {
  title: string
  /**
   * This form is capturing a place that does not exist yet.
   *
   * It decides what leaving costs, and it cannot be worked out from the fields:
   * a capture form opens already holding **a position somebody found on the
   * map**, which no field shows and nothing compares. `marker-capture` argues
   * that re-finding a spot is worse than retyping a name, so a capture form is
   * treated as holding work from the moment it opens, whether or not anything
   * has been typed into it.
   *
   * An edit form holds only what is already stored, so leaving it having
   * changed nothing costs nothing.
   */
  capturing: boolean
  initial: MarkerFormValues
  cities: readonly City[]
  /**
   * What the trip's cities had to say about where this place is, when it is
   * worth saying.
   *
   * Null in the ordinary case — a place near the city being worked in — and that
   * is a requirement rather than an absence. A form that remarks on every save
   * is noise, and noise is how the three saves a trip that matter get ignored.
   *
   * The form does not work any of this out. The rule lives in `@pinpoint/core`
   * and the parent applies it, because deciding this needs the trip's markers
   * and this component has never seen one.
   */
  cityNotice: CityNotice | null
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
  /**
   * Absent where the surface raising this form cannot make a city — the
   * calendar, which never shows where anything is and so cannot show what it
   * would be creating.
   *
   * Optionality is the whole mechanism, not a convenience. The offer is drawn
   * only when this is passed, so a surface cannot present one it has no way to
   * honour. A boolean beside a handler could disagree with it; this cannot.
   *
   * The calendar used to pass `async () => null` to mean the same thing, and
   * the form read that as a creation that failed: `+ New city…` was offered,
   * and answering it said "Could not create that city." every time.
   */
  onCreateCity?: (name: string, currency: string | null) => Promise<City | null>
}) {
  /**
   * Whether the question about leaving is standing.
   *
   * A separate state from the form's own fields, so declining puts everything
   * back untouched — the question replaces nothing and edits nothing.
   */
  const [leaving, setLeaving] = useState(false)
  const [name, setName] = useState(initial.name)
  const [note, setNote] = useState(initial.note ?? '')
  const [cityId, setCityId] = useState<string | null>(initial.cityId)
  const [type, setType] = useState(initial.type)
  const [link, setLink] = useState(initial.link ?? '')
  // A free place is a price of 0, and opens as Free with an empty box rather
  // than as an amount of nothing.
  const [free, setFree] = useState(initial.price === 0)
  const [price, setPrice] = useState(
    initial.price === null || initial.price === 0 ? '' : String(initial.price),
  )
  // The second box, kept per currency rather than as one string. Refiling the
  // place to a city with another currency shows that currency's box, empty, and
  // choosing the first city again brings back what was in its box — nothing is
  // lost until the place is saved.
  const [localByCurrency, setLocalByCurrency] = useState<Record<string, string>>(() =>
    initial.localPrice !== null && initial.localCurrency !== null
      ? { [initial.localCurrency]: String(initial.localPrice) }
      : {},
  )
  const [plannedOn, setPlannedOn] = useState(initial.plannedOn ?? '')
  const [plannedUntil, setPlannedUntil] = useState(initial.plannedUntil ?? '')
  /**
   * Whether the second date field is showing.
   *
   * Seeded from the place, so editing one that already spans days opens with
   * both fields rather than asking for the run to be declared again. Otherwise
   * a place is one day and the form looks exactly as it did before runs
   * existed — which is the point: almost every place is one day, and a second
   * date field standing permanently under the first would be a field most
   * places pass through empty.
   */
  const [extended, setExtended] = useState(initial.plannedUntil !== null)
  // Opened as the days and their one range, and turned back into a week on
  // saving — both by the same pair of functions the phone uses.
  const [hours, setHours] = useState(() => splitHours(initial.hours))

  // Creating a city happens inside this form so the place being saved is never
  // lost to a detour. `null` means the detour is closed.
  const [newCity, setNewCity] = useState<{ name: string; currency: string | null } | null>(
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

  const chosenCity = cities.find((city) => city.id === cityId) ?? null
  const currency = chosenCity?.currency ?? null
  const local = currency === null ? '' : (localByCurrency[currency] ?? '')
  const cleared = localPriceClearedBy(initial, currency)

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
        // Free is a price of 0, and so is a typed 0 in either box. A blank price
        // is absent — not entered yet — and must not collapse into free.
        ...pricesFromDraft({ free, usd: price, local, currency }),
        // A date control empties to `''`, which is the field being cleared and
        // therefore a place going back to having no day — not a day of no
        // characters.
        plannedOn: absentIfBlank(plannedOn),
        // A run with no beginning is not a run. Clearing the day clears the
        // last day with it, whatever is still sitting in the second field.
        plannedUntil: plannedOn === '' ? null : absentIfBlank(plannedUntil),
        // No day on is no hours, whatever was typed before the days went off.
        hours: joinHours(hours),
      }),
    )
  }

  function createCity() {
    if (!newCity || !onCreateCity) return
    setCityError(null)

    startCreateCity(async () => {
      const created = await onCreateCity(newCity.name.trim(), newCity.currency)

      if (!created) {
        setCityError('Could not create that city.')
        return
      }

      setCityId(created.id)
      setNewCity(null)
    })
  }

  /**
   * Whether anything here would be lost by closing.
   *
   * Compared against what the form opened with rather than tracked by a flag,
   * so that typing a letter and deleting it leaves nothing to ask about.
   *
   * **The position is not in this comparison, and that is the point.** A form
   * capturing a new place carries a spot somebody found on the map, and
   * `marker-capture` argues that re-finding a spot is worse than retyping a
   * name. So a capture form is treated as holding work from the moment it
   * opens, whether or not a field has been touched.
   */
  const entered =
    capturing ||
    name.trim() !== initial.name ||
    absentIfBlank(note) !== (initial.note ?? null) ||
    cityId !== initial.cityId ||
    type !== initial.type ||
    absentIfBlank(link) !== (initial.link ?? null) ||
    absentIfBlank(plannedOn) !== (initial.plannedOn ?? null) ||
    absentIfBlank(plannedUntil) !== (initial.plannedUntil ?? null)

  /**
   * Leaving, asked about where there is something to lose.
   *
   * `workspace-chrome` requires a way out that does not involve hunting for one
   * particular button, and `marker-capture` requires that what was entered
   * survives. Those pull in opposite directions only if Escape is made to
   * choose between them: the way out is always there, and where taking it would
   * destroy something, taking it asks.
   */
  const panel = useRef<HTMLFormElement | null>(null)
  const leave = useCallback(() => {
    if (entered) {
      setLeaving(true)
      return
    }
    onCancel()
  }, [entered, onCancel])

  useDismissible({ open: true, onDismiss: leave, panel, isDimmed: notDimmed })
  useFocusReturn(panel)

  return (
    <form
      ref={panel}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
      className={`${overlayPanelClass} ${styles.form}`}
      /*
       * The browser does not get to refuse this form.
       *
       * Found by looking: clearing the day a segment at a time leaves the date
       * control holding `dd/09/2026`, which is *incomplete* rather than empty.
       * Native validation then blocked the submit entirely — so a person could
       * not save the name they had just corrected either — and said so in a
       * grey bubble reading "Please enter a valid value. The field is
       * incomplete or has an invalid date."
       *
       * Two things are wrong with that. It is the browser's voice rather than
       * the product's, which this repository has a standing position against;
       * and it refuses the whole form over one optional field. An incomplete
       * date reports its value as `''`, which this form already reads as "no
       * day yet" — the honest answer for a date that is not a date.
       *
       * Everything native validation was doing here is done better by the
       * schema: the link is `z.url()`, the price is a non-negative number, and
       * both come back as a message under the field they belong to.
       */
      noValidate
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
          onClick={leave}
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
            const name = say(ENGLISH_LANGUAGE, markerTypeMessage(definition.id))

            return (
              <button
                key={definition.id}
                type="button"
                className={styles.type}
                aria-pressed={chosen}
                onClick={() => setType(definition.id)}
                title={name}
              >
                <span
                  className={styles.typeChip}
                  style={{
                    backgroundColor: chosen
                      ? `var(--pp-pin-${definition.id})`
                      : 'var(--pp-surface-muted)',
                    color: chosen ? 'var(--pp-marker-foreground)' : 'var(--pp-ink-muted)',
                  }}
                >
                  <MarkerGlyph icon={definition.icon} size={15} />
                </span>
                {name}
              </button>
            )
          })}
        </div>
        {fieldErrors.type ? (
          <span role="alert" className={styles.typeError}>
            {say(ENGLISH_LANGUAGE, fieldErrors.type)}
          </span>
        ) : null}
      </div>

      <SelectField
        label="City"
        value={cityId ?? UNASSIGNED}
        onChange={(value) => {
          if (value === NEW_CITY) {
            setNewCity({ name: '', currency: null })
            return
          }
          setCityId(value === UNASSIGNED ? null : value)
        }}
        error={fieldErrors.cityId}
        options={[
          { value: UNASSIGNED, label: 'Unassigned' },
          ...cities.map((city) => ({ value: city.id, label: city.name })),
          // Absent, rather than present and refusing, where the surface cannot
          // create one. See `onCreateCity`.
          ...(onCreateCity ? [{ value: NEW_CITY, label: '+ New city…' }] : []),
        ]}
      />

      <TextField
        label="Day"
        type="date"
        value={plannedOn}
        onChange={(value) => {
          setPlannedOn(value)
          // Clearing the day clears the run with it and puts the second field
          // away: a last day with nothing to start from is not something the
          // store will take, and leaving it on screen would offer it anyway.
          if (value === '') {
            setPlannedUntil('')
            setExtended(false)
          }
        }}
        error={fieldErrors.plannedOn}
        hint="Which day of the trip you plan to go. Leave it blank to decide later."
      />

      {/*
        The offer, and then the field.

        Nothing to extend until there is a day, so neither appears before one is
        chosen. Named for the days rather than for a kind of place: a run of days
        is a fact about days, and a rail pass or a festival has one as readily as
        a hotel — `This is a stay` would have read as setting the type, which is
        one of the eight a place can have.
      */}
      {plannedOn !== '' && !extended ? (
        <button
          type="button"
          className={styles.extendDay}
          onClick={() => setExtended(true)}
        >
          + More than one day
        </button>
      ) : null}

      {plannedOn !== '' && extended ? (
        <TextField
          label="Until"
          type="date"
          value={plannedUntil}
          // Emptying the field is the way back out, so there is one act rather
          // than a separate control to find — and no question about what
          // happens to a date typed into a field being hidden.
          onChange={(value) => {
            setPlannedUntil(value)
            if (value === '') setExtended(false)
          }}
          error={fieldErrors.plannedUntil}
          hint="The last day it is planned for. Clear it to go back to one day."
        />
      ) : null}

      {cityNotice ? (
        <div className={styles.cityNotice}>
          <p role="status" className={styles.cityNoticeText}>
            {say(ENGLISH_LANGUAGE, cityNotice.message)}
          </p>
          {cityNotice.offer && !newCity ? (
            <Button
              onClick={() => setNewCity({ name: cityNotice.offer ?? '', currency: null })}
              tone="quiet"
            >
              {`Create ${cityNotice.offer}`}
            </Button>
          ) : null}
        </div>
      ) : null}

      {newCity ? (
        <div className={styles.newCity}>
          <TextField
            label="New city name"
            value={newCity.name}
            onChange={(value) => setNewCity({ ...newCity, name: value })}
            placeholder="Kyoto"
            autoFocus
          />
          <CurrencyField
            value={newCity.currency}
            onChange={(code) => setNewCity({ ...newCity, currency: code })}
            hint={`Places in ${newCity.name.trim() || 'this city'} get a ${newCity.currency ?? ''} price box beside the dollars.`}
          />
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

      <HoursField draft={hours} onChange={setHours} error={fieldErrors.hours} />

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

      <PriceField
        value={price}
        onChange={setPrice}
        free={free}
        onFreeChange={setFree}
        error={fieldErrors.price}
        local={
          currency === null || chosenCity === null
            ? undefined
            : {
                currency,
                value: local,
                onChange: (value) =>
                  setLocalByCurrency((current) => ({ ...current, [currency]: value })),
                hint: `${currency} is ${chosenCity.name}'s currency. Type it as you saw it; nothing is converted.`,
                error: fieldErrors.localPrice,
              }
        }
        warning={
          cleared === null
            ? null
            : chosenCity === null
              ? `Leaving this place without a city clears the ${cleared} saved for it.`
              : `Moving to ${chosenCity.name} clears the ${cleared} saved for this place.`
        }
      />

      {/*
        Leaving, asked about where there is something to lose — and drawn in
        place of the footer, so `Save place` is not standing live beside a
        question about throwing away what it would save.
      */}
      {leaving ? (
        <Question
          question="Discard what you typed?"
          consequence={
            capturing
              ? 'The place you found on the map goes with it.'
              : 'Your changes to this place are not saved.'
          }
          confirm="Discard"
          onConfirm={onCancel}
          onDecline={() => setLeaving(false)}
        />
      ) : (
      <div className={styles.actions}>
        <Button type="submit" tone="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save place'}
        </Button>
        <Button onClick={leave} tone="quiet">
          Cancel
        </Button>
      </div>
      )}
    </form>
  )
}
