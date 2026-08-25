'use client'

import type { Trip, TripMember } from '@pinpoint/core'
import { useState } from 'react'

import { CreateTripForm } from '@/app/_components/trip-setup'
import { Button, FormError, TextField } from '@/app/_components/ui'
import { usePending } from '@/lib/use-pending'

import styles from './trip-bar.module.css'

/**
 * Which trip is being looked at, what it is called, and who is on it.
 *
 * All three live together because they are the same subject and because they
 * share one piece of state that must not be duplicated: the member list. A
 * separate invite control somewhere else would hold its own copy, and the
 * moment somebody was invited the filter and the interest rows would still be
 * working from the list they were handed at render.
 *
 * It sits in the toolbar rather than the page header, which is where the trip's
 * name used to be shown. The header is rendered on the server and cannot follow
 * a rename; this can.
 */
export function TripBar({
  trip,
  trips,
  members,
  onSelect,
  onRename,
  onInvite,
  onCreated,
}: {
  trip: Trip
  /** Every trip this account belongs to. One is the ordinary case. */
  trips: readonly Trip[]
  members: readonly TripMember[]
  onSelect: (tripId: string) => void
  /**
   * Awaited so the detour can stay open and say `Saving…` until it settles.
   *
   * The rename itself is optimistic — the name changes on screen at once and
   * goes back if the database refuses — but the control that started it is
   * still here, and it is the honest place to say the round trip has not
   * finished.
   */
  onRename: (name: string) => Promise<unknown>
  /** Opens the trip that was just made. */
  onCreated: (tripId: string) => void
  /** Resolves to a field error when the address is refused, or null on success. */
  onInvite: (
    displayName: string,
    email: string,
  ) => Promise<{ field: string; message: string } | null>
}) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(trip.name)
  /** This detour's own write, held here rather than shared with the workspace's. */
  const [saving, startSave] = usePending()
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  /** Only one detour open at a time; three panels in the same place is a mess. */
  function open(which: 'rename' | 'people' | 'create' | null) {
    setRenaming(which === 'rename')
    setPeopleOpen(which === 'people')
    setCreating(which === 'create')
  }

  return (
    <div className={styles.bar}>
      {/*
        A picker only when there is something to pick between.

        Most of the time this product has one trip, and a select of length one is
        a control that looks like a choice and is not. The name is still shown,
        because it answers which trip these markers belong to — which becomes a
        real question the moment a second one can exist.
      */}
      {trips.length > 1 ? (
        <label className={styles.picker}>
          <span className={styles.label}>Trip</span>
          <select
            value={trip.id}
            onChange={(event) => onSelect(event.target.value)}
            className={styles.select}
          >
            {trips.map((each) => (
              <option key={each.id} value={each.id}>
                {each.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span className={styles.name}>{trip.name}</span>
      )}

      <Button
        tone="quiet"
        onClick={() => {
          setName(trip.name)
          open(renaming ? null : 'rename')
        }}
        title="Rename this trip"
      >
        Rename
      </Button>

      <Button
        tone="quiet"
        onClick={() => open(peopleOpen ? null : 'people')}
        title="See who is on this trip, and add somebody"
      >
        People ({members.length})
      </Button>

      {/*
        Making another one.

        Here rather than only on the empty state, which is where it was at first
        and is only half the requirement: any signed-in person may create a trip,
        not only somebody who has none. The empty state is the first trip; this is
        every one after it.
      */}
      <Button
        tone="quiet"
        onClick={() => open(creating ? null : 'create')}
        title="Start another trip"
      >
        New trip
      </Button>

      {renaming ? (
        <div className={styles.detour}>
          <TextField label="Trip name" value={name} onChange={setName} autoFocus />
          <div className={styles.row}>
            <Button
              tone="primary"
              disabled={saving || name.trim() === '' || name.trim() === trip.name}
              onClick={() =>
                // The detour closes when the write settles, not when it is
                // sent. Closing first left nothing on screen that could report
                // either that it was still happening or that it was refused.
                startSave(async () => {
                  await onRename(name.trim())
                  open(null)
                })
              }
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button tone="quiet" onClick={() => open(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {peopleOpen ? (
        <People members={members} onInvite={onInvite} onClose={() => open(null)} />
      ) : null}

      {creating ? (
        <div className={styles.detour}>
          <p className={styles.hint}>
            A trip is one shared map, separate from this one. Nothing here moves
            across.
          </p>
          <CreateTripForm
            onCreated={(tripId) => {
              open(null)
              onCreated(tripId)
            }}
          />
          <div className={styles.row}>
            <Button tone="quiet" onClick={() => open(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Who is on the trip, and adding somebody.
 *
 * The list is not decoration. An invitation is matched on an email address and
 * delivered by whoever sent it — so a mistyped address produces a member row
 * nobody can ever claim, and two screens that both look correct: the inviter
 * sees the name they typed, and the invited person sees an empty trip list they
 * cannot explain. Neither can diagnose it and only the inviter can fix it.
 *
 * Marking who has not joined, and at what address, is the whole of the feedback
 * loop. `userId` has been fetched since the interest change and displayed
 * nowhere until now.
 */
function People({
  members,
  onInvite,
  onClose,
}: {
  members: readonly TripMember[]
  onInvite: (
    displayName: string,
    email: string,
  ) => Promise<{ field: string; message: string } | null>
  onClose: () => void
}) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [adding, startInvite] = usePending()

  function invite() {
    setErrors({})
    setMessage(null)

    startInvite(async () => {
      const problem = await onInvite(displayName.trim(), email.trim())
      if (problem) {
        if (problem.field === '_') setMessage(problem.message)
        else setErrors({ [problem.field]: problem.message })
        return
      }

      setDisplayName('')
      setEmail('')
    })
  }

  return (
    <div className={styles.detour}>
      <ul className={styles.people}>
        {members.map((member) => (
          <li key={member.id} className={styles.person}>
            <span className={styles.personName}>{member.displayName}</span>
            {member.userId === null ? (
              <span className={styles.pending}>
                not joined yet · {member.email}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <p className={styles.hint}>
        Adding somebody puts them on the trip straight away. Nothing is sent —
        tell them yourself, and the trip appears when they sign in with this
        address.
      </p>

      <TextField
        label="Name"
        value={displayName}
        onChange={setDisplayName}
        error={errors.displayName}
        placeholder="What to call them on this trip"
      />
      <TextField
        label="Email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        placeholder="The address they will sign in with"
        type="email"
      />

      {message ? <FormError message={message} /> : null}

      <div className={styles.row}>
        <Button
          tone="primary"
          disabled={adding || displayName.trim() === '' || email.trim() === ''}
          onClick={invite}
        >
          {adding ? 'Adding…' : 'Add to trip'}
        </Button>
        <Button tone="quiet" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}
