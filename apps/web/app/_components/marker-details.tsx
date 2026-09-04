'use client'

import {
  formatPrice,
  type Marker,
  type MarkerInterest,
  type TripMember,
} from '@pinpoint/core'
import type { MarkerGroup, MarkerView } from '@pinpoint/map'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { InterestRows, VisitedToggle } from '@/app/_components/interest'
import { TypeChip } from '@/app/_components/pin'
import { Button, overlayPanelClass } from '@/app/_components/ui'
import { usePending } from '@/lib/use-pending'

import styles from './marker-details.module.css'

/**
 * What was recorded about a place, shown without leaving the map.
 *
 * A map you cannot interrogate is a constellation of anonymous dots. The fields
 * are the ones the domain schema already holds; which fields exist is shared,
 * and how they are laid out is not — mobile shows the same information as a
 * sheet, in its own idiom, importing nothing from here.
 */

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Close"
      className={styles.dismiss}
    >
      <X size={16} strokeWidth={2.2} />
    </button>
  )
}

/** A field that holds nothing is shown as holding nothing, never as blank text. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <p className={styles.fieldValue}>{children}</p>
    </div>
  )
}

/**
 * The same label over a control rather than a sentence.
 *
 * Separate from `Field` because that one wraps its value in a `<p>`, which is
 * right for a note and invalid around a list of people — the browser closes the
 * paragraph early and hydration disagrees with the server about the shape of
 * the tree.
 */
function ControlField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldValue}>{children}</div>
    </div>
  )
}

function Absent() {
  return <span className={styles.absent}>Not recorded</span>
}

