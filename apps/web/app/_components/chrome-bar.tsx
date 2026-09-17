import type { ReactNode } from 'react'

import styles from './chrome-bar.module.css'

/**
 * The bar, as a shell with positions in it.
 *
 * One definition, so the screens that wear it cannot drift into two bars. Read
 * left to right it is scope, then the session, then the person: what is being
 * looked at and everything rare belonging to it, then what a session on this
 * screen is actually made of, then the account — at the far end, where
 * `DESIGN.md` wants rare destructive things kept.
 *
 * Each position takes *what goes in it* rather than the data to build it from.
 * The alternative was a mode flag and one bindings object with every screen's
 * fields in it, the absent ones stubbed — rejected because a stub is
 * indistinguishable from a value at the type level, so the next field added to
 * that object gets a stub on the screen that has nothing to put there and
 * nobody finds out. Positions make each screen's bar say what it holds.
 *
 * Nothing here knows what a session is. The map hands over a toolbar that
 * relocates to the bottom edge of a phone; the calendar hands over the way back
 * to the map. Both are elements that place themselves, so this file has no
 * opinion to drift out of date.
 *
 * `children` is the screen, and it must stay a *sibling* of the `<header>`
 * rather than a parent of it: a `<header>` inside `<main>` exposes no `banner`
 * landmark at all, and nothing reports that.
 */
export function ChromeBar({
  scope,
  city,
  session,
  account,
  children,
}: {
  /** The trip's name — the control that reveals everything acting on the trip. */
  scope: ReactNode
  /**
   * The city being worked in, where the screen has one.
   *
   * Absent rather than empty on a screen with no city: there is no camera to
   * frame and nowhere to bias a search, so a city control here would offer more
   * than it can do. Leaving it out is also what collapses the phone-width grid
   * to a single row, which is why this is one optional position and not a flag
   * beside a required one.
   */
  city?: ReactNode
  /** What a session on this screen is made of. Places itself; see above. */
  session: ReactNode
  /** The person, not the trip. */
  account: ReactNode
  children: ReactNode
}) {
  const hasCity = city !== undefined && city !== null

  return (
    <div className={styles.shell}>
      <header className={`${styles.bar} ${hasCity ? '' : styles.oneRow}`}>
        <span className={styles.point} aria-hidden />

        {/*
          The scope's names are wrapped rather than placed directly.

          At a phone width the bar becomes a two-row grid and each name needs a
          cell of its own to be put in. `TripBar` and `CityBar` both render a
          `Menu`, whose root carries the same class as every other menu in the
          chrome, so there is nothing in the markup to address them by. Wrapping
          is the smallest thing that gives each one a name — and it changes
          neither component, which is what keeps the dismissal contract theirs.
        */}
        <span className={styles.scope}>{scope}</span>

        {hasCity ? (
          <>
            {/* A path on a laptop, and nothing at all on a phone, where the two
                names are on separate lines and the narrowing is said by the
                indent instead. */}
            <span className={styles.scopeSep} aria-hidden>
              /
            </span>

            {/*
              The city is a narrowing of the trip, so it reads as one — which is
              also true of what it does: it frames the camera on that city's
              places and biases search toward them. It still does not filter the
              map.
            */}
            <span className={styles.city}>{city}</span>
          </>
        ) : null}

        {session}

        <span className={styles.account}>{account}</span>
      </header>

      {children}
    </div>
  )
}
