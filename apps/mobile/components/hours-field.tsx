import {
  describeDays,
  type HoursDraft,
  normaliseTime,
  rangeHint,
  setAllDay,
  setEveryDay,
  toggleDay,
  WEEK,
  WEEKDAY_WORDING,
} from '@pinpoint/core'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native'

import { FieldLabel } from '@/components/ui'
import { useLanguage, useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { fieldRole, role } from '@/lib/type'

/**
 * The days a place is open and at what times (#176, #190), on a phone.
 *
 * The phone's copy of the laptop's `HoursField`: a row of day letters, then —
 * once a day is on — one opening and one closing time for every open day, or
 * the `24 hours` switch in their place (#221). The
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
  const language = useLanguage()
  const say = useSay()
  const [open, close] = draft.range
  const hint = draft.allDay ? null : rangeHint(draft.range)
  const everyDay = draft.days.length === WEEK.length
  const days = describeDays(language, draft.days)
  const week = WEEKDAY_WORDING[language]

  return (
    <View style={[styles.field, { borderColor: theme.colour.line }]}>
      <FieldLabel>{say(message('placeField.hours'))}</FieldLabel>

      <View style={styles.days}>
        {WEEK.map((day) => {
          const on = draft.days.includes(day)
          return (
            <Pressable
              key={day}
              onPress={() => onChange(toggleDay(draft, day))}
              accessibilityRole="button"
              accessibilityLabel={week[day].name}
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
                {week[day].letter}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/*
        The words and `Every day` share a line, because the day row has no room
        for an eighth control (see `days` below). The words take what is left and
        wrap; the longest, the Spanish "nothing chosen" sentence, runs to two.
      */}
      <View style={styles.line}>
        <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
          {say(days ?? message('hoursField.empty'))}
        </Text>
        <Pressable
          onPress={() => onChange(setEveryDay(draft))}
          accessibilityRole="button"
          accessibilityState={{ selected: everyDay }}
          hitSlop={6}
          style={[
            styles.pill,
            {
              borderColor: everyDay ? theme.colour.accent : theme.colour.lineStrong,
              backgroundColor: everyDay ? theme.colour.accentWash : 'transparent',
            },
          ]}
        >
          <Text
            style={[
              styles.dayText,
              {
                color: everyDay ? theme.colour.accentInk : theme.colour.ink,
                fontWeight: everyDay ? '700' : '500',
              },
            ]}
          >
            {say(message('hoursField.everyDay'))}
          </Text>
        </Pressable>
      </View>

      {draft.days.length > 0 ? (
        <View style={styles.rangeBlock}>
          <View style={styles.range}>
            {draft.allDay ? (
              <Text style={[styles.allDay, { color: theme.colour.ink }]}>
                {say(message('hours.openAllDay'))}
              </Text>
            ) : (
              <View style={styles.times}>
                <TimeInput
                  value={open}
                  label={say(message('hoursField.opens'))}
                  onChange={(value) => onChange({ ...draft, range: [value, close] })}
                />
                <Text style={[styles.to, { color: theme.colour.inkMuted }]}>
                  {say(message('hoursField.to'))}
                </Text>
                <TimeInput
                  value={close}
                  label={say(message('hoursField.closes'))}
                  onChange={(value) => onChange({ ...draft, range: [open, value] })}
                />
              </View>
            )}
            {/*
              The platform's own switch: it already has the size a thumb needs and
              the role a screen reader announces. The label is the visible words
              beside it, so the two are one control to a reader too.
            */}
            <View style={styles.allDaySwitch}>
              <Text
                style={[styles.to, { color: theme.colour.ink }]}
                onPress={() => onChange(setAllDay(draft, !draft.allDay))}
              >
                {say(message('hoursField.allDay'))}
              </Text>
              <Switch
                value={draft.allDay}
                onValueChange={(on) => onChange(setAllDay(draft, on))}
                accessibilityLabel={say(message('hoursField.allDay'))}
                trackColor={{ true: theme.colour.accent, false: theme.colour.lineStrong }}
                ios_backgroundColor={theme.colour.lineStrong}
              />
            </View>
          </View>
          {hint ? (
            <Text style={[styles.nextDay, { color: theme.colour.accentInk }]}>{say(hint)}</Text>
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
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hint: { ...role(TYPE.note), flex: 1 },
  pill: {
    height: 32,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeBlock: { gap: SPACE.xs },
  /*
    The times and the switch share a row that wraps (#221). Measured on an
    iPhone 17, the two 84-point times, `to` and iOS's 51-point switch with its
    label come to about 318 points — the row has 319 on a 375-point phone. So the
    times are one piece and the switch is what drops to the next line when they
    do not fit, rather than overflowing the section or squeezing a time field.
    `marginLeft: 'auto'` keeps the switch at the right on either line.
  */
  range: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACE.sm,
    minHeight: 44,
  },
  times: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  allDay: { ...role(TYPE.body), fontWeight: '600' },
  allDaySwitch: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
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
