import {
  daysNotApart,
  describeDays,
  type HoursDraft,
  type HoursRange,
  normaliseTime,
  rangeHint,
  rejoinDay,
  setDayApart,
  toggleDay,
  WEEK,
  WEEKDAY_WORDING,
} from '@pinpoint/core'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import Plus from 'lucide-react-native/icons/plus'
import X from 'lucide-react-native/icons/x'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { FieldLabel } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { fieldRole, role } from '@/lib/type'

/**
 * The days a place is open and at what times (#176), on a phone.
 *
 * The phone's copy of the laptop's `HoursField`: a row of day letters, then —
 * once a day is on — the usual hours for every open day, and any day set apart
 * with hours of its own. The conversion between that and the stored week is
 * `splitHours` / `joinHours` in `@pinpoint/core`, shared with the laptop so the
 * two cannot open the same place differently.
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
  const [choosingDay, setChoosingDay] = useState(false)
  const candidates = daysNotApart(draft)

  return (
    <View style={styles.field}>
      <FieldLabel>Hours (optional)</FieldLabel>

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
        <>
          <Text style={[styles.subhead, { color: theme.colour.ink }]}>Usual hours</Text>
          <Ranges
            label="Usual hours"
            ranges={draft.usual}
            onChange={(usual) => onChange({ ...draft, usual })}
          />

          {draft.apart.length > 0 ? (
            <Text style={[styles.subhead, { color: theme.colour.ink }]}>
              Different on some days
            </Text>
          ) : null}

          {draft.apart.map((entry) => {
            const name = WEEKDAY_WORDING[entry.day].name
            return (
              <View
                key={entry.day}
                style={[styles.apart, { borderColor: theme.colour.line }]}
              >
                <View style={styles.apartHead}>
                  <Text style={[styles.apartDay, { color: theme.colour.ink }]}>
                    {WEEKDAY_WORDING[entry.day].short}
                  </Text>
                  <Remove
                    label={`Give ${name} the usual hours`}
                    onPress={() => onChange(rejoinDay(draft, entry.day))}
                  />
                </View>
                <Ranges
                  label={name}
                  ranges={entry.ranges}
                  onChange={(ranges) =>
                    onChange({
                      ...draft,
                      apart: draft.apart.map((each) =>
                        each.day === entry.day ? { ...each, ranges } : each,
                      ),
                    })
                  }
                />
              </View>
            )
          })}

          {choosingDay && candidates.length > 0 ? (
            <View style={styles.choose}>
              <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
                Which day is different?
              </Text>
              <View style={styles.chooseDays}>
                {candidates.map((day) => (
                  <Chip
                    key={day}
                    label={WEEKDAY_WORDING[day].short}
                    accessibilityLabel={WEEKDAY_WORDING[day].name}
                    onPress={() => {
                      onChange(setDayApart(draft, day))
                      setChoosingDay(false)
                    }}
                  />
                ))}
                <LinkButton label="Cancel" onPress={() => setChoosingDay(false)} />
              </View>
            </View>
          ) : candidates.length > 0 ? (
            draft.apart.length > 0 ? (
              <Chip label="+ Another day" onPress={() => setChoosingDay(true)} />
            ) : (
              <LinkButton
                label="Different on some days"
                plus
                onPress={() => setChoosingDay(true)}
              />
            )
          ) : null}
        </>
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

/** One or two ranges, each a pair of typed times. */
function Ranges({
  label,
  ranges,
  onChange,
}: {
  label: string
  ranges: HoursRange[]
  onChange: (ranges: HoursRange[]) => void
}) {
  const theme = useTheme()
  const set = (index: number, range: HoursRange) =>
    onChange(ranges.map((each, i) => (i === index ? range : each)))

  return (
    <View style={styles.ranges}>
      {ranges.map((range, index) => {
        const hint = rangeHint(range)
        const which = index === 0 ? label : `${label}, second set`
        return (
          <View key={index} style={styles.rangeBlock}>
            <View style={styles.range}>
              <TimeInput
                value={range[0]}
                label={`${which}, opens`}
                onChange={(value) => set(index, [value, range[1]])}
              />
              <Text style={[styles.to, { color: theme.colour.inkMuted }]}>to</Text>
              <TimeInput
                value={range[1]}
                label={`${which}, closes`}
                onChange={(value) => set(index, [range[0], value])}
              />
              {index > 0 ? (
                <Remove
                  label={`Remove ${which.toLowerCase()}`}
                  onPress={() => onChange(ranges.filter((_, i) => i !== index))}
                />
              ) : null}
            </View>
            {hint ? (
              <Text style={[styles.nextDay, { color: theme.colour.accentInk }]}>
                {hint}
              </Text>
            ) : null}
          </View>
        )
      })}

      {ranges.length < 2 ? (
        <LinkButton
          label="Add a second range"
          plus
          onPress={() => onChange([...ranges, ['', '']])}
        />
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

function Remove({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={styles.remove}
    >
      <X size={16} color={theme.colour.inkMuted} strokeWidth={2.2} />
    </Pressable>
  )
}

function LinkButton({
  label,
  onPress,
  plus = false,
}: {
  label: string
  onPress: () => void
  plus?: boolean
}) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={8}
      style={styles.link}
    >
      {plus ? <Plus size={14} color={theme.colour.accentInk} strokeWidth={2.2} /> : null}
      <Text style={[styles.linkText, { color: theme.colour.accentInk }]}>{label}</Text>
    </Pressable>
  )
}

function Chip({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string
  onPress: () => void
  accessibilityLabel?: string
}) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.chip, { borderColor: theme.colour.lineStrong }]}
    >
      <Text style={[styles.chipText, { color: theme.colour.ink }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  field: { gap: SPACE.sm },
  /*
    Seven 44-point targets, the smallest a thumb reliably hits: 308 points, inside
    the 343 a 375-point-wide phone leaves between its gutters. `space-between`
    rather than a gap, so a wider phone spreads them instead of leaving the row
    short on the right.
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
  subhead: { ...role(TYPE.note), fontWeight: '700', marginTop: 2 },
  ranges: { gap: SPACE.sm },
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
  remove: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apart: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: SPACE.sm,
  },
  apartHead: { flexDirection: 'row', alignItems: 'center' },
  apartDay: { ...role(TYPE.body), fontWeight: '700' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    alignSelf: 'flex-start',
    paddingVertical: SPACE.xs,
  },
  linkText: { ...role(TYPE.control), fontWeight: '600' },
  choose: { gap: 6 },
  chooseDays: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chip: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
  },
  chipText: { ...role(TYPE.control) },
  error: { ...role(TYPE.note) },
})
