import type { Metadata } from 'next'

import { requireUser } from '@/lib/auth/guards'

import { Appearance } from './appearance'
import { BackToMap } from './back'
import styles from './settings.module.css'

export const metadata: Metadata = { title: 'Settings · pinpoint' }

/**
 * Settings: the account, and the ground everything is drawn on.
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
export default async function SettingsPage() {
  const user = await requireUser()

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
          <div className={styles.row}>
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
            <span className={styles.rowValue}>{user.email ?? 'No address on this account'}</span>
          </div>
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
