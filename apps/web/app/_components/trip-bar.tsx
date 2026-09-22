'use client'

import {
  type FieldErrors,
  formatDayRange,
  TAKE_BACK_CONFIRM,
  TAKE_BACK_LABEL,
  takeBackConsequence,
  takeBackQuestion,
  type Trip,
  type TripMember,
} from '@pinpoint/core'
import { message, type Message } from '@pinpoint/wording'
import Link from 'next/link'
import { useState } from 'react'

import { useLanguage, useSay } from '@/app/_components/language'
import { CreateTripForm } from '@/app/_components/trip-setup'
import {
  Button,
  FormError,
  Menu,
  Question,
  TextField,
  WaitingMenu,
} from '@/app/_components/ui'
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

/**
 * Which face of the panel is showing. Reset whenever the menu closes.
 *
 * `archived` is a page here rather than an unfold at the bottom of the root,
 * which is where the phone's sheet puts it. That sheet is 85% of a tall screen
 * and is the whole surface while it is open; this is a 320px popover capped at
 * 520px, and it is also the control used most often for *switching* trips. Six
 * trips with nine archived is twenty-one rows in one panel unfolded, so an
 * archive somebody revealed once would sit under the trip list forever
 * afterwards. As a page the root is the same length however much is archived —
 * and it is the shape the three faces above it already use.
 */
type View = 'root' | 'rename' | 'dates' | 'people' | 'create' | 'archived'

export type TripBarLiveProps = {
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
   * Set or clear the dates the trip runs between.
   *
   * Resolves to the fields that were refused, empty when the write succeeded.
   * Unlike a rename, this one can be turned down for a reason the person can
   * act on — an end before a start — so the answer has to reach the field
   * rather than only a message over the map.
   */
  onSetDates: (dates: {
    startsOn: string | null
    endsOn: string | null
  }) => Promise<FieldErrors>
  /**
   * The view this screen is *not*, and where it lives.
   *
   * One prop naming the other view rather than the calendar's address plus a
   * flag saying which screen this is. The bar then holds no opinion about where
   * it is: whoever renders it knows, and says so once — the map offers
   * `Calendar`, the calendar offers `Map`, and neither can offer the view
   * somebody is already reading. A row that does nothing has to be pressed
   * before anybody finds out it does nothing.
   *
   * Carried as a whole href rather than assembled here, because what has to
   * survive the round trip differs by screen — the map sends the city along so
   * the way back can restore it — and this component has never been told about
   * a city.
   */
  otherView: { name: string; href: string }
  /**
   * Archived trips, or null while nobody has asked for them.
   *
   * Null rather than an empty array, because "not loaded" and "there are none"
   * are different answers and only one of them is worth a line saying so.
   */
  archived: readonly Trip[] | null
  /**
   * Awaited, so the row that starts the read can answer the press that started
   * it. Until the phone did this, pressing again simply fired a second one.
   *
   * Resolves to whether the read succeeded. A failure has already been reported
   * over the map, and this is what stops the page opening onto a null list that
   * would read as "nothing archived".
   */
  onRevealArchived: () => Promise<boolean>
  /**
   * Archive the trip being viewed. Awaited so the row can say `Archiving…` and
   * the panel can stay open long enough for a refusal to be reported against
   * something still on screen.
   *
   * Takes no trip: only the one being viewed can be archived. Archiving one from
   * the switcher would mean removing a trip somebody is not looking at, from the
   * list they opened to move between them.
   */
  onArchive: () => Promise<unknown>
  /** Put one back. Awaited, so the row that asked can say it is happening. */
  onRestore: (tripId: string) => Promise<unknown>
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
  ) => Promise<{ field: string; reason: Message } | null>
  /**
   * Take back an invitation nobody has claimed.
   *
   * Resolves to a named refusal, or null. The one that matters is not a
   * failure at all: that person signed in while the list was open, so their
   * invitation is a membership now and the delete matched nothing.
   */
  onRemove: (member: TripMember) => Promise<Message | null>
  open: boolean
  onOpen: (open: boolean) => void
  /**
   * A refusal from a write this panel started, or null.
   *
   * Drawn **inside the panel**, not over the map behind it. `write-feedback`
   * requires a refusal about the act to be shown beside the control where one
   * is still on screen, and this panel is still on screen — it stays open so
   * that the answer lands against the thing that asked. Sent to the map's note
   * instead, it was covered by this panel below about 934px: measured at a
   * 560px column, the only part of `Could not save that trip` still visible was
   * its last three letters.
   *
   * The phone's sheet has taken a `problem` for as long as it has existed and
   * draws it itself. This is the laptop catching up to it, under the same name.
   */
  problem: Message | null
  onDismissProblem: () => void
}

