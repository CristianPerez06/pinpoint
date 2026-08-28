'use client'

import { ArrowLeft, LogOut, MapPinPlus, Menu as Menu2, RefreshCw, Search } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'

import { signOutAction } from '@/app/_actions/auth'
import { CityBar, type CityBarLiveProps } from '@/app/_components/city-bar'
import { FilterBar, type FilterBarLiveProps } from '@/app/_components/filter-bar'
import { PlaceSearch, type PlaceSearchLiveProps } from '@/app/_components/place-search'
import { TripBar, type TripBarLiveProps } from '@/app/_components/trip-bar'
import type { PlaceCandidate } from '@pinpoint/geocode'
import type { MarkerFormValues } from '@/app/_components/marker-form'
import type { DraftPosition } from '@/app/_components/trip-map'
import {
  Button,
  iconOnlyLabelClass,
  Menu,
  NamePlaceholder,
} from '@/app/_components/ui'

import styles from './trip-workspace.module.css'

/**
 * Which of the chrome's panels is open. Held by the workspace, because "only
 * one open at a time" is a rule about the whole bar and no single control can
 * enforce it about panels it cannot see.
 */
export type DetourPanel = 'none' | 'trip' | 'city' | 'filter' | 'account'

/**
 * Everything the bar needs in order to be *usable*, and nothing it needs in
 * order to be *drawn*.
 *
 * That split is the whole point of this file. The chrome's arrangement — which
 * controls exist, where they stand, what happens to them at a phone width — is
 * the same for every trip and is known before any trip is read. What is not
 * known is what the controls should say and what they should do, and that is
 * exactly this type.
 *
 * The field types are read from each control's own props rather than restated,
 * so a handler cannot come to mean one thing here and another there. Restating
 * `onSave: (cityId: string, patch: {...}) => Promise<unknown>` would be a second
 * copy of a signature, which is the kind of thing that agrees on the day it is
 * written and not afterwards.
 */
export type ChromeBindings = {
  trip: TripBarLiveProps['trip']
  trips: TripBarLiveProps['trips']
  members: TripBarLiveProps['members']
  archivedTrips: TripBarLiveProps['archived']
  onSelectTrip: TripBarLiveProps['onSelect']
  onRenameTrip: TripBarLiveProps['onRename']
  onRevealArchived: TripBarLiveProps['onRevealArchived']
  onArchiveTrip: TripBarLiveProps['onArchive']
  onRestoreTrip: TripBarLiveProps['onRestore']
  onInvite: TripBarLiveProps['onInvite']
  onShowPeople: TripBarLiveProps['onShowPeople']

  cities: CityBarLiveProps['cities']
  markers: CityBarLiveProps['markers']
  selectedCityId: CityBarLiveProps['selectedCityId']
  onSelectCity: CityBarLiveProps['onSelect']
  onSaveCity: CityBarLiveProps['onSave']
  onDeleteCity: CityBarLiveProps['onDelete']
  onShowCities: CityBarLiveProps['onShowCities']

  filter: FilterBarLiveProps['filter']
  onFilter: FilterBarLiveProps['onChange']
  ownMemberId: FilterBarLiveProps['ownMemberId']

  biasRef: PlaceSearchLiveProps['biasRef']
  /**
   * A place was chosen from search: open the capture form on it.
   *
   * Typed from the workspace's own `beginCreate` rather than restated, for the
   * reason above — the first draft of this file restated it, got the third
   * argument's type wrong, and only the compiler noticed.
   */
  onCreateFrom: (
    position: DraftPosition,
    initial: Partial<MarkerFormValues>,
    moveCamera: boolean,
  ) => void

  toolsRef: RefObject<HTMLSpanElement | null>
  searchRef: RefObject<HTMLSpanElement | null>
  searchOpen: boolean
  onSearchOpen: (open: boolean) => void

  /** The map is armed and waiting to be told where. */
  dropping: boolean
  onToggleDrop: () => void
  onCancelSight: () => void
  onUseSpot: () => void

  /** Something is open over the map, so the bar yields the bottom edge to it. */
  panelOpen: boolean

  youAre: string
  onReread: () => void

  detour: DetourPanel
  onDetour: (panel: DetourPanel) => void
}

