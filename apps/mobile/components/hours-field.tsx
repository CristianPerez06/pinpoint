import {
  describeDays,
  type HoursDraft,
  normaliseTime,
  rangeHint,
  toggleDay,
  WEEK,
  WEEKDAY_WORDING,
} from '@pinpoint/core'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { FieldLabel } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { fieldRole, role } from '@/lib/type'

/**
 * The days a place is open and at what times (#176, #190), on a phone.
 *
 * The phone's copy of the laptop's `HoursField`: a row of day letters, then —
 * once a day is on — one opening and one closing time for every open day. The
 * conversion between that and the stored week is `splitHours` / `joinHours` in
 * `@pinpoint/core`, shared with the laptop so the two cannot open the same
 * place differently.
 *
 * Times are typed rather than picked, on a keyboard of digits. A picker would
 * raise a panel over a form that is already a sheet — the thing
 * `trip-calendar` forbids for the day field — and four digits are quicker than
 * two wheels.
 *
 * Nothing here scrolls: the form's own `ScrollView` does, and it has a definite
 * height to do it in.
 */
export function HoursField({
  draft,
  onChange,
  error,
}: {
  draft: HoursDraft
  onChange: (draft: HoursDraft) => void
  error?: string
}) {
  const theme = useTheme()
  const [open, close] = draft.range
  const hint = rangeHint(draft.range)

  return (
    <View style={[styles.field, { borderColor: theme.colour.line }]}>
      <FieldLabel>Hours</FieldLabel>

      <View style={styles.days}>
        {WEEK.map((day) => {
          const on = draft.days.includes(day)
          return (
            <Pressable
              key={day}
              onPress={() => onChange(toggleDay(draft, day))}
              accessibilityRole="button"
              accessibilityLabel={WEEKDAY_WORDING[day].name}
              accessibilityState={{ selected: on }}
              style={[
                styles.day,
                {
                  borderColor: on ? theme.colour.accent : theme.colour.lineStrong,
                  backgroundColor: on ? theme.colour.accentWash : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  {
                    color: on ? theme.colour.accentInk : theme.colour.ink,
                    fontWeight: on ? '700' : '500',
                  },
                ]}
              >
                {WEEKDAY_WORDING[day].letter}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
        {describeDays(draft.days) ??
          "Leave empty if you don't know. Pick the days it opens to add hours."}
      </Text>

      {draft.days.length > 0 ? (
        <View style={styles.rangeBlock}>
          <View style={styles.range}>
            <TimeInput
              value={open}
              label="Opens"
              onChange={(value) => onChange({ ...draft, range: [value, close] })}
            />
            <Text style={[styles.to, { color: theme.colour.inkMuted }]}>to</Text>
            <TimeInput
              value={close}
              label="Closes"
              onChange={(value) => onChange({ ...draft, range: [open, value] })}
            />
          </View>
          {hint ? (
            <Text style={[styles.nextDay, { color: theme.colour.accentInk }]}>{hint}</Text>
          ) : null}
        </View>
      ) : null}

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
 * A time, typed on the number pad. `9`, `930` and `9:30` become `09:00`-shaped
 * on leaving the field; anything that is not a time is left as typed for the
 * save to refuse, rather than rewritten into something the person did not type.
 *
 * `fieldRole`, not `role`: a line height on a `TextInput` pushes its text down
 * on iOS (see `AGENTS.md`).
 */
function TimeInput({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (value: string) => void
}) {
  const theme = useTheme()
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      onBlur={() => {
        const time = normaliseTime(value)
        if (time !== null && time !== value) onChange(time)
      }}
      // `numbers-and-punctuation` rather than the number pad: iOS's number pad
      // has no colon, and `9:30` is how most people write a time.
      keyboardType="numbers-and-punctuation"
      maxLength={5}
      placeholder="00:00"
      placeholderTextColor={theme.colour.inkMuted}
      accessibilityLabel={label}
      style={[
        styles.time,
        {
          color: theme.colour.ink,
          backgroundColor: theme.colour.surfaceMuted,
          borderColor: theme.colour.line,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  /*
    One bounded section, not four fields in a row (#191).

    A border rather than a fill: `surfaceSunk` against `surface` measures 1.05:1
    on the dark ground, which is to say it is the surface. `line` is 1.27:1 and
    carries the boundary on both grounds. See the laptop's `hours-field.module.css`.

    The horizontal padding is load-bearing and must not grow — see `days` below.
  */
  field: {
    gap: SPACE.sm,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  /*
    Seven 44-point targets, the smallest a thumb reliably hits: 308 points.
    A 375-point-wide phone leaves 343 between its gutters, and this group's own
    12-point padding takes 24 of them — so the row has 319 and needs 308. Eleven
    points spare. Widening this group's padding takes the day row with it.
    `space-between` rather than a gap, so a wider phone spreads them instead of
    leaving the row short on the right.
  */
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { ...role(TYPE.control) },
  hint: { ...role(TYPE.note) },
  rangeBlock: { gap: SPACE.xs },
  range: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  time: {
    ...fieldRole(TYPE.body),
    width: 84,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  to: { ...role(TYPE.body) },
  nextDay: { ...role(TYPE.note), fontWeight: '600' },
  error: { ...role(TYPE.note) },
})
