import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The pieces a form on this platform is built from.
 *
 * New to mobile, and only now: until this change the phone had nothing a person
 * typed into except the login screen, which carries its own fields because it
 * predates having anywhere to put shared ones.
 *
 * Deliberately not shared with web's `ui.tsx`, and not for want of trying — the
 * `styling` spec forbids it. Web's `TextField` renders a `<label>` around an
 * `<input>` and carries a stylesheet; this one renders a `View` around a
 * `TextInput` and carries a `StyleSheet`. There is no cross-platform styling
 * runtime and adding one is rejected by default. What the two share is the token
 * values, which is the whole of what the spec says may be shared.
 */

export function FieldLabel({ children }: { children: string }) {
  const theme = useTheme()
  return (
    <Text style={[styles.label, { color: theme.colour.inkMuted }]}>{children}</Text>
  )
}

export function TextField({
  label,
  value,
  onChange,
  error,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  /**
   * Which field a rejection was about.
   *
   * Rendered beside the field rather than only in a summary, because a form of
   * six fields with one message at the top makes the person find the offender
   * themselves.
   */
  error?: string
  placeholder?: string
  multiline?: boolean
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: TextInputProps['autoCapitalize']
  autoFocus?: boolean
}) {
  const theme = useTheme()

  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colour.inkMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        accessibilityLabel={label}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : null,
          {
            color: theme.colour.ink,
            backgroundColor: theme.colour.surfaceMuted,
            // A rejected field is outlined as well as described, so the two
            // agree without the person having to read to find out which.
            borderColor: error ? theme.colour.danger : theme.colour.line,
          },
        ]}
      />
      {error ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: theme.colour.danger }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  )
}

export function Button({
  label,
  onPress,
  tone = 'quiet',
  disabled,
}: {
  label: string
  onPress: () => void
  tone?: 'primary' | 'quiet' | 'danger'
  disabled?: boolean
}) {
  const theme = useTheme()

  const background =
    tone === 'primary'
      ? theme.colour.accent
      : tone === 'danger'
        ? theme.colour.dangerSurface
        : 'transparent'
  const ink =
    tone === 'primary'
      ? // Not `ground`, which is what this was and is only half right: on the
        // dark theme `ground` is near-black over amber and clears 9.35:1, and
        // on the light one it is near-white over the same amber and clears
        // 2.26:1. `inkOnAccent` is the pair chosen against the accent itself.
        theme.colour.inkOnAccent
      : tone === 'danger'
        ? theme.colour.danger
        : theme.colour.ink

  return (
    <Pressable
      onPress={() => {
        if (!disabled) onPress()
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      // Inert through `accessibilityState` rather than by being unreachable, so
      // a screen reader still finds it and is told which state it is in — the
      // same treatment `Clear` gets in the bottom row.
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={[
        styles.button,
        {
          backgroundColor: background,
          borderColor: tone === 'quiet' ? theme.colour.lineStrong : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: ink }]}>{label}</Text>
    </Pressable>
  )
}

/**
 * Something said above a form, in one of two registers.
 *
 * `danger` means the form is wrong and the person should correct it. `notice`
 * means the world moved underneath them — somebody else changed this place — and
 * the next action is to look rather than to retype. They are kept apart for the
 * reason web keeps them apart: sharing one channel makes the two
 * indistinguishable exactly where the difference matters.
 */
export function FormNote({
  children,
  tone,
}: {
  children: string
  tone: 'danger' | 'notice'
}) {
  const theme = useTheme()

  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
      style={[
        styles.note,
        {
          backgroundColor:
            tone === 'danger' ? theme.colour.dangerSurface : theme.colour.accentWash,
        },
      ]}
    >
      <Text
        style={[
          styles.noteText,
          { color: tone === 'danger' ? theme.colour.danger : theme.colour.accentInk },
        ]}
      >
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: SPACE.xs },
  label: { ...role(TYPE.label) },
  input: {
    ...role(TYPE.body),
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.sm + 2,
    // Vertical padding rather than a height, so a larger system text size grows
    // the field instead of clipping what is in it.
    paddingVertical: 10,
  },
  inputMultiline: { minHeight: 74, textAlignVertical: 'top' },
  error: { ...role(TYPE.note) },
  button: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: SPACE.md,
    alignItems: 'center',
  },
  buttonText: { ...role(TYPE.control), fontWeight: '700' },
  note: {
    borderRadius: RADIUS.md,
    padding: SPACE.sm + 2,
  },
  noteText: { ...role(TYPE.note) },
})
