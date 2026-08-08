'use client'

import type { Marker } from '@pinpoint/core'
import type { MarkerGroup, MarkerView } from '@pinpoint/map'
import { COLOUR, MARKER_SIZE, RADIUS, SPACE } from '@pinpoint/tokens'
import type { CSSProperties } from 'react'

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
  onBack,
  onDismiss,
}: {
  marker: Marker
  view: MarkerView
  onBack?: () => void
  onDismiss: () => void
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
        {/* No currency is stored yet, so none is invented here. */}
        <Field label="Price" value={marker.price === null ? null : String(marker.price)} />
      </dl>

      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          style={{
            marginTop: SPACE.md,
            border: `1px solid ${COLOUR.border}`,
            borderRadius: RADIUS.sm,
            background: COLOUR.surface,
            color: COLOUR.text,
            padding: `${SPACE.xs}px ${SPACE.sm}px`,
            cursor: 'pointer',
          }}
        >
          ← Others at this point
        </button>
      ) : null}
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
  onChoose,
  onBack,
  onDismiss,
}: {
  selection: Selection
  onChoose: (index: number) => void
  onBack: () => void
  onDismiss: () => void
}) {
  const { group, index } = selection

  if (index === null) {
    return <Chooser group={group} onChoose={onChoose} onDismiss={onDismiss} />
  }

  return (
    <Details
      marker={group.markers[index]!}
      view={group.views[index]!}
      onBack={group.count > 1 ? onBack : undefined}
      onDismiss={onDismiss}
    />
  )
}