/**
 * Either this control has what it names, or it is waiting for it.
 *
 * A union rather than a bag of optionals, so the waiting form cannot be
 * rendered with half its handlers and the live form cannot be rendered
 * without them. There is nothing to pass while waiting, and the type says so.
 */
export type TripBarProps =
  | { waiting: true }
  | ({ waiting?: false } & TripBarLiveProps)

function TripBarLive({
  trip,
  trips,
  members,
  onSelect,
  onRename,
  onSetDates,
  otherView,
  archived,
  onRevealArchived,
  onArchive,
  onRestore,
  onInvite,
  onRemove,
  onShowPeople,
  onCreated,
  open,
  onOpen,
  problem,
  onDismissProblem,
}: TripBarLiveProps) {
  const say = useSay()
  const language = useLanguage()
  const [view, setView] = useState<View>('root')
  const [name, setName] = useState(trip.name)
  const [startsOn, setStartsOn] = useState(trip.startsOn ?? '')
  const [endsOn, setEndsOn] = useState(trip.endsOn ?? '')
  const [dateErrors, setDateErrors] = useState<FieldErrors>({})
  /**
   * Three waits, held apart, because they are three different presses.
   *
   * One flag here would be the workspace's old `busy` rebuilt a level down:
   * revealing the archive would make a rename that has nothing to do with it
   * unavailable, and archiving would do the same to both.
   */
  const [saving, startSave] = usePending()
  const [archiving, startArchive] = usePending()
  const [revealing, startReveal] = usePending()

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
    if (next === 'dates') {
      // Filled from the trip each time it is opened rather than held from the
      // last visit, so a value somebody abandoned is not offered back as the
      // one that is stored.
      setStartsOn(trip.startsOn ?? '')
      setEndsOn(trip.endsOn ?? '')
      setDateErrors({})
    }
  }

  return (
    <Menu
      name={say(message('trip.menuName'))}
      label={<span className={styles.name}>{trip.name}</span>}
      open={open}
      onOpen={setOpen}
      tone="quiet"
    >
      {/*
        Above whichever face is showing, because it is about the write that was
        just attempted rather than about the face — and a refusal below the
        fold of a panel that scrolls is a refusal nobody reads.
      */}
      {problem ? (
        <button
          type="button"
          onClick={onDismissProblem}
          aria-label={say(message('common.dismissMessage'))}
          className={styles.problem}
        >
          <FormError message={say(problem)} />
        </button>
      ) : null}

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
              <p className={styles.heading}>{say(message('trip.trips'))}</p>
              {trips.map((each) => {
                /*
                 * A trip with no dates shows its name alone — no placeholder and
                 * no dash. Most trips exist in that state for most of their
                 * life, and a column of stand-ins says nothing while taking the
                 * room the names need.
                 */
                const range = formatDayRange(language, each.startsOn, each.endsOn)
                const dates = range === null ? null : say(range)
                return (
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
                    <span
                      className={`${styles.rowName} ${dates ? styles.rowNameDated : ''}`}
                    >
                      {each.name}
                    </span>
                    {dates ? <span className={styles.rowDates}>{dates}</span> : null}
                    {each.id === trip.id ? (
                      <span className={styles.rowNote}>{say(message('trip.currentNote'))}</span>
                    ) : null}
                  </button>
                )
              })}
              <hr className={styles.divide} />
            </>
          ) : null}

          <button type="button" onClick={() => show('rename')} className={styles.row}>
            {say(message('trip.renameThis'))}
          </button>
          <button type="button" onClick={() => show('dates')} className={styles.row}>
            <span>{say(message('trip.dates'))}</span>
            <span className={styles.rowNote}>
              {say(
                trip.startsOn === null && trip.endsOn === null
                  ? message('trip.datesNone')
                  : message('trip.datesSet'),
              )}
            </span>
          </button>
          {/*
            The other view, named by whoever rendered this bar.

            A screen rather than a panel, so it is a link and not a button —
            middle-clicking it, or opening it in a new tab, does what those do
            everywhere else. The map's href carries the city with it, which is
            what lets the way back put somebody down where they were standing.
          */}
          <Link href={otherView.href} className={styles.row} onClick={() => setOpen(false)}>
            {otherView.name}
          </Link>
          <button type="button" onClick={() => show('people')} className={styles.row}>
            <span>{say(message('trip.people'))}</span>
            <span className={styles.rowNote}>{members.length}</span>
          </button>
          {/*
            Making another one.

            Here rather than only on the empty state, which is where it was at
            first and is only half the requirement: any signed-in person may
            create a trip, not only somebody who has none.
          */}
          <button type="button" onClick={() => show('create')} className={styles.row}>
            {say(message('trip.new'))}
          </button>

          <hr className={styles.divide} />

          {/*
            Archiving, in the danger colour and last — the position the phone
            gives it too.

            It is the only way to remove a trip, because no table in this schema
            has a delete policy, and it is reversible, which is why it takes no
            confirmation step. A confirmation on a reversible act is what teaches
            somebody to dismiss the ones that are not.

            It awaits rather than firing and closing. The write is optimistic and
            the trip leaves the list at once, but the control that asked for it is
            still here and is the only thing on screen that can say the round trip
            has not finished — and, if it is refused, still be here when it is put
            back.
          */}
          <button
            type="button"
            onClick={() => startArchive(onArchive)}
            aria-disabled={archiving}
            className={`${styles.row} ${styles.danger}`}
          >
            {say(archiving ? message('trip.archiving') : message('trip.archiveThis'))}
          </button>

          {/*
            The way back.

            Behind a deliberate act rather than always on screen, because most of
            the time there is nothing archived and a permanent empty section is
            furniture. But it is always *reachable* — including by somebody who
            has archived every trip they have, which is the case that turns a tidy
            list into a lost one.

            No count beside it. A count would have to read the archived trips
            every time this menu opens, which is precisely the read that a
            deliberate act exists to defer.

            The page opens once the answer is back rather than opening empty and
            filling, so the row itself has to answer the press: a read somebody
            waits on gets the same treatment as a write.
          */}
          <button
            type="button"
            onClick={() =>
              startReveal(async () => {
                // Only on success. A failed read leaves `archived` null, and a
                // page rendered from null cannot tell "nothing archived" from
                // "the read failed" — which is the distinction the note over the
                // map is carrying.
                if (await onRevealArchived()) setView('archived')
              })
            }
            aria-disabled={revealing}
            className={`${styles.row} ${styles.quiet}`}
          >
            {say(revealing ? message('trip.archivedLooking') : message('trip.archivedTrips'))}
          </button>
        </>
      ) : null}

      {view === 'rename' ? (
        <>
          <TextField label={say(message('trip.name'))} value={name} onChange={setName} autoFocus />
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
              {say(saving ? message('common.saving') : message('common.save'))}
            </Button>
            <Button tone="quiet" onClick={() => setView('root')}>
              {say(message('common.back'))}
            </Button>
          </div>
        </>
      ) : null}

      {view === 'dates' ? (
        <>
          <p className={styles.heading}>{say(message('trip.dates'))}</p>
          <TextField
            label={say(message('trip.startDate'))}
            type="date"
            value={startsOn}
            onChange={setStartsOn}
            error={dateErrors.startsOn}
            autoFocus
          />
          <TextField
            label={say(message('trip.endDate'))}
            type="date"
            value={endsOn}
            onChange={setEndsOn}
            error={dateErrors.endsOn}
            hint={say(message('trip.datesHint'))}
          />
          <div className={styles.actions}>
            <Button
              tone="primary"
              disabled={saving}
              onClick={() =>
                startSave(async () => {
                  const errors = await onSetDates({
                    startsOn: startsOn === '' ? null : startsOn,
                    endsOn: endsOn === '' ? null : endsOn,
                  })
                  setDateErrors(errors)
                  // Stays open when it was refused, so the message sits beside
                  // the field it is about and what was typed is still there.
                  if (Object.keys(errors).length === 0) setView('root')
                })
              }
            >
              {say(saving ? message('common.saving') : message('common.save'))}
            </Button>
            <Button
              tone="quiet"
              disabled={saving || (startsOn === '' && endsOn === '')}
              onClick={() => {
                setStartsOn('')
                setEndsOn('')
                setDateErrors({})
              }}
            >
              {say(message('common.clear'))}
            </Button>
            <Button tone="quiet" onClick={() => setView('root')}>
              {say(message('common.back'))}
            </Button>
          </div>
        </>
      ) : null}

      {view === 'people' ? (
        <People
          members={members}
          onInvite={onInvite}
          onRemove={onRemove}
          onClose={() => setView('root')}
        />
      ) : null}

      {view === 'archived' ? (
        <>
          <p className={styles.heading}>{say(message('trip.archived'))}</p>

          {archived === null || archived.length === 0 ? (
            <p className={styles.hint}>{say(message('trip.nothingArchived'))}</p>
          ) : (
            <>
              {archived.map((each) => (
                <ArchivedRow
                  key={each.id}
                  trip={each}
                  onRestore={() => onRestore(each.id)}
                />
              ))}
              <p className={styles.hint}>{say(message('trip.restoreNote'))}</p>
            </>
          )}

          <div className={styles.actions}>
            <Button tone="quiet" onClick={() => setView('root')}>
              {say(message('common.back'))}
            </Button>
          </div>
        </>
      ) : null}

      {view === 'create' ? (
        <>
          <p className={styles.hint}>{say(message('trip.newNote'))}</p>
          <CreateTripForm
            onCreated={(tripId) => {
              setOpen(false)
              onCreated(tripId)
            }}
          />
          <div className={styles.actions}>
            <Button tone="quiet" onClick={() => setView('root')}>
              {say(message('common.back'))}
            </Button>
          </div>
        </>
      ) : null}
    </Menu>
  )
}

