import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import type { Message } from '@pinpoint/wording'
import { message } from '@pinpoint/wording'
import type { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { fieldRole, role } from '@/lib/type'

/**
 * The card the reset screens are drawn on, and the pieces inside it.
 *
 * Sign-in and sign-up keep their own copies of this layout, on purpose (see
 * `signup.tsx`). The three reset screens are a set of their own, and three more
 * copies would be five, so they share this one. It is sign-in's layout,
 * keyboard handling and comments included.
 */
export function AuthScreen({
  title,
  subtitle,
  notice,
  formError,
  children,
}: {
  title: Message
  subtitle?: Message
  notice?: Message | null
  formError?: Message | null
  children: ReactNode
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const say = useSay()

  return (
    <KeyboardAvoidingView
      // Padding on both platforms, which is not what the sheets do — they pass
      // `undefined` on Android on the premise that `adjustResize` shrinks the
      // window and a second correction in JavaScript would double it. Measured
      // on an emulator, it does not: Expo enforces edge-to-edge from SDK 54, the
      // window keeps its full height, and with `undefined` the sign-in screen sat
      // centred in all 914dp of it with the submit button behind the keyboard.
      behavior="padding"
      // Nothing but `flex: 1`. With `behavior="padding"` this view overwrites
      // any `paddingBottom` handed to it with 0 whenever the keyboard is down
      // (`AGENTS.md`), so the screen's own padding lives on the scrolled
      // content below and not here.
      style={[styles.screen, { backgroundColor: theme.colour.ground }]}
    >
      <ScrollView
        // `flexGrow: 1` with `justifyContent: 'center'` keeps the card centred
        // while it fits and lets it scroll when it does not.
        contentContainerStyle={[styles.body, { paddingBottom: SPACE.lg + insets.bottom }]}
        // Without this the first tap on a button only dismisses the keyboard
        // and the second one presses it.
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colour.surface, borderColor: theme.colour.line },
          ]}
        >
          <View style={styles.wordmark}>
            <View style={[styles.dot, { backgroundColor: theme.colour.accent }]} />
            <Text style={[styles.brand, { color: theme.colour.ink }]}>
              {say(message('app.name'))}
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.colour.ink }]}>{say(title)}</Text>

          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.colour.inkMuted }]}>
              {say(subtitle)}
            </Text>
          ) : null}

          {formError ? (
            <Text
              accessibilityRole="alert"
              style={[
                styles.box,
                {
                  backgroundColor: theme.colour.dangerSurface,
                  borderColor: theme.colour.danger,
                  color: theme.colour.danger,
                },
              ]}
            >
              {say(formError)}
            </Text>
          ) : notice ? (
            <Text
              style={[
                styles.box,
                {
                  backgroundColor: theme.colour.accentWash,
                  borderColor: theme.colour.accent,
                  color: theme.colour.ink,
                },
              ]}
            >
              {say(notice)}
            </Text>
          ) : null}

          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

/** A labelled input with its refusal under it. */
export function AuthField({
  label,
  error,
  ...input
}: { label: Message; error?: Message } & TextInputProps) {
  const theme = useTheme()
  const say = useSay()

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colour.inkMuted }]}>{say(label)}</Text>
      <TextInput
        placeholderTextColor={theme.colour.inkMuted}
        style={[
          styles.input,
          { backgroundColor: theme.colour.surfaceMuted, color: theme.colour.ink },
        ]}
        {...input}
      />
      {error ? (
        <Text style={[styles.fieldError, { color: theme.colour.danger }]}>{say(error)}</Text>
      ) : null}
    </View>
  )
}

/**
 * The main button. Says `busy` while it works and takes no second press.
 *
 * `quiet` is the lesser action beside it — "Send it again" — outlined rather
 * than filled, so one screen never offers two things that look equally primary.
 */
export function AuthButton({
  label,
  busy,
  busyLabel,
  disabled,
  quiet,
  onPress,
}: {
  label: Message
  busy?: boolean
  busyLabel?: Message
  disabled?: boolean
  quiet?: boolean
  onPress: () => void
}) {
  const theme = useTheme()
  const say = useSay()
  const off = Boolean(busy || disabled)

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: Boolean(busy) }}
      style={[
        styles.button,
        quiet
          ? { borderWidth: 1, borderColor: theme.colour.lineStrong }
          : { backgroundColor: theme.colour.accent, opacity: off ? 0.55 : 1 },
      ]}
    >
      {/* Not white on amber: that clears about 1.7:1. `inkOnAccent` is the
          pair chosen against the accent on each ground. */}
      <Text
        style={[
          styles.buttonText,
          {
            color: quiet
              ? off
                ? theme.colour.inkMuted
                : theme.colour.ink
              : theme.colour.inkOnAccent,
          },
        ]}
      >
        {busy && busyLabel ? say(busyLabel) : say(label)}
      </Text>
    </Pressable>
  )
}

/**
 * A line of text that is a control, in the accent.
 *
 * The padding is the tap target, not decoration: a line of `note` text is about
 * 17pt tall on its own, and there is no hover here to reveal it is pressable.
 */
export function AuthLink({ label, onPress }: { label: Message; onPress: () => void }) {
  const theme = useTheme()
  const say = useSay()

  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={styles.link}>
      <Text style={[styles.linkText, { color: theme.colour.accent }]}>{say(label)}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    gap: SPACE.md,
    padding: SPACE.lg,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
  },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  brand: { ...role(TYPE.title), fontWeight: '800', letterSpacing: -0.6 },
  title: { ...role(TYPE.display), fontSize: 28, lineHeight: 32 },
  subtitle: { ...role(TYPE.body) },
  field: { gap: 5 },
  label: { ...role(TYPE.label) },
  input: {
    ...fieldRole(TYPE.body),
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldError: { ...role(TYPE.note), fontWeight: '600' },
  box: {
    ...role(TYPE.note),
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    borderRadius: RADIUS.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: { ...role(TYPE.control), fontWeight: '600' },
  link: { paddingVertical: 14, alignItems: 'center' },
  linkText: { ...role(TYPE.note), fontWeight: '600' },
})