/**
 * The frame, which does not wait for anything.
 *
 * One definition drawing two states, rather than a shell component beside the
 * real bar. Two renderings that merely look alike disagree the moment either is
 * edited, and they are exchanged at precisely the moment the transition is
 * supposed to feel settled — so one pixel of disagreement reads as a flinch.
 *
 * `live` is null until the trip has been read. Every control then reports
 * itself unavailable and stays in the tab order, which is the treatment
 * `DESIGN.md` requires and the reason none of this uses the `disabled`
 * attribute: that removes a control from the tab order and hides it from a
 * screen reader, so somebody arriving by keyboard is told the action is gone
 * rather than that it has not arrived.
 *
 * Two of these controls need nothing fetched in order to work and are inert
 * anyway. Search opens a capture form against a trip that does not exist yet,
 * and dropping a pin arms a map that has not been drawn — so the rule is inert
 * until the act can *complete*, not until the data lands.
 *
 * `<main>` is the caller's, passed as children, and it must stay a sibling of
 * the `<header>` below rather than a parent of it: a `<header>` inside `<main>`
 * exposes no `banner` landmark at all, and nothing reports that.
 */
export function WorkspaceChrome({
  live,
  children,
}: {
  live: ChromeBindings | null
  children: ReactNode
}) {
  const dropping = live?.dropping ?? false

  return (
    <div className={styles.shell}>
      {/*
        One bar, and it is the header.

        This was a header plus three stacked toolbar rows — 205px of chrome on a
        929px viewport, holding 558px of controls, so between 78 and 86 per cent
        of every row was empty. The arrangement was not decided: each band
        arrived for its own good reason and none was ever weighed against the
        others, which left the topmost and leftmost strip of the interface —
        where a hand and an eye go first — holding `Rename`, `People` and
        `New trip`, three things somebody does about once per trip in total.

        Read left to right it is now scope, then the session, then the person.
        The trip and the city say what is being looked at and open everything
        rare that belongs to them. Search, drop and filter are what a session is
        actually made of. The account is at the far end, where DESIGN.md wants
        rare destructive things kept.
      */}
      <header className={styles.bar}>
        <span className={styles.mark} aria-hidden />

        {/*
          The scope's two names are wrapped rather than placed directly.

          At a phone width the bar becomes a two-row grid and each name needs a
          cell of its own to be put in. `TripBar` and `CityBar` both render a
          `Menu`, whose root carries the same class as every other menu in the
          chrome, so there is nothing here to address them by. Wrapping is the
          smallest thing that gives each one a name — and it changes neither
          component, which is what keeps the dismissal contract theirs.
        */}
        <span className={styles.scope}>
        {live ? (
        <TripBar
          trip={live.trip}
          trips={live.trips}
          members={live.members}
          onSelect={live.onSelectTrip}
          onRename={live.onRenameTrip}
          archived={live.archivedTrips}
          onRevealArchived={live.onRevealArchived}
          onArchive={live.onArchiveTrip}
          onRestore={live.onRestoreTrip}
          onInvite={live.onInvite}
          onShowPeople={live.onShowPeople}
          onCreated={live.onSelectTrip}
          open={live.detour === 'trip'}
          onOpen={(open) => live.onDetour(open ? 'trip' : 'none')}
        />
        ) : (
          <TripBar waiting />
        )}
        </span>

        {/* A path on a laptop, and nothing at all on a phone, where the two
            names are on separate lines and the narrowing is said by the
            indent instead. */}
        <span className={styles.scopeSep} aria-hidden>
          /
        </span>

        {/*
          The city is a narrowing of the trip, so it reads as one — which is
          also true of what it does: it frames the camera on that city's places
          and biases search toward them. It still does not filter the map.
        */}
        <span className={styles.city}>
        {live ? (
        <CityBar
          cities={live.cities}
          markers={live.markers}
          selectedCityId={live.selectedCityId}
          onSelect={live.onSelectCity}
          onSave={live.onSaveCity}
          onDelete={live.onDeleteCity}
          onShowCities={live.onShowCities}
          open={live.detour === 'city'}
          onOpen={(open) => live.onDetour(open ? 'city' : 'none')}
        />
        ) : (
          <CityBar waiting />
        )}
        </span>

        {/*
          What a session is made of.

          On a laptop this sits in the bar between the scope and the person. At a
          phone width the same element is taken out of the flow and pinned to the
          bottom edge, over the map, within a thumb's reach — one set of
          controls in one place in the markup, drawn where the shape of the
          screen wants them.
        */}
        <span
          ref={live?.toolsRef}
          className={`${styles.tools} ${dropping ? styles.armed : ''} ${
            live && live.panelOpen ? styles.yielded : ''
          }`}
          role="toolbar"
          aria-label="This trip's tools"
        >
          {/*
            The tool that opens the field, and only where the field is not
            already standing in the row. Absent above the breakpoint, where
            search is permanently visible and there would be nothing for this to
            reveal.
          */}
          <button
            type="button"
            onClick={() => live?.onSearchOpen(true)}
            aria-disabled={live ? undefined : true}
            className={styles.searchTool}
          >
            <Search aria-hidden className={styles.toolGlyph} />
            <span className={styles.toolLabel}>Search</span>
          </button>

          {/*
            One field, in two places.

            At a laptop width this is a control in the bar. At a phone width the
            same element becomes the whole screen, because a field sharing a row
            with two other tools is thirty pixels wide and useless — the rule
            the bar already follows, that a control gives up its place before it
            gives up its size, taken to its end.

            Relocated rather than branched on, and that is the point: one
            `<input>` exists at any width, so there is no second one holding a
            stale query, nothing to keep in sync, and no first paint in the
            wrong shape while JavaScript decides how wide the window is.
          */}
          <span
            ref={live?.searchRef}
            className={`${styles.search} ${live?.searchOpen ? styles.searchOpen : ''}`}
          >
            <button
              type="button"
              onClick={() => live?.onSearchOpen(false)}
              aria-label="Close search"
              className={styles.searchBack}
            >
              <ArrowLeft aria-hidden className={styles.toolGlyph} />
            </button>

            {live ? (
            <PlaceSearch
              biasRef={live.biasRef}
              onChoose={(candidate: PlaceCandidate) => {
                live.onSearchOpen(false)
                live.onCreateFrom(
                  { lng: candidate.lng, lat: candidate.lat },
                  { name: candidate.name, type: candidate.typeGuess },
                  true,
                )
              }}
            />
            ) : (
              <PlaceSearch waiting />
            )}
          </span>

          {/*
            A slot, so the two labels do not resize the control and push the
            filter sideways at the exact moment somebody is reaching for the map.

            The armed label is `Cancel` rather than `Cancel — click the map`,
            which is what it used to say. The banner standing over the map
            already says "Click the map where the place is", so the long form
            was the same sentence twice — and it was the widest thing in the
            bar, forcing a slot half again as wide as the control needed.
          */}
          <span className={styles.drop}>
            <Button
              tone={dropping ? 'danger' : 'primary'}
              disabled={live === null}
              onClick={() => live?.onToggleDrop()}
            >
              {/*
                Two spellings of one label, and the width chooses.

                Rendered together rather than branched on, because neither
                carries state — a word is not a control, and duplicating one
                costs nothing that duplicating an input would. The tool spelling
                also carries a glyph, which is what makes three targets at the
                bottom of a phone readable at a glance.
              */}
              <MapPinPlus aria-hidden className={styles.toolGlyph} />
              <span className={styles.wideLabel}>
                {dropping ? 'Cancel' : '+ Drop a pin'}
              </span>
              <span className={styles.toolLabel}>
                {dropping ? 'Cancel' : 'Drop'}
              </span>
            </Button>
          </span>

          {/*
            What the sight is waiting for, standing where the trip's controls
            stand rather than beside them.

            Arming replaces the row instead of adding to it, which says the map
            is doing something other than what it usually does more clearly than
            any label added to the row would. One slot, so the credit rises off
            whichever of the two is standing there without either case having to
            be remembered separately.

            Rendered at every width and shown only where the sight is, for the
            same reason the drop control carries two labels: this holds no state
            of its own, so the cascade can choose.
          */}
          <span className={styles.confirm}>
            <button
              type="button"
              onClick={() => live?.onCancelSight()}
              className={styles.confirmCancel}
            >
              Cancel
            </button>
            <span className={styles.confirmHint}>
              Move the map to put the place under the ring.
            </span>
            <button
              type="button"
              onClick={() => {
                live?.onUseSpot()
              }}
              className={styles.confirmUse}
            >
              Use this spot
            </button>
          </span>

          {live ? (
            <FilterBar
              filter={live.filter}
              onChange={live.onFilter}
              members={live.members}
              ownMemberId={live.ownMemberId}
              open={live.detour === 'filter'}
              onOpen={(open) => live.onDetour(open ? 'filter' : 'none')}
            />
          ) : (
            <FilterBar waiting />
          )}
        </span>

        {/*
          The person, not the trip.

          `Sign out` was a bare button one pixel from the corner with no menu
          around it and nowhere for anything else to go. A profile route and a
          settings route are both waiting on somewhere to hang, and this is it.
        */}
        <span className={styles.account}>
          <Menu
            name="Account"
            disabled={live === null}
            label={
              <>
                {live ? (
                  <span className={styles.you}>{live.youAre}</span>
                ) : (
                  <NamePlaceholder className={styles.you} measure="13ch" />
                )}
                {/*
                  The same menu, named by a glyph once the header has no room
                  to spell it.

                  Thirteen characters of address answer a question nobody asked,
                  and on a 390px header they are a third of the row. The phone
                  settled this already: a menu holding what is rare, at the far
                  end, out of a thumb's reach.

                  Drawn rather than typed, for the reason the caret beside it
                  records — a typed `☰` takes the face's own weight and vertical
                  centring, so it is whatever size the font decided. The caret
                  itself goes at this width: a glyph that is only a glyph
                  already reads as a control, which is the whole job the caret
                  was doing.
                */}
                <Menu2 aria-hidden className={iconOnlyLabelClass} />
              </>
            }
            align="end"
            tone="quiet"
            open={live?.detour === 'account'}
            onOpen={(open) => live?.onDetour(open ? 'account' : 'none')}
          >
            {/*
              Who is signed in, said in full.

              The trigger shows a name at a laptop width and a glyph at a phone
              one, so neither is a place to put an address — but a menu about
              the person is exactly where "which account is this" belongs, and
              it is the question somebody opens this to answer when two of them
              share a laptop. The phone's menu already reads this way; this is
              the same three items in the same order.
            */}
            <span className={styles.identity}>
              <span className={styles.initials} aria-hidden>
                {initialsOf(live?.youAre ?? '')}
              </span>
              <span className={styles.identityName}>{live?.youAre}</span>
            </span>

            <hr className={styles.identityRule} />

            {/*
              Re-reading, for the one case that is not the ordinary one.

              Everything here re-reads when the tab is come back to, which is
              how somebody learns that the person they are planning with changed
              something. This is for when that is not enough — a tab left open
              and never blurred, or a read that failed — and `force` is what
              makes it mean something: without it the freshness floor would
              decline the request and the press would do nothing visible.
            */}
            <button
              type="button"
              onClick={() => void live?.onReread()}
              className={styles.menuRow}
            >
              <RefreshCw aria-hidden className={styles.menuRowGlyph} />
              Refresh
            </button>

            <form action={signOutAction}>
              <button type="submit" className={styles.signOut}>
                <LogOut aria-hidden className={styles.menuRowGlyph} />
                Sign out
              </button>
            </form>
          </Menu>
        </span>
      </header>

      {children}
    </div>
  )
}

/**
 * `CP` from `Cristian Perez`, `A` from `Account`.
 *
 * First and last rather than the first two letters, so a single word gives one
 * initial rather than reading itself as two.
 */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0]![0]!
  return (words.length > 1 ? first + words[words.length - 1]![0]! : first).toUpperCase()
}
