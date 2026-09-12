import AsyncStorage from '@react-native-async-storage/async-storage'
import { parseThemePreference, type ThemePreference } from '@pinpoint/tokens'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Where this application remembers what somebody chose.
 *
 * WHY THERE IS A STORE AT ALL, AND WHY IT IS THIS ONE
 *
 * The phone had nowhere to keep a preference. Three things want one — the ground
 * to draw on, the city last worked in, and the trip the app opens on — and the
 * last two are held in memory today, so both reset on a cold launch while the
 * laptop keeps its equivalents in the address. `expo-secure-store` was already
 * here, holding the session token, and using it was the obvious shortcut.
 *
 * It was rejected on one property: on iOS it is the Keychain, and a Keychain
 * item outlives the application that wrote it. Deleting the app and installing
 * it again would restore a preference from an application that is no longer
 * there — tolerable for a ground, wrong for a trip id that may name a trip this
 * account has since been removed from. None of the three is a secret, so nothing
 * is given up by moving them out of a secret store.
 *
 * WHY ONE KEY EACH RATHER THAN ONE BLOB
 *
 * Three callers writing three fields of one JSON object is three ways for one
 * write to overwrite another's, and the failure is silent and racy. A key each
 * costs nothing and cannot do that.
 *
 * This change writes only the theme. The other two keys are deliberately not
 * added speculatively — what they should hold when the trip is archived, or the
 * membership revoked, is a question that belongs to whoever adds them.
 */
const PREFIX = 'pinpoint.preference.'
const THEME_KEY = `${PREFIX}theme`

type PreferencesState = {
  theme: ThemePreference
  chooseTheme: (next: ThemePreference) => void
}

/**
 * The default before anything has been read, and after a read that failed.
 *
 * `'system'` is the state the product has been in since it was built, so a
 * storage failure costs somebody the behaviour they already had rather than a
 * wrong one.
 */
const UNREAD: ThemePreference = 'system'

const Context = createContext<PreferencesState | null>(null)

export function PreferencesProvider({
  children,
  onReady,
}: {
  children: ReactNode
  /**
   * Called once the stored values have been read, successfully or not.
   *
   * The gate in `_layout.tsx` waits on this. Reading is asynchronous, and
   * rendering the tree before it resolves would paint the default ground for a
   * frame or two on every cold launch — which is the launch flash this store
   * exists to remove, reintroduced by the store itself.
   */
  onReady: () => void
}) {
  const [theme, setTheme] = useState<ThemePreference>(UNREAD)

  useEffect(() => {
    let active = true

    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (active) setTheme(parseThemePreference(stored))
      })
      .catch(() => {
        // Deliberately swallowed, and deliberately still ready.
        //
        // A preference that cannot be read is not an error anybody can act on,
        // and refusing to render the application because of one would turn a
        // missing theme choice into a blank screen. The default stands.
      })
      .finally(() => {
        if (active) onReady()
      })

    return () => {
      active = false
    }
  }, [onReady])

  const chooseTheme = useCallback((next: ThemePreference) => {
    /*
     * The tree is updated first and the write is not waited on.
     *
     * Every colour on this platform is a value passed to a style object, so the
     * repaint is this `setState` and nothing else — making it wait on a disk
     * write would put a visible delay between the press and the colour for no
     * gain. A write that fails costs the choice at the next launch, which is
     * the same cost as never having made it.
     */
    setTheme(next)
    void AsyncStorage.setItem(THEME_KEY, next).catch(() => {})
  }, [])

  const value = useMemo(() => ({ theme, chooseTheme }), [theme, chooseTheme])

  return <Context value={value}>{children}</Context>
}

/**
 * Throws outside the provider rather than defaulting.
 *
 * A plausible fallback here would mean one screen drawing on a ground the rest
 * of the application is not on, which is invisible in a simulator whose
 * appearance happens to match and is the exact failure the shared resolver
 * exists to prevent.
 */
export function usePreferences(): PreferencesState {
  const state = useContext(Context)
  if (state === null) {
    throw new Error('usePreferences used outside PreferencesProvider')
  }
  return state
}
