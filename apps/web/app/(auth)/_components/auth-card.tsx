import type { ReactNode } from 'react'

import styles from '../auth.module.css'

/**
 * The card every screen about getting in is drawn on: wordmark, title, an
 * optional line under it, and the form.
 *
 * Takes words already said, because it is drawn by server components that
 * resolve their own with `serverSay` and by nothing else.
 */
export function AuthCard({
  brand,
  title,
  subtitle,
  children,
}: {
  brand: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <span className={styles.wordmark}>
          <span className={styles.dot} aria-hidden />
          {brand}
        </span>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {children}
      </div>
    </main>
  )
}
