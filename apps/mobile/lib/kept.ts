import { keepList, type KeptList, readKeptList } from '@pinpoint/data'
import { Directory, File, Paths } from 'expo-file-system'

/**
 * Where the phone keeps the trips it has read, so they open with no signal.
 *
 * Plain files in one folder rather than the preferences store. That store is
 * capped at 6 MB in total on Android, and a single value there cannot pass about
 * 2 MB — a few trips with several hundred places reach it. A folder has neither
 * limit, and deleting it is the whole of forgetting.
 *
 * One file per list, named by what it holds: `trips`, `markers-<trip id>`, and
 * so on. What counts as a readable copy is decided in `@pinpoint/data`; this
 * module only moves text.
 */
const folder = new Directory(Paths.document, 'offline')

function fileFor(name: string): File {
  return new File(folder, `${name}.json`)
}

/**
 * Read a kept list, synchronously.
 *
 * Synchronous on purpose: it runs while the screen's first render is being
 * worked out, so the trip is drawn from the copy in that same render instead of
 * flashing a loading state first. The files are a few hundred kilobytes at
 * most.
 *
 * Anything that goes wrong reads as no copy, and the trip loads the way it
 * always did.
 */
export function readKept<T>(name: string): KeptList<T> | null {
  try {
    const file = fileFor(name)
    if (!file.exists) return null
    return readKeptList<T>(file.textSync())
  } catch {
    return null
  }
}

/** Writes waiting to happen, by file, so a burst of taps writes once. */
const pending = new Map<string, ReturnType<typeof setTimeout>>()

/** How long a write waits for the next change before it happens. */
const SETTLE_MS = 300

/**
 * Keep a list, a moment from now.
 *
 * A failed write is dropped silently. The copy is a convenience for later; the
 * list on screen is unaffected, and the next change writes it again.
 */
export function writeKept<T>(name: string, kept: KeptList<T>): void {
  const waiting = pending.get(name)
  if (waiting !== undefined) clearTimeout(waiting)

  pending.set(
    name,
    setTimeout(() => {
      pending.delete(name)
      writeNow(name, keepList(kept))
    }, SETTLE_MS),
  )
}

/** Read any kept text by name — the waiting-tap queue uses the same folder. */
export function readKeptText(name: string): string | null {
  try {
    const file = fileFor(name)
    return file.exists ? file.textSync() : null
  } catch {
    return null
  }
}

/** Write kept text straight away. */
export function writeNow(name: string, text: string): void {
  try {
    folder.create({ intermediates: true, idempotent: true })
    fileFor(name).write(text)
  } catch {
    // See `writeKept`.
  }
}

/**
 * Forget everything the phone kept: every trip and every tap waiting to be
 * sent. Writes still waiting to happen are cancelled first, or one of them would
 * put a trip back a moment after it was forgotten.
 */
export function forgetKept(): void {
  for (const waiting of pending.values()) clearTimeout(waiting)
  pending.clear()
  try {
    if (folder.exists) folder.delete()
  } catch {
    // A folder that cannot be deleted cannot be read either.
  }
}