function Details({
  marker,
  view,
  hidden,
  currency,
  members,
  interest,
  ownMemberId,
  onRecordInterest,
  onWithdrawInterest,
  onSetVisited,
  onBack,
  onDismiss,
  onEdit,
  onDelete,
}: {
  marker: Marker
  view: MarkerView
  /** The current filter is not drawing this place. See `HiddenNote`. */
  hidden: boolean
  /** Of the city this marker is filed under. Null is shown as a bare amount, never assumed. */
  currency: string | null
  members: readonly TripMember[]
  /** This marker's records only. */
  interest: readonly MarkerInterest[]
  ownMemberId: string | null
  onRecordInterest: (interested: boolean) => void
  onWithdrawInterest: () => void
  onSetVisited: (visited: boolean) => void
  onBack?: () => void
  onDismiss: () => void
  onEdit: () => void
  /** Awaited, so `Remove` can say what it is doing until the row is actually gone. */
  onDelete: () => Promise<unknown>
}) {
  /**
   * Removing is pending rather than optimistic, and this flag is why the panel
   * can say so.
   *
   * It is the one write here that cannot be undone, so the card stays open,
   * says `Removing…`, and closes when the database confirms it — rather than
   * taking the place off the map and putting it back if the delete is refused,
   * which would make somebody watch a pin they had just removed reappear.
   */
  const [removing, startRemove] = usePending()

  return (
    <div className={overlayPanelClass}>
      <div className={styles.head}>
        <TypeChip view={view} />
        <h2 className={styles.name}>{marker.name}</h2>
        <DismissButton onDismiss={onDismiss} />
      </div>

      <div className={styles.tags}>
        <span
          className={`${styles.tag} ${styles.tagFamily}`}
          style={{ backgroundColor: `var(--pp-family-${view.family})` }}
        >
          {view.typeLabel}
        </span>
        {marker.price === null ? null : (
          <span className={`${styles.tag} ${styles.tagPrice}`}>
            {formatPrice(marker.price, currency)}
          </span>
        )}
      </div>

      {hidden ? <HiddenNote /> : null}

      <div className={styles.fields}>
        <ControlField label="Who wants to go">
          <InterestRows
            members={members}
            interest={interest}
            ownMemberId={ownMemberId}
            onRecord={onRecordInterest}
            onWithdraw={onWithdrawInterest}
          />
        </ControlField>

        <ControlField label="Visited">
          <VisitedToggle visited={marker.visited} onChange={onSetVisited} />
        </ControlField>

        <Field label="Note">{marker.note ?? <Absent />}</Field>
        <Field label="Link">
          {marker.link === null ? (
            <Absent />
          ) : (
            <a
              className={styles.link}
              href={marker.link}
              target="_blank"
              rel="noreferrer noopener"
            >
              {marker.link}
            </a>
          )}
        </Field>
      </div>

      <div className={styles.actions}>
        <Button onClick={onEdit}>Edit</Button>
        <Button
          tone="danger"
          disabled={removing}
          onClick={() => {
            // Said plainly, because it is true: there is no soft delete and no
            // undo anywhere behind this.
            if (window.confirm(`Remove “${marker.name}”?\n\nThis cannot be undone.`)) {
              startRemove(onDelete)
            }
          }}
        >
          {removing ? 'Removing…' : 'Remove'}
        </Button>

        {onBack ? (
          <span className={styles.spacer}>
            <Button tone="quiet" onClick={onBack}>
              ← Others at this point
            </Button>
          </span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Why the map behind this card is empty.
 *
 * A card only ever shows a place the map is drawing, with one exception:
 * searching for somewhere the trip already holds opens it wherever it is,
 * including behind a filter that is hiding it. Without this sentence the result
 * is a camera that moves, a card about a place with no pin under it, and no way
 * to tell that from the application failing.
 *
 * It does not offer to clear the filter. The filter was set deliberately, and a
 * product that quietly unsets one so its own output makes sense leaves somebody
 * to notice and undo it. Clearing is already reachable from the bar that says
 * the view is narrowed.
 */
function HiddenNote() {
  return (
    <p className={styles.hiddenNote}>
      Already saved on this trip. Your filter is hiding it, so it is not drawn on
      the map.
    </p>
  )
}

/**
 * More than one marker sits on this exact point, so which one is a question
 * that has to be asked before it can be answered.
 *
 * This is the whole mechanism that makes coincident markers reachable: the pin
 * underneath is not separated by zoom, it is separated here.
 */
function Chooser({
  group,
  hidden,
  onChoose,
  onDismiss,
}: {
  group: MarkerGroup<Marker>
  hidden: boolean
  onChoose: (index: number) => void
  onDismiss: () => void
}) {
  return (
    <div className={overlayPanelClass}>
      <div className={styles.head}>
        <h2 className={styles.name}>{group.count} places here</h2>
        <DismissButton onDismiss={onDismiss} />
      </div>
      <p className={styles.chooserNote}>
        They share the same coordinates, so zooming will not separate them.
        Nothing has been moved — pick one.
      </p>
      {hidden ? <HiddenNote /> : null}

      <ul className={styles.list}>
        {group.markers.map((marker, index) => (
          <li key={marker.id}>
            <button
              type="button"
              onClick={() => onChoose(index)}
              className={styles.choice}
            >
              <TypeChip view={group.views[index]!} size={26} />
              <span>{marker.name}</span>
              <span className={styles.choiceType}>{group.views[index]!.typeLabel}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface Selection {
  group: MarkerGroup<Marker>
  /** Null while a group of several is still being chosen between. */
  index: number | null
  /**
   * Whether the filter is hiding what this card is showing.
   *
   * Only ever true for a card the application opened by identity — recognising
   * a searched place the trip already holds. Clicking the map cannot produce
   * it, because clicking can only reach what is drawn.
   */
  hidden: boolean
}

/**
 * One marker resolves straight to its details; several insert a chooser in
 * front of the same view. Nothing about the group case is special beyond that
 * one extra step.
 */
export function MarkerDetails({
  selection,
  currencyOf,
  members,
  interestFor,
  ownMemberId,
  onRecordInterest,
  onWithdrawInterest,
  onSetVisited,
  onChoose,
  onBack,
  onDismiss,
  onEdit,
  onDelete,
}: {
  selection: Selection
  /** The currency of the city a marker is filed under, or null when there is none. */
  currencyOf: (marker: Marker) => string | null
  members: readonly TripMember[]
  /** One marker's records, so this component never sees the whole trip's. */
  interestFor: (marker: Marker) => readonly MarkerInterest[]
  ownMemberId: string | null
  onRecordInterest: (marker: Marker, interested: boolean) => void
  onWithdrawInterest: (marker: Marker) => void
  onSetVisited: (marker: Marker, visited: boolean) => void
  onChoose: (index: number) => void
  onBack: () => void
  onDismiss: () => void
  onEdit: (marker: Marker) => void
  onDelete: (marker: Marker) => Promise<unknown>
}) {
  const { group, index, hidden } = selection

  if (index === null) {
    return (
      <Chooser
        group={group}
        hidden={hidden}
        onChoose={onChoose}
        onDismiss={onDismiss}
      />
    )
  }

  const marker = group.markers[index]!

  return (
    <Details
      marker={marker}
      view={group.views[index]!}
      hidden={hidden}
      currency={currencyOf(marker)}
      members={members}
      interest={interestFor(marker)}
      ownMemberId={ownMemberId}
      onRecordInterest={(interested) => onRecordInterest(marker, interested)}
      onWithdrawInterest={() => onWithdrawInterest(marker)}
      onSetVisited={(visited) => onSetVisited(marker, visited)}
      onBack={group.count > 1 ? onBack : undefined}
      onDismiss={onDismiss}
      onEdit={() => onEdit(marker)}
      onDelete={() => onDelete(marker)}
    />
  )
}
