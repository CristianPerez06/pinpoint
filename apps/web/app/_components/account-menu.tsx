'use client'

import { LogOut, Menu as Menu2, Settings } from 'lucide-react'
import Link from 'next/link'

import { signOutAction } from '@/app/_actions/auth'
import { iconOnlyLabelClass, Menu, NamePlaceholder } from '@/app/_components/ui'

import styles from './account-menu.module.css'

/**
 * The person, not the trip.
 *
 * `Sign out` was a bare button one pixel from the corner with no menu around it
 * and nowhere for anything else to go. A profile route and a settings route
 * were both waiting on somewhere to hang, and this is it.
 *
 * It is a component of its own because the bar it sits in is now shared. It was
 * written inline inside `workspace-chrome.tsx`, which meant the only way to put
 * an account menu on a second screen was to draw a second one — and two menus
 * holding `Sign out` agree about it on the day they are written and not
 * afterwards. Moved rather than rewritten, both of its states with it.
 */
export type AccountMenuLiveProps = {
  /** What to call the reader: their member name, or `Account` when none matches. */
  youAre: string
  open: boolean
  onOpen: (open: boolean) => void
}

/**
 * Either this control knows who is signed in, or it is waiting to be told.
 *
 * A union rather than a bag of optionals, the same shape `TripBar` and
 * `CityBar` already use: the waiting form cannot be rendered with half its
 * handlers and the live form cannot be rendered without them.
 */
export type AccountMenuProps =
  | { waiting: true }
  | ({ waiting?: false } & AccountMenuLiveProps)

export function AccountMenu(props: AccountMenuProps) {
  const live = props.waiting === true ? null : props

  return (
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
            The same menu, named by a glyph once the header has no room to spell
            it.

            Thirteen characters of address answer a question nobody asked, and
            on a 390px header they are a third of the row. The phone settled
            this already: a menu holding what is rare, at the far end, out of a
            thumb's reach.

            Drawn rather than typed, for the reason the caret beside it records
            — a typed `☰` takes the face's own weight and vertical centring, so
            it is whatever size the font decided. The caret itself goes at this
            width: a glyph that is only a glyph already reads as a control,
            which is the whole job the caret was doing.
          */}
          <Menu2 aria-hidden className={iconOnlyLabelClass} />
        </>
      }
      align="end"
      tone="quiet"
      open={live?.open ?? false}
      onOpen={(open) => live?.onOpen(open)}
    >
      {/*
        Who is signed in, said in full.

        The trigger shows a name at a laptop width and a glyph at a phone one,
        so neither is a place to put an address — but a menu about the person is
        exactly where "which account is this" belongs, and it is the question
        somebody opens this to answer when two of them share a laptop. The
        phone's menu already reads this way; this is the same three items in the
        same order.
      */}
      <span className={styles.identity}>
        <span className={styles.initials} aria-hidden>
          {initialsOf(live?.youAre ?? '')}
        </span>
        <span className={styles.identityName}>{live?.youAre}</span>
      </span>

      <hr className={styles.identityRule} />

      {/*
        **There is no `Refresh` row, and its absence is the requirement.**

        `data-freshness` gives the by-hand re-read to the native application and
        says of this one: *The web application SHALL NOT add one. Reloading the
        page is a control the browser already provides, and a second one inside
        the page duplicates it.* The escape hatch exists because a phone whose
        re-read failed while it was offline has no way back except force-quitting;
        a browser has reload.

        This menu carried one anyway, from #74 — eighteen pull requests after the
        requirement that forbids it landed in #56. It survived because no check
        reads the rows of a menu, and because on the map it was harmless-looking:
        the map re-reads on its own when the tab is come back to, so the row was
        a duplicate of something that already worked. What made it visible was
        the calendar wearing this menu too, where nothing re-reads on its own and
        the row was suddenly the only way — which reads as the row being load
        bearing rather than as the screen missing the automatic re-read.

        So the row is gone rather than moved. A floating button somewhere else
        would have been a second copy of reload in a new place.
      */}

      {/*
        The account's own screen, and the only row here that leaves.

        Rare, and about the account rather than the trip, which is exactly what
        this menu is for — the standing rule is that a rare action lives behind
        the name of what it acts on, and the control this hangs from is the name
        of the account.

        Above `Sign out` and never below it. That order is a rule rather than a
        layout preference: signing out stays at the end and away from anything
        reached often, so that neither is hit while aiming for the other.

        A `Link` rather than a button, so it is openable in a new tab and reads
        as the navigation it is. The phone's menu carries the same row in the
        same position.
      */}
      <Link href="/settings" className={styles.menuRow}>
        <Settings aria-hidden className={styles.menuRowGlyph} />
        Settings
      </Link>

      <form action={signOutAction}>
        <button type="submit" className={styles.signOut}>
          <LogOut aria-hidden className={styles.menuRowGlyph} />
          Sign out
        </button>
      </form>
    </Menu>
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
