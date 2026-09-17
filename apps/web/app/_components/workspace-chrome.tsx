'use client'

import { ArrowLeft, MapPinPlus, Search } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'

import { AccountMenu, type AccountMenuLiveProps } from '@/app/_components/account-menu'
import { ChromeBar } from '@/app/_components/chrome-bar'
import { CityBar, type CityBarLiveProps } from '@/app/_components/city-bar'
import { FilterBar, type FilterBarLiveProps } from '@/app/_components/filter-bar'
import { PlaceSearch, type PlaceSearchLiveProps } from '@/app/_components/place-search'
import { TripBar, type TripBarLiveProps } from '@/app/_components/trip-bar'
import type { PlaceCandidate } from '@pinpoint/geocode'
import { Button, toolGlyphClass, toolLabelClass } from '@/app/_components/ui'

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
  onSetTripDates: TripBarLiveProps['onSetDates']
  otherView: TripBarLiveProps['otherView']
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
   * A place was chosen from search. What that leads to is not this file's
   * business.
   *
   * It used to be: the chrome unpacked the candidate and asked for a capture,
   * which meant the one component with no access to the trip's markers was the
   * one deciding whether to add another. The whole candidate is handed over
   * instead, and the workspace — which holds the markers — decides between
   * opening the place the trip already has and starting a new one.
   */
  onChooseCandidate: (candidate: PlaceCandidate) => void

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

  youAre: AccountMenuLiveProps['youAre']

  detour: DetourPanel
  onDetour: (panel: DetourPanel) => void
}

/**
 * The map's bar, and the map's own stage below it.
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
 * **The bar itself is `ChromeBar` now**, because the calendar wears it too.
 * What is left in this file is what the map puts in each of its positions: the
 * trip, the city, the session band of three tools, and the account. Read left
 * to right that is scope, then the session, then the person — the arrangement
 * the bar states and every screen keeps.
 *
 * `<main>` is the caller's, passed straight through as children, and the bar
 * keeps it a sibling of the `<header>`: a `<header>` inside `<main>` exposes no
 * `banner` landmark at all, and nothing reports that.
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
    <ChromeBar
      scope={
        live ? (
          <TripBar
            trip={live.trip}
            trips={live.trips}
            members={live.members}
            onSelect={live.onSelectTrip}
            onRename={live.onRenameTrip}
            onSetDates={live.onSetTripDates}
            otherView={live.otherView}
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
        )
      }
      city={
        live ? (
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
        )
      }
      session={
        /*
          What a session is made of.

          On a laptop this sits in the bar between the scope and the person. At a
          phone width the same element is taken out of the flow and pinned to the
          bottom edge, over the map, within a thumb's reach — one set of
          controls in one place in the markup, drawn where the shape of the
          screen wants them. That relocation is this stylesheet's, not the bar's:
          the bar takes an element and leaves it to place itself.
        */
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
            <Search aria-hidden className={toolGlyphClass} />
            <span className={toolLabelClass}>Search</span>
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
              <ArrowLeft aria-hidden className={styles.backGlyph} />
            </button>

            {live ? (
              <PlaceSearch
                biasRef={live.biasRef}
                onChoose={(candidate: PlaceCandidate) => {
                  live.onSearchOpen(false)
                  live.onChooseCandidate(candidate)
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
            {/*
              `default`, and not `primary` — which is the decision #63 was
              opened to make and DESIGN.md's *The Chrome Fill Rule* now states.

              The accent fills a control that *commits* an act inside a form or
              a panel. This one commits nothing: it arms the map and waits, and
              what commits is `Use this spot`. So it is chrome, and chrome does
              not take the fill — the five marker families are what the whole
              palette's restraint was spent on, and a filled control standing
              here spends that budget continuously, in a fixed place the eye
              returns to, to emphasise a control at the moment nobody is using
              it.

              It also stops the row asserting a hierarchy `marker-capture`
              denies: search and drop are peers of which *neither SHALL be
              described as a fallback for the other*, and filling one of them
              said otherwise in colour, where no review reads it.

              `default` makes this and the filter a matched pair — two adjacent
              slots of identical width and identical construction, which are
              exactly the two controls a filled drop was ranking against each
              other. The trip and the city are `quiet` and the account is too;
              this bar was never a row of four identical pills.

              On both themes `.default`'s background is `--pp-surface`, which is
              also the bar's own, so the pair reads as hairline outlines rather
              than as filled shapes. That is the intended result, not something
              this control lost.
            */}
            <Button
              tone={dropping ? 'danger' : 'default'}
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
              <MapPinPlus aria-hidden className={toolGlyphClass} />
              <span className={styles.wideLabel}>
                {dropping ? 'Cancel' : '+ Drop a pin'}
              </span>
              <span className={toolLabelClass}>
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

          {/*
            The filter's slot, and the same reason the drop control has one.

            This trigger grows when a filter is applied — a count, a state dot,
            the two flex gaps those two children bring with them, and a heavier
            weight on the word. Its panel is positioned against it, so without a
            settled width the panel walks sideways at the moment somebody is
            choosing inside it, and the way out of the filter is a button in that
            panel, so pressing `Clear` moved the thing being pressed.

            One slot around both branches rather than one each: the waiting form
            and the live form are two spellings of one control, and a slot that
            fitted only one of them would change width when the trip arrives.
          */}
          <span className={styles.filter}>
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
        </span>
      }
      account={
        live ? (
          <AccountMenu
            youAre={live.youAre}
            open={live.detour === 'account'}
            onOpen={(open) => live.onDetour(open ? 'account' : 'none')}
          />
        ) : (
          <AccountMenu waiting />
        )
      }
    >
      {children}
    </ChromeBar>
  )
}
