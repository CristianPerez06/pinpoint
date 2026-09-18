import {
  dateOfDay,
  dayOfDate,
  formatDay,
  formatDayNumeric,
  type IsoDay,
  todayAsDay,
} from '@pinpoint/core'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import Calendar from 'lucide-react-native/icons/calendar'
import { useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native'

import { useTheme, useThemeMode } from '@/lib/theme'
import { fieldRole, role } from '@/lib/type'

/**
 * The pieces a form on this platform is built from.
 *
 * New to mobile, and only now: until this change the phone had nothing a person
 * typed into except the login screen, which carries its own fields because it
 * predates having anywhere to put shared ones.
 *
 * The sign-up screen beside it carries its own too, for a second reason that is
 * about this file rather than about history: `TextField` below takes no
 * `secureTextEntry` and no `autoComplete`, so a password field cannot use it.
 * Adding those props would change a component four other forms already render,
 * to serve two fields on one screen. If a third screen ever wants a password,
 * that is the moment to reconsider — not before.
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

/**
 * The drawn bar that stands in for a name not yet read.
 *
 * The phone's copy of the laptop's (`ui.module.css` `.namePlaceholderBar`), with
 * the same arithmetic: a box as tall as one line of the text it replaces and as
 * wide as that text is given, holding an 11px bar centred in it — so the box
 * does not change size when the name lands.
 *
 * `inkFaint` because `styling` forbids that colour for text and keeps it for
 * what is drawn, which this is. Hidden from assistive technology: whatever
 * holds it says what is loading, and a shape read out says nothing.
 */
export function NamePlaceholder({
  width,
  lineHeight,
}: {
  /** The width the name will have, in points, or a share of its container. */
  width: number | `${number}%`
  /** One line of the text being replaced — the `lineHeight` of its role. */
  lineHeight: number
}) {
  const theme = useTheme()
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height: lineHeight, justifyContent: 'center' }}
    >
      <View
        style={{
          height: 11,
          borderRadius: RADIUS.sm,
          backgroundColor: theme.colour.inkFaint,
        }}
      />
    </View>
  )
}

/**
 * A day, chosen with the platform's own date control.
 *
 * WHY THE PLATFORM'S CONTROL AND NOT ONE OF OURS
 *
 * `trip-calendar` says the date control is a field within the form and raises no
 * panel **of the product's own** over it, because the form is already raised over
 * whatever the person was reading and a second layer of ours would bury it under
 * two. The system's picker is not one of ours — which is the same reasoning that
 * lets the laptop use the browser's `<input type="date">`, and it is why this does
 * not wait on the question of replacing that one (#145).
 *
 * WHY THE EMPTY STATE IS OURS
 *
 * **A date picker cannot say "no day".** It always has a date under it, on both
 * platforms. So this field owns the two things the picker cannot express: it says
 * `No day yet` when the place has none, and it carries its own `Clear`, which is
 * what satisfies the requirement that clearing returns a place to having no day
 * rather than to a particular one.
 *
 * The first press on an empty field hands over the platform's control seeded on
 * today. That is a real choice rather than an oversight: the alternative is a
 * control that opens on a date it then refuses to show, and nothing is written
 * until the form is saved — with `Clear` beside it the whole time.
 *
 * WHY THE THEME IS PASSED IN
 *
 * The picker draws in the *device's* appearance unless told otherwise, so
 * somebody running this app dark on a light phone would open a light calendar out
 * of a dark sheet. iOS takes `themeVariant`; it is given the ground the app has
 * actually resolved, not the one the system prefers.
 */
