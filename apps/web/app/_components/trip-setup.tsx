'use client'

import type { FieldErrors } from '@pinpoint/core'
import { createTrip } from '@pinpoint/data'
import { message, type Message } from '@pinpoint/wording'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { useSay } from '@/app/_components/language'
import { Button, FormError, TextField } from '@/app/_components/ui'
import { createClient } from '@/lib/supabase/client'

import styles from './trip-setup.module.css'

/**
 * What somebody on no trips sees, which until now was a full stop.
 *
 * Both applications rendered "You are not on any trips yet." and offered
 * nothing. That was honest while a trip could only arrive by migration; it is a
 * dead end now that one can be made.
 *
 * Two people land here and they need different things. Somebody starting out
 * needs to make a trip. Somebody who was told they had been added to one needs
 * to know why they cannot see it — and the answer is almost always that the
 * address they signed up with is not the address they were added at.
 *
 * What this deliberately does not do is check. Telling an arbitrary account
 * whether an invitation exists for some address would let anyone learn who is on
 * what trip by typing addresses in, and there is no version of that which is
 * worth the convenience.
 */
export function TripSetup() {
  const router = useRouter()
  const say = useSay()

  return (
    <div className={styles.setup}>
      <h1 className={styles.title}>{say(message('tripSetup.title'))}</h1>
      <p className={styles.lead}>{say(message('tripSetup.lead'))}</p>

      <CreateTripForm
        onCreated={(tripId) => {
          router.replace(`/?trip=${tripId}`)
          router.refresh()
        }}
      />

      <p className={styles.note}>
        <strong>{say(message('tripSetup.expectingQuestion'))}</strong>{' '}
        {say(message('tripSetup.expectingAnswer'))}
      </p>
    </div>
  )
}

/**
 * The two questions, and nothing around them.
 *
 * Split out because there are two ways in and they are not the same screen. The
 * first trip is made from an empty state that also has to explain why somebody
 * might be seeing it; the second is made from a control beside the trip you are
 * already on, where that explanation would be noise.
 *
 * Building only the first was an oversight caught by using it: the requirement
 * says any signed-in person may create a trip, and only its *scenario* was about
 * having none.
 */
export function CreateTripForm({
  onCreated,
}: {
  onCreated: (tripId: string) => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const say = useSay()

  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [note, setNote] = useState<Message | null>(null)

  async function create() {
    setBusy(true)
    setFieldErrors({})
    setNote(null)

    const outcome = await createTrip(supabase, {
      name: name.trim(),
      displayName: displayName.trim(),
      // Blank is no date, not an empty one. Both are skippable and most trips
      // are created before either is settled.
      startsOn: startsOn === '' ? null : startsOn,
      endsOn: endsOn === '' ? null : endsOn,
    })

    setBusy(false)

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else setNote(outcome.reason)
      return
    }

    // Straight into the trip that was just made, rather than back to a list.
    // What that means is the caller's business: from the empty state it is the
    // whole navigation, and from the trip bar it is a switch.
    onCreated(outcome.data.id)
  }

  return (
    <>
      <TextField
        label={say(message('tripSetup.nameLabel'))}
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        placeholder={say(message('tripSetup.namePlaceholder'))}
        autoFocus
      />

      {/*
        Asked here rather than derived, because there is no later moment that
        asks. The database could take the local part of the email address and
        nobody would have chosen it — a member list reading `cristian.ap84` is
        the result, permanently.
      */}
      <TextField
        label={say(message('tripSetup.displayNameLabel'))}
        value={displayName}
        onChange={setDisplayName}
        error={fieldErrors.displayName}
        placeholder={say(message('tripSetup.displayNamePlaceholder'))}
      />

      {/*
        Offered, never required. A trip is usually created before its dates are
        known — the list of places is what accumulates first — so asking for
        them and refusing to continue without them would make the product
        decline the state most trips start in. They decide nothing except which
        day the calendar opens on.
      */}
      <div className={styles.dates}>
        <TextField
          label={say(message('trip.startDate'))}
          type="date"
          value={startsOn}
          onChange={setStartsOn}
          error={fieldErrors.startsOn}
        />
        <TextField
          label={say(message('trip.endDate'))}
          type="date"
          value={endsOn}
          onChange={setEndsOn}
          error={fieldErrors.endsOn}
        />
      </div>

      {note ? <FormError message={say(note)} /> : null}

      <Button
        tone="primary"
        disabled={busy || name.trim() === '' || displayName.trim() === ''}
        onClick={() => void create()}
      >
        {say(busy ? message('common.creating') : message('tripSetup.create'))}
      </Button>
    </>
  )
}
