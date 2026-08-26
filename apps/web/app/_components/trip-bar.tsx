'use client'

import type { Trip, TripMember } from '@pinpoint/core'
import { useState } from 'react'

import { CreateTripForm } from '@/app/_components/trip-setup'
import { Button, FormError, Menu, TextField } from '@/app/_components/ui'
import { usePending } from '@/lib/use-pending'

import styles from './trip-bar.module.css'

/**
 * Which trip is being looked at, what it is called, and who is on it.
 *
 * All of it behind the trip's own name, which is the control rather than a
 * label beside one. Pressing the thing you are about to change is the shortest
 * line between the question and the answer, and it spends no space: the name
 * was already on screen saying which trip these places belong to.
 *
 * This used to be four controls in a row of their own — the name, `Rename`,
 * `People (n)` and `New trip` — occupying the topmost, leftmost strip of the
 * whole interface for three actions a person performs about once per trip in
 * total. The bar is charged against the map, and prominence there is the
 * scarcest thing the screen has.
 *
 * They live together because they are the same subject and because they share
 * one piece of state that must not be duplicated: the member list. A separate
 * invite control somewhere else would hold its own copy, and the moment
 * somebody was invited the filter and the interest rows would still be working
 * from the list they were handed at render.
 */

/** Which face of the panel is showing. Reset whenever the menu closes. */
type View = 'root' | 'rename' | 'people' | 'create'

export function TripBar({
  trip,
  trips,
  members,
  onSelect,
  onRename,
  onInvite,
  onShowPeople,
  onCreated,
  open,
  onOpen,
}: {
  trip: Trip
  /** Every trip this account belongs to. One is the ordinary case. */
  trips: readonly Trip[]
  members: readonly TripMember[]
  onSelect: (tripId: string) => void
  /**
   * Awaited so the panel can stay open and say `Saving…` until it settles.
   *
   * The rename itself is optimistic — the name changes on screen at once and
   * goes back if the database refuses — but the control that started it is
   * still here, and it is the honest place to say the round trip has not
   * finished.
   */
  onRename: (name: string) => Promise<unknown>
  /**
   * The People view has just been shown.
   *
   * Opening it is somebody saying "show me who is on this trip", which is the
   * same signal as coming back to the tab at the scale of one list — so the
   * workspace reads the members again. It goes through that list's own
   * freshness floor, so opening it straight after a return reads nothing.
   */
  onShowPeople: () => void
  /** Opens the trip that was just made. */
  onCreated: (tripId: string) => void
  /** Resolves to a field error when the address is refused, or null on success. */
  onInvite: (
    displayName: string,
    email: string,
  ) => Promise<{ field: string; message: string } | null>
  open: boolean
  onOpen: (open: boolean) => void
}) {
  const [view, setView] = useState<View>('root')
  const [name, setName] = useState(trip.name)
  /** This panel's own write, held here rather than shared with the workspace's. */
  const [saving, startSave] = usePending()

  /**
   * Opening always starts at the root.
   *
   * Without this the menu reopens wherever it was left — somebody who renamed a
   * trip, closed the menu and pressed the name again would be handed a text
   * field rather than the list they were looking for.
   */
  function setOpen(next: boolean) {
    if (next) setView('root')
    onOpen(next)
  }

  function show(next: View) {
    setView(next)
    if (next === 'people') onShowPeople()
    if (next === 'rename') setName(trip.name)
  }

  return (
    <Menu
      name="Trip"
      label={<span className={styles.name}>{trip.name}</span>}
      open={open}
      onOpen={setOpen}
      tone="quiet"
    >
      {view === 'root' ? (
        <>
          {/*
            The list is the switcher. There is no separate "switch trip" control
            because pressing a row is one, and a picker that opens a picker is a
            step nobody asked for.

            Shown only when there is something to pick between — a list of one is
            a choice that is not one. The name above it answers which trip these
            markers belong to either way, which is the part that always mattered.
          */}
          {trips.length > 1 ? (
            <>
              <p className={styles.heading}>Trips</p>
              {trips.map((each) => (
                <button
                  key={each.id}
                  type="button"
                  onClick={() => {
                    onSelect(each.id)
                    setOpen(false)
                  }}
                  aria-current={each.id === trip.id}
                  className={styles.row}
                >
                  <span className={styles.rowName}>{each.name}</span>
                  {each.id === trip.id ? (
                    <span className={styles.rowNote}>Open</span>
                  ) : null}
                </button>
              ))}
              <hr className={styles.divide} />
            </>
          ) : null}

          <button type="button" onClick={() => show('rename')} className={styles.row}>
            Rename this trip
          </button>
          <button type="button" onClick={() => show('people')} className={styles.row}>
            <span>People</span>
            <span className={styles.rowNote}>{members.length}</span>
          </button>
          {/*
            Making another one.

            Here rather than only on the empty state, which is where it was at
            first and is only half the requirement: any signed-in person may
            create a trip, not only somebody who has none.
          */}
          <button type="button" onClick={() => show('create')} className={styles.row}>
            New trip
          </button>
        </>
      ) : null}

      {view === 'rename' ? (
        <>
          <TextField label="Trip name" value={name} onChange={setName} autoFocus />
          <div className={styles.actions}>
            <Button
              tone="primary"
              disabled={saving || name.trim() === '' || name.trim() === trip.name}
              onClick={() =>
                // The panel goes back when the write settles, not when it is
                // sent. Closing first left nothing on screen that could report
                // either that it was still happening or that it was refused.
                startSave(async () => {
                  await onRename(name.trim())
                  setView('root')
                })
              }
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button tone="quiet" onClick={() => setView('root')}>
              Back
            </Button>
          </div>
        </>
      ) : null}

      {view === 'people' ? (
        <People
          members={members}
          onInvite={onInvite}
          onClose={() => setView('root')}
        />
      ) : null}

      {view === 'create' ? (
        <>
          <p className={styles.hint}>
            A trip is one shared map, separate from this one. Nothing here moves
            across.
          </p>
          <CreateTripForm
            onCreated={(tripId) => {
              setOpen(false)
              onCreated(tripId)
            }}
          />
          <div className={styles.actions}>
            <Button tone="quiet" onClick={() => setView('root')}>
              Back
            </Button>
          </div>
        </>
      ) : null}
    </Menu>
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
    <>
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

      <div className={styles.actions}>
        <Button
          tone="primary"
          disabled={adding || displayName.trim() === '' || email.trim() === ''}
          onClick={invite}
        >
          {adding ? 'Adding…' : 'Add to trip'}
        </Button>
        <Button tone="quiet" onClick={onClose}>
          Back
        </Button>
      </div>
    </>
  )
}
