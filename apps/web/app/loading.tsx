import { LoadingState } from '@/app/_components/states'
import { WorkspaceChrome } from '@/app/_components/workspace-chrome'

import chrome from '@/app/_components/trip-workspace.module.css'

/**
 * Shown while the page's own data is being fetched on the server.
 *
 * This used to be the loading state and nothing else, which meant the first
 * thing anybody saw said nothing at all about the second: a band of text on an
 * empty page, and then, in one step, an entire interface. The frame around the
 * map was never waiting for anything — its arrangement is the same for every
 * trip and is known before any trip is read — so it is drawn here, inert, and
 * only the map waits.
 *
 * `WorkspaceChrome` is the same component the workspace renders, given `null`
 * instead of a trip. That is what makes this safe to keep: there is no second
 * bar to hold in agreement with the real one, and no way to change one without
 * changing the other.
 *
 * `<main>` is passed as a child and stays a sibling of the chrome's `<header>`.
 * A `<header>` inside `<main>` exposes no `banner` landmark, and this route
 * would otherwise be the one place that quietly lost it.
 */
export default function Loading() {
  return (
    <WorkspaceChrome live={null}>
      <main className={chrome.stageWaiting}>
        <LoadingState what="your trip" bare />
      </main>
    </WorkspaceChrome>
  )
}