export function DayField({
  label,
  value,
  onChange,
  error,
  clearable = true,
  standalone = false,
  waiting = false,
}: {
  label: string
  /** The day, or null for a place whose day has not been decided. */
  value: IsoDay | null
  onChange: (day: IsoDay | null) => void
  error?: string
  /**
   * Whether having no day is a state this field can reach.
   *
   * True for a place, whose day may not have been decided, and false for the
   * calendar's own band: the day being read is always a day, there is no "no
   * day" to be on, and a `Clear` there would be a control with nowhere to go.
   */
  clearable?: boolean
  /**
   * Drawn among buttons rather than among a form's fields.
   *
   * The calendar's day band stands it between two step buttons, and the laptop
   * dresses that field as those buttons are — the surface and the stronger
   * line. In a form it matches the text fields beside it instead.
   */
  standalone?: boolean
  /**
   * The day is not known yet — the calendar's band before its trip is read.
   *
   * The same field, inert: in the tab order, reported unavailable, doing
   * nothing when pressed, and drawn in the chrome's inert look (sunk fill, no
   * outline) with a bar where the date will be. A date written there would be
   * a guess, since which day a trip opens on depends on its dates.
   */
  waiting?: boolean
}) {
  const theme = useTheme()
  const mode = useThemeMode()

  /*
   * What the picker stands on while there is no day. Today, and deliberately not
   * a stored "last used" anything: a date nobody chose should not be the one a
   * control opens on tomorrow.
   */
  const standingOn = value === null ? todayAsDay() : value

  /** Whether the calendar is open. iOS only: Android's is the system's dialog. */
  const [picking, setPicking] = useState(false)

  /*
   * `onValueChange` rather than `onChange`.
   *
   * The library deprecated the single callback that told choosing and
   * dismissing apart by an event type, and says so at runtime. This is the one
   * that replaced it, and it is the better shape: dismissing Android's dialog is
   * simply not a day being chosen, so nothing here has to remember to check for
   * it — and forgetting was how a cancelled dialog would have written a day
   * somebody had just declined to choose.
   */
  function chosen(_event: unknown, date: Date) {
    onChange(dayOfDate(date))
  }

  function openOnAndroid() {
    DateTimePickerAndroid.open({
      value: dateOfDay(standingOn),
      mode: 'date',
      onValueChange: chosen,
    })
  }

  /*
   * Choosing a day is the whole of what the popup is for, so choosing one
   * closes it. Paging between months changes nothing and leaves it open.
   */
  function chosenOnIos(event: unknown, date: Date) {
    setPicking(false)
    chosen(event, date)
  }

  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>

      <View style={styles.dayRow}>
        {/*
          Our own field on both platforms, drawn as the laptop's is: the date on
          the left, a calendar on the right.

          iOS's compact picker was the field there until now, and it could be
          neither: it words the date in the device's locale rather than as the
          laptop does, and it opens its calendar wherever iOS decides, beside
          the control. Pressing this one opens the same calendar in a popup
          centred on the screen. Android keeps its system dialog, which is
          already centred.
        */}
        <Pressable
          onPress={() => {
            if (waiting) return
            if (Platform.OS === 'ios') setPicking(true)
            else openOnAndroid()
          }}
          accessibilityRole="button"
          accessibilityState={waiting ? { disabled: true } : undefined}
          accessibilityLabel={
            waiting
              ? label
              : value === null
                ? `${label}, no day yet`
                : `${label}, ${formatDay(value)}`
          }
          style={[
            styles.dayValue,
            waiting
              ? {
                  backgroundColor: theme.colour.surfaceSunk,
                  borderColor: 'transparent',
                }
              : {
                  backgroundColor: standalone
                    ? theme.colour.surface
                    : theme.colour.surfaceMuted,
                  borderColor: error
                    ? theme.colour.danger
                    : standalone
                      ? theme.colour.lineStrong
                      : theme.colour.line,
                },
          ]}
        >
          {waiting ? (
            <NamePlaceholder
              width={96}
              lineHeight={TYPE.body.size * TYPE.body.lineHeight}
            />
          ) : (
            <Text
              numberOfLines={1}
              style={[
                styles.dayText,
                {
                  color: value === null ? theme.colour.inkMuted : theme.colour.ink,
                },
              ]}
            >
              {value === null ? 'No day yet' : formatDayNumeric(value)}
            </Text>
          )}
          <Calendar
            size={18}
            color={waiting ? theme.colour.inkMuted : theme.colour.ink}
            strokeWidth={2}
          />
        </Pressable>

        {/*
          Only where there is something to clear. A `Clear` standing beside an
          empty field is a control that cannot do anything, which the chrome
          forbids for the same reason everywhere else.
        */}
        {value !== null && clearable && !waiting ? (
          <Pressable
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            hitSlop={8}
            style={styles.dayClear}
          >
            <Text style={[styles.dayClearText, { color: theme.colour.inkMuted }]}>
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: theme.colour.danger }]}
        >
          {error}
        </Text>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={picking}
          transparent
          animationType="fade"
          onRequestClose={() => setPicking(false)}
        >
          {/* Pressing beside the calendar closes it without choosing, as
              pressing outside iOS's own popup did. */}
          <Pressable
            style={styles.dayBackdrop}
            onPress={() => setPicking(false)}
            accessibilityLabel="Close"
          >
            {/* Swallows presses, so a tap on the calendar's own chrome does not
                dismiss through the backdrop underneath it. */}
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={[
                styles.dayPopup,
                { backgroundColor: theme.colour.surface, borderColor: theme.colour.line },
              ]}
            >
              <DateTimePicker
                value={dateOfDay(standingOn)}
                mode="date"
                display="inline"
                themeVariant={mode}
                accentColor={theme.colour.accent}
                onValueChange={chosenOnIos}
                accessibilityLabel={label}
              />
            </Pressable>
          </Pressable>
        </Modal>
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
    ...fieldRole(TYPE.body),
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.sm + 2,
    // Vertical padding rather than a height, so a larger system text size grows
    // the field instead of clipping what is in it.
    paddingVertical: 10,
  },
  inputMultiline: { minHeight: 74, textAlignVertical: 'top' },
  /* The day and its `Clear`, on one line. */
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  /*
   * The same metrics as `input`, so a day and a name read as one form, with the
   * calendar pushed to the far end as the laptop's date input draws it.
   */
  dayValue: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 10,
  },
  dayText: { ...role(TYPE.body), flexShrink: 1 },
  /* The whole screen, so the calendar stands in the middle of it rather than
     beside the field that opened it. */
  dayBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.md,
  },
  dayPopup: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACE.sm,
  },
  dayClear: { paddingVertical: 10, paddingHorizontal: SPACE.xs },
  dayClearText: { ...role(TYPE.control) },
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
