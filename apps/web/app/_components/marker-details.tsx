'use client'

import { formatPrice, type Marker } from '@pinpoint/core'
import type { MarkerGroup, MarkerView } from '@pinpoint/map'
import { COLOUR, MARKER_SIZE, RADIUS, SPACE } from '@pinpoint/tokens'
import type { CSSProperties } from 'react'

import { Button } from '@/app/_components/ui'

/**
 * What was recorded about a place, shown without leaving the map.
 *
 * A map you cannot interrogate is a constellation of anonymous dots. The fields
 * are the ones the domain schema already holds; which fields exist is shared,
 * and how they are laid out is not — mobile shows the same information as a
 * sheet, in its own idiom, importing nothing from here.
 */

const overlay: CSSProperties = {
  position: 'absolute',
  left: SPACE.md,
  bottom: SPACE.md,
  maxWidth: 360,
  maxHeight: '60%',
  overflowY: 'auto',
  backgroundColor: COLOUR.surface,
  color: COLOUR.text,
  border: `1px solid ${COLOUR.border}`,
  borderRadius: RADIUS.md,
  padding: SPACE.md,
  boxShadow: '0 6px 24px rgba(0, 0, 0, 0.18)',
  zIndex: 2,
}

function Pin({ view, size = MARKER_SIZE }: { view: MarkerView; size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: `0 0 ${size}px`,
        width: size,
        height: size,
        borderRadius: RADIUS.pill,
        backgroundColor: view.colour,
        border: `2px solid ${view.foreground}`,
        fontSize: Math.round(size * 0.55),
        lineHeight: 1,
      }}
    >
      {view.icon}
    </span>
  )
}

/** A field that holds nothing is shown as holding nothing, never as blank text. */
function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ display: 'flex', gap: SPACE.sm, alignItems: 'baseline' }}>
      <dt style={{ color: COLOUR.textMuted, minWidth: 64, fontSize: 13 }}>{label}</dt>
      <dd style={{ margin: 0 }}>
        {value === null ? (
          <span style={{ color: COLOUR.textMuted, fontStyle: 'italic' }}>
            Not recorded
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Close"
      style={{
        marginLeft: 'auto',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: COLOUR.textMuted,
        fontSize: 18,
        lineHeight: 1,
      }}
    >
      ×
    </button>
  )
}

function Details({
  marker,
  view,
  currency,
  onBack,
  onDismiss,
  onEdit,
  onDelete,
}: {
  marker: Marker
  view: MarkerView
  /** Of the city this marker is filed under. Null is shown as a bare amount, never assumed. */
  currency: string | null
  onBack?: () => void
  onDismiss: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div style={overlay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
        <Pin view={view} />
        <strong style={{ fontSize: 16 }}>{marker.name}</strong>
        <DismissButton onDismiss={onDismiss} />
      </div>

      <dl style={{ margin: `${SPACE.md}px 0 0`, display: 'grid', gap: SPACE.xs }}>
        <Field label="Type" value={view.typeLabel} />
        <Field label="Note" value={marker.note} />
        <Field
          label="Link"
          value={marker.link}
        />
        <Field
          label="Price"
          value={marker.price === null ? null : formatPrice(marker.price, currency)}
        />
      </dl>

      <div
        style={{
          display: 'flex',
          gap: SPACE.sm,
          marginTop: SPACE.md,
          flexWrap: 'wrap',
        }}
      >
        <Button onClick={onEdit}>Edit</Button>
        <Button
          tone="danger"
          onClick={() => {
            // Said plainly, because it is true: there is no soft delete and no
            // undo anywhere behind this.
            if (
              window.confirm(
                `Remove “${marker.name}”?\n\nThis cannot be undone.`,
              )
            ) {
              onDelete()
            }
          }}
        >
          Remove
        </Button>

        {onBack ? (
          <span style={{ marginLeft: 'auto' }}>
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
 * More than one marker sits on this exact point, so which one is a question
 * that has to be asked before it can be answered.
 *
 * This is the whole mechanism that makes coincident markers reachable: the pin
 * underneath is not separated by zoom, it is separated here.
 */
function Chooser({
  group,
  onChoose,
  onDismiss,
}: {
  group: MarkerGroup<Marker>
  onChoose: (index: number) => void
  onDismiss: () => void
}) {
  return (
    <div style={overlay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
        <strong style={{ fontSize: 16 }}>{group.count} places here</strong>
        <DismissButton onDismiss={onDismiss} />
      </div>
      <p style={{ color: COLOUR.textMuted, fontSize: 13, margin: `${SPACE.xs}px 0 0` }}>
        They share the same coordinates, so zooming will not separate them.
      </p>

      <ul style={{ listStyle: 'none', margin: `${SPACE.md}px 0 0`, padding: 0 }}>
        {group.markers.map((marker, index) => (
          <li key={marker.id}>
            <button
              type="button"
              onClick={() => onChoose(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACE.sm,
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: COLOUR.text,
                padding: `${SPACE.sm}px 0`,
              }}
            >
              <Pin view={group.views[index]!} size={24} />
              <span>{marker.name}</span>
              <span style={{ marginLeft: 'auto', color: COLOUR.textMuted, fontSize: 13 }}>
                {group.views[index]!.typeLabel}
              </span>
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
}

/**
 * One marker resolves straight to its details; several insert a chooser in
 * front of the same view. Nothing about the group case is special beyond that
 * one extra step.
 */
export function MarkerDetails({
  selection,
  currencyOf,
  onChoose,
  onBack,
  onDismiss,
  onEdit,
  onDelete,
}: {
  selection: Selection
  /** The currency of the city a marker is filed under, or null when there is none. */
  currencyOf: (marker: Marker) => string | null
  onChoose: (index: number) => void
  onBack: () => void
  onDismiss: () => void
  onEdit: (marker: Marker) => void
  onDelete: (marker: Marker) => void
}) {
  const { group, index } = selection

  if (index === null) {
    return <Chooser group={group} onChoose={onChoose} onDismiss={onDismiss} />
  }

  const marker = group.markers[index]!

  return (
    <Details
      marker={marker}
      view={group.views[index]!}
      currency={currencyOf(marker)}
      onBack={group.count > 1 ? onBack : undefined}
      onDismiss={onDismiss}
      onEdit={() => onEdit(marker)}
      onDelete={() => onDelete(marker)}
    />
  )
}