/**
 * One archived trip, and the way back.
 *
 * Its own component for one reason: the pending state has to belong to this row
 * rather than to the page holding them. A single flag up there would say
 * `Putting back…` on every row while one of them was writing, and make the other
 * eight unavailable for a write that has nothing to do with them.
 *
 * Not a `Button`, because these are a list of things rather than a row of
 * controls — the same reason the rows above are not. It still owes what a button
 * owes: `aria-disabled` and a no-op rather than the `disabled` attribute, which
 * would take it out of the tab order mid-write and tell somebody arriving by
 * keyboard that the action is gone.
 */
function ArchivedRow({
  trip,
  onRestore,
}: {
  trip: Trip
  onRestore: () => Promise<unknown>
}) {
  const [restoring, startRestore] = usePending()
  const say = useSay()

  return (
    <div className={styles.archived}>
      <span className={styles.archivedName}>{trip.name}</span>
      <button
        type="button"
        onClick={() => startRestore(onRestore)}
        aria-disabled={restoring}
        aria-label={say(message('trip.restoreNamed', { name: trip.name }))}
        className={styles.restore}
      >
        {say(restoring ? message('trip.restoring') : message('trip.restore'))}
      </button>
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
  onRemove,
  onClose,
}: {
  members: readonly TripMember[]
  onInvite: (
    displayName: string,
    email: string,
  ) => Promise<{ field: string; reason: Message } | null>
  /**
   * Take back an unclaimed invitation. Resolves to a named refusal, or null.
   *
   * Only ever called with a member whose `userId` is null — the control is not
   * drawn on any other row. The database enforces that independently, which is
   * what makes a claim landing mid-decision a refusal rather than a silent
   * success.
   */
  onRemove: (member: TripMember) => Promise<Message | null>
  onClose: () => void
}) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, Message>>({})
  const [note, setNote] = useState<Message | null>(null)
  const [adding, startInvite] = usePending()
  /** Which invitation is being asked about, or null. The row, not its id, so
   *  the question can name the person and the address without a second lookup. */
  const [asking, setAsking] = useState<TripMember | null>(null)
  const [removing, startRemove] = usePending()
  const say = useSay()

  function invite() {
    setErrors({})
    setNote(null)

    startInvite(async () => {
      const problem = await onInvite(displayName.trim(), email.trim())
      if (problem) {
        if (problem.field === '_') setNote(problem.reason)
        else setErrors({ [problem.field]: problem.reason })
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
            <span className={styles.who}>
              <span className={styles.personName}>{member.displayName}</span>
              {member.userId === null ? (
                <span className={styles.pending}>
                  {say(message('people.notJoined', { email: member.email }))}
                </span>
              ) : null}
            </span>
            {/*
              Only on a row that has not been claimed, and only while nothing
              is being asked.

              The second condition is the rule rather than tidiness: no control
              offering to destroy another record may stand beside a standing
              question. A trip with one mistyped address never shows this; a
              trip with two is the difference between a careful panel and a
              dangerous one.
            */}
            {member.userId === null && asking === null ? (
              <button
                type="button"
                className={styles.takeBack}
                onClick={() => {
                  setNote(null)
                  setAsking(member)
                }}
              >
                {say(TAKE_BACK_LABEL)}
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {/*
        While a question stands the panel is about that one act.

        The invite form is not destructive, so nothing requires hiding it — but
        the city editor already settled the shape for this, and for the same
        reason: fields left live beside a question invite somebody to start a
        different write in a surface that is waiting on an answer.
      */}
      {asking !== null ? (
        <Question
          question={say(takeBackQuestion(asking.displayName))}
          consequence={say(takeBackConsequence(asking.email))}
          confirm={say(TAKE_BACK_CONFIRM)}
          waiting={removing}
          onConfirm={() => {
            const member = asking
            startRemove(async () => {
              const problem = await onRemove(member)
              setAsking(null)
              if (problem) setNote(problem)
            })
          }}
          onDecline={() => setAsking(null)}
        />
      ) : (
        <>
      <p className={styles.hint}>{say(message('people.inviteHint'))}</p>

      <TextField
        label={say(message('common.name'))}
        value={displayName}
        onChange={setDisplayName}
        error={errors.displayName}
        placeholder={say(message('people.namePlaceholder'))}
      />
      <TextField
        label={say(message('people.email'))}
        value={email}
        onChange={setEmail}
        error={errors.email}
        placeholder={say(message('people.emailPlaceholder'))}
        type="email"
      />

      <div className={styles.actions}>
        <Button
          tone="primary"
          disabled={adding || displayName.trim() === '' || email.trim() === ''}
          onClick={invite}
        >
          {say(adding ? message('people.adding') : message('people.add'))}
        </Button>
        <Button tone="quiet" onClick={onClose}>
          {say(message('common.back'))}
        </Button>
      </div>
        </>
      )}

      {/*
        Below whichever of the two the panel is showing, because it is about the
        write that was just attempted rather than about the form. A refusal from
        taking back an invitation lands here too — most often the one saying
        that person has joined since the list was opened.
      */}
      {note ? <FormError message={say(note)} /> : null}
    </>
  )
}

/**
 * TripBar, before and after its data.
 *
 * `waiting` is a variant of this control rather than a choice made by whoever
 * renders it, for the reason `write-feedback` gives about pending state: a flag
 * held by the screen cannot say *which* control it is about, and the control is
 * the only thing that knows what it looks like with nothing to show.
 *
 * The waiting form is the same `Menu` the live one renders. Only the label
 * differs, because the label is the part nobody knows yet.
 */
export function TripBar(props: TripBarProps) {
  const say = useSay()
  if (props.waiting)
    return (
      <WaitingMenu
        name={say(message('trip.menuName'))}
        labelClassName={styles.name}
        measure="12ch"
      />
    )
  return <TripBarLive {...props} />
}
