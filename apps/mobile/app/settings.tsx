import { SPACE, RADIUS, TYPE, type ThemePreference } from '@pinpoint/tokens'
import { Redirect, useRouter } from 'expo-router'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import Check from 'lucide-react-native/icons/check'
import Monitor from 'lucide-react-native/icons/monitor'
import Moon from 'lucide-react-native/icons/moon'
import Sun from 'lucide-react-native/icons/sun'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { usePreferences } from '@/lib/preferences'
import { useSession } from '@/lib/session'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Settings: the account, and the ground everything is drawn on.
 *
 * THIS IS THE FIRST SCREEN SOMEBODY COMES BACK FROM
 *
 * Every other route in this application either replaces what came before or is
 * arrived at by `<Redirect>`. Sign-in and sign-up are a lateral pair, and each
 * carries a text link to the other because `_layout.tsx` sets
 * `headerShown: false` for the whole stack and there is no system back control
 * anywhere — a fact `signup.tsx` records beside the link that depends on it.
 *
 * A screen somebody *returns* from wants a different gesture. A link at the
 * bottom of the page is a place to go next; an arrow at the top left is the way
 * back, and it is where a thumb already goes. So this screen draws its own
 * header rather than taking a native one: a per-screen native header would be a
 * second chrome idiom to dress from tokens, for one screen.
 *
 * WHAT THIS SCREEN DOES NOT READ
 *
 * No trip, no markers, no cities, no membership. Its subject is the account, so
 * it needs the session and nothing else.
 */
export default function SettingsScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { session, loading } = useSession()

  // The same guard every signed-in route carries. `loading` is a real state:
  // reading the session back is asynchronous, and redirecting during that frame
  // would bounce somebody out of a screen they are entitled to.
  if (!loading && !session) return <Redirect href="/login" />

  return (
    <View style={[styles.screen, { backgroundColor: theme.colour.ground, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            // `back()` when there is something to go back to, and the map
            // otherwise. A person who reached this screen from a deep link has
            // no history, and a back control that does nothing when pressed is
            // worse than one that goes somewhere sensible.
            if (router.canGoBack()) router.back()
            else router.replace('/')
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
          // 44pt, which is the floor rather than the aspiration. The glyph is
          // 20pt and the padding is what makes the target.
          hitSlop={8}
          style={styles.back}
        >
          <ArrowLeft size={20} color={theme.colour.ink} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colour.ink }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: SPACE.xl + insets.bottom },
        ]}
      >
        <Section title="Account">
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colour.surface, borderColor: theme.colour.line },
            ]}
          >
            <Text style={[styles.rowLabel, { color: theme.colour.inkMuted }]}>Signed in as</Text>
            {/*
              The address, and deliberately no name.

              `displayName` belongs to a trip membership rather than to an
              account — the same person can be called one thing on one trip and
              something else on another — so a name here would be whichever trip
              happened to be open when this was pressed. The menu shows a name
              because the menu is on a trip. This screen is not.
            */}
            <Text style={[styles.rowValue, { color: theme.colour.ink }]}>
              {session?.user.email ?? 'No address on this account'}
            </Text>
          </View>
        </Section>

        <Section title="Appearance">
          <Appearance />
        </Section>
      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colour.inkMuted }]}>{title}</Text>
      {children}
    </View>
  )
}

/**
 * The three grounds, and why this is not a switch.
 *
 * A two-state toggle would have to drop "follow the device", which is the state
 * everybody using this product is in today. Offering light and dark alone turns
 * a working default into something nobody chose, with no way back to it.
 */
const OPTIONS: readonly {
  value: ThemePreference
  label: string
  note: string
  Glyph: typeof Sun
}[] = [
  {
    value: 'system',
    label: 'Follow the device',
    note: 'Changes when your system appearance does',
    Glyph: Monitor,
  },
  { value: 'light', label: 'Light', note: 'Always the light ground', Glyph: Sun },
  { value: 'dark', label: 'Dark', note: 'Always the dark ground', Glyph: Moon },
]

function Appearance() {
  const theme = useTheme()
  const { theme: preference, chooseTheme } = usePreferences()

  return (
    <View style={styles.options}>
      {OPTIONS.map(({ value, label, note, Glyph }) => {
        const selected = preference === value

        /*
         * Selected is carried by the wash, the border and the tick together.
         *
         * `DESIGN.md` asks every state to survive a greyscale screen and a
         * colour-blind reader, and hue alone survives neither. The tick is the
         * half that does that; the wash is the half that makes it findable at a
         * glance. `accentWash` with `accentInk`, never the raw accent — that is
         * reserved for the focus ring, the pin halo and controls that commit.
         */
        return (
          <Pressable
            key={value}
            onPress={() => chooseTheme(value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={label}
            style={[
              styles.option,
              {
                backgroundColor: selected ? theme.colour.accentWash : theme.colour.surface,
                borderColor: selected ? theme.colour.accentRing : theme.colour.line,
              },
            ]}
          >
            <Glyph
              size={18}
              color={selected ? theme.colour.accentInk : theme.colour.inkMuted}
              strokeWidth={2}
            />
            <View style={styles.optionText}>
              <Text
                style={[
                  styles.optionLabel,
                  { color: selected ? theme.colour.accentInk : theme.colour.ink },
                ]}
              >
                {label}
              </Text>
              <Text
                style={[
                  styles.optionNote,
                  { color: selected ? theme.colour.accentInk : theme.colour.inkMuted },
                  // `inkMuted` is chosen against `surface` and is not guaranteed
                  // against the accent wash, so the selected row letters its own
                  // secondary line rather than inheriting one picked for a
                  // different ground.
                  selected ? styles.optionNoteSelected : null,
                ]}
              >
                {note}
              </Text>
            </View>
            {selected ? (
              <Check size={17} color={theme.colour.accentInk} strokeWidth={2.5} />
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  title: { ...role(TYPE.title) },
  /*
   * The scroll lives inside a `flex: 1` screen, which has a definite height, so
   * it does not meet the collapse that catches a `ScrollView` inside a
   * container sized to its children.
   */
  content: { paddingHorizontal: SPACE.md, gap: SPACE.lg },
  section: { gap: SPACE.sm },
  sectionTitle: { ...role(TYPE.label) },
  card: {
    gap: 2,
    padding: SPACE.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  rowLabel: { ...role(TYPE.note) },
  rowValue: { ...role(TYPE.body) },
  options: { gap: SPACE.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  optionText: { flex: 1, minWidth: 0, gap: 1 },
  optionLabel: { ...role(TYPE.rowName) },
  optionNote: { ...role(TYPE.note) },
  optionNoteSelected: { opacity: 0.78 },
})
