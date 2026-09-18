import type { ReactNode } from 'react'

import { NamePlaceholder } from '@/app/_components/ui'

import { Appearance } from './appearance'
import { BackToMap } from './back'
import styles from './settings.module.css'

/**
 * Settings: the account, and the ground everything is drawn on.
 *
 * Drawn from the account — or from nothing yet. The page renders it with the
 * signed-in address and `loading.tsx` renders it with `null`, so the screen a
 * reload shows first is this one, standing where it will stand, rather than a
 * blank page. One definition for both, which is what `waiting-screens` asks for:
 * two renderings that merely look alike disagree the first time either is edited.
 *
 * Only the address waits. The way back and the choice of appearance need nothing
 * from the account, so they work from the first paint rather than being held
 * inert for a read they do not depend on.
 *
 * WHAT THIS SCREEN DOES NOT READ
 *
 * No trip, no markers, no cities, no membership. It is the first screen in this
 * application that is neither the map nor a sign-in, and the first whose
 * subject is the *account* rather than a trip — so it needs the session and
 * nothing else, and stays cheap because of it. If this file ever grows an
 * import from `@pinpoint/data`, something trip-scoped has been put on an
 * account-scoped screen.
 *
 * WHY THERE ARE SECTIONS WITH ONE THING IN THEM
 *
 * Account carries an address and no controls yet; the password form that
 * belongs in it is a separate change. The section exists now rather than later
 * because it is what makes this a settings screen instead of an appearance
 * screen with a heading — and because a section added under somebody else's
 * change is a section whose shape gets decided by whatever is being added to it.
 */
export function SettingsScreen({
  accountRow,
}: {
  /**
   * The one part that waits: an `AccountRow`, streamed in behind its own
   * boundary so that everything around it is live from the first paint.
   */
  accountRow: ReactNode
}) {
  return (
    <main className={styles.screen}>
      <div className={styles.sheet}>
        <header className={styles.header}>
          <BackToMap />
          <h1 className={styles.title}>Settings</h1>
        </header>

        <section className={styles.section} aria-labelledby="settings-account">
          <h2 id="settings-account" className={styles.sectionTitle}>
            Account
          </h2>
          {accountRow}
        </section>

        <section className={styles.section} aria-labelledby="settings-appearance">
          <h2 id="settings-appearance" className={styles.sectionTitle}>
            Appearance
          </h2>
          <Appearance />
        </section>
      </div>
    </main>
  )
}

/**
 * The account's row: the address, or a bar standing where it will go.
 *
 * Its own component because it is the only thing on the screen that waits, and
 * it waits behind its own boundary. `null` is the waiting form.
 */
export function AccountRow({
  account,
}: {
  /** The signed-in account, or `null` while it is still being read. */
  account: { email: string | null } | null
}) {
  // While the account is being read, the row says so to assistive technology
  // and the address is a drawn bar. Nothing here may write "No address on this
  // account" before that is known — it is a claim, and false for as long as the
  // account has not been read.
  return (
    <div className={styles.row} aria-busy={account ? undefined : true}>
      {account ? null : (
        <p role="status" className={styles.visuallyHidden}>
          Loading your account
        </p>
      )}
      <span className={styles.rowLabel}>Signed in as</span>
      {/*
        The address, and deliberately no name.

        `display_name` belongs to a trip membership, not to an account —
        the same person can be `Cris` on one trip and `Cristian` on
        another — so a name here would be whichever trip happened to be
        open when Settings was pressed, changing for a reason this screen
        never mentions. The menu shows a name because the menu is on a
        trip; this is not.
      */}
      <span className={styles.rowValue}>
        {account ? (
          (account.email ?? 'No address on this account')
        ) : (
          <NamePlaceholder className={styles.addressPlaceholder} measure="22ch" />
        )}
      </span>
    </div>
  )
}
