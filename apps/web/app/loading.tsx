import { LoadingState } from '@/app/_components/states'

import styles from './page.module.css'

/**
 * Shown while the page's own data is being fetched on the server.
 *
 * The app had no loading boundary at all before this: the page awaited its
 * query and the browser showed the previous screen until it settled. That is
 * indistinguishable from a stalled request, and — once the page became a map —
 * it would have been indistinguishable from a trip with nothing on it.
 */
export default function Loading() {
  return (
    <div className={styles.full}>
      <LoadingState what="your trip" />
    </div>
  )
}
