'use client'

import {
  dateOfDay,
  dayOfDate,
  formatDayFull,
  formatMonth,
  formatWeekday,
  formatWeekdayShort,
  type IsoDay,
} from '@pinpoint/core'
import { message } from '@pinpoint/wording'
import { DayPicker, type ChevronProps, type ClassNames } from '@daypicker/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { useLanguage, useSay } from '@/app/_components/language'

import styles from './ui.module.css'

/**
 * The month grid inside a `DayField`'s calendar, in a file of its own so that it
 * loads the first time a calendar is opened rather than with every page that
 * has a date field.
 *
 * The library and the parts of `date-fns` it needs are about 25 KB compressed,
 * and they landed on every route with a form: the map, the calendar screen and
 * settings. Most visits never open a calendar. `ui.tsx` loads this with
 * `next/dynamic`, and starts the load as soon as a pointer or focus reaches a
 * day field, so by the time it is pressed it is usually already here.
 *
 * Every word it draws or speaks is ours. The library's own English would
 * otherwise come through for anything not replaced, so every formatter and
 * label it renders is given here, from `@pinpoint/core` and `@pinpoint/wording`.
 */
export default function DayGrid({
  value,
  shown,
  onChoose,
}: {
  value: IsoDay | null
  /** The day whose month the grid opens on. */
  shown: IsoDay
  onChoose: (day: IsoDay) => void
}) {
  const say = useSay()
  const language = useLanguage()
  const full = (date: Date) => formatDayFull(language, dayOfDate(date))

  return (
    <DayPicker
      mode="single"
      required
      selected={value === null ? undefined : dateOfDay(value)}
      onSelect={(date) => onChoose(dayOfDate(date))}
      defaultMonth={dateOfDay(shown)}
      weekStartsOn={1}
      autoFocus
      formatters={{
        formatCaption: (month) => formatMonth(language, dayOfDate(month)),
        formatWeekdayName: (weekday) => formatWeekdayShort(language, dayOfDate(weekday)),
      }}
      labels={{
        labelNav: () => say(message('dayField.months')),
        labelPrevious: () => say(message('dayField.previousMonth')),
        labelNext: () => say(message('dayField.nextMonth')),
        labelGrid: (month) => formatMonth(language, dayOfDate(month)),
        labelWeekday: (weekday) => formatWeekday(language, dayOfDate(weekday)),
        labelGridcell: full,
        labelDayButton: (date, modifiers) =>
          modifiers.selected
            ? say(message('dayField.dayChosen', { day: full(date) }))
            : full(date),
      }}
      components={{ Chevron: CalendarChevron }}
      classNames={DAY_PICKER_CLASSES}
    />
  )
}

/** The month arrows, as Lucide draws every other chevron in the product. */
function CalendarChevron({ orientation }: ChevronProps) {
  return orientation === 'left' ? (
    <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
  ) : (
    <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
  )
}

/**
 * The calendar's parts, styled by this file's own sheet. The library's
 * stylesheet is never imported: everything here reads the `--pp-*` properties,
 * so the ground switches it through the cascade as it does everything else and
 * no second palette ships.
 */
const DAY_PICKER_CLASSES: Partial<ClassNames> = {
  root: styles.dayPicker,
  months: styles.dayMonths,
  month: styles.dayMonth,
  month_caption: styles.dayCaption,
  caption_label: styles.dayCaptionLabel,
  nav: styles.dayNav,
  button_previous: styles.dayNavButton,
  button_next: styles.dayNavButton,
  month_grid: styles.dayGrid,
  weekdays: styles.dayWeekdays,
  weekday: styles.dayWeekday,
  weeks: styles.dayWeeks,
  week: styles.dayWeek,
  day: styles.dayCell,
  day_button: styles.dayButton,
  selected: styles.daySelected,
  today: styles.dayToday,
  outside: styles.dayOutside,
  focused: styles.dayFocused,
  hidden: styles.dayHidden,
}
