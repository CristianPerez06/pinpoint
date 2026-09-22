import {
  dateOfDay,
  formatDayShort,
  formatDayStretch,
  type InterestFilter,
  isFiltered,
  type IsoDay,
  type MarkerFilter,
  NO_FILTER,
  type TripMember,
} from '@pinpoint/core'
import { MARKER_TYPES } from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message, type Language, type Message } from '@pinpoint/wording'
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import { type ReactNode, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { markerTypeMessage } from '@/components/marker-icon'
import { useLanguage, useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Narrowing a trip, from a phone.
 *
 * The same questions the laptop asks, because the answers come from the same
 * predicate in `@pinpoint/core`: tick the people, get the places they all want.
 * What differs is where it lives — a sheet raised from a header control rather
 * than a bar across the top — and that difference is the whole reason the header
 * has to say when a filter is on. A choice made in a sheet is invisible the
 * moment the sheet is dismissed, and a trip looking emptier than it is with
 * nothing on screen explaining why is the defect this control could most easily
 * ship with.
 *
 * Clearing lives here now, and the reasoning above is why that is safe rather
 * than why it was avoided. This comment used to end "which is why clearing is
 * not offered here" — a way out behind a control you have to already suspect is
 * on is not a way out. That was correct while nothing else said the trip was
 * narrowed.
 *
 * The toolbar's filter button now says it, permanently and by two signals, so
 * the half that had to stay visible is visible. What is left is the undo, and
 * an undo one deliberate tap inside the thing that declares the state is
 * reachable rather than hidden. The spec was amended to permit exactly this
 * separation and no wider a one: the control that declares must be the control
 * that reveals.
 *
 * A modal rather than a positioned view, unlike the marker sheet. That sheet
 * must not cover the map — it describes a pin the person is looking at — while
 * this one is a decision made and dismissed, and dimming behind it is what says
 * the map is waiting.
 */

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACE.xs,
  },
  title: { ...role(TYPE.title), flex: 1 },
  done: { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.sm },
  doneText: { ...role(TYPE.control), fontWeight: '700' },
  label: { ...role(TYPE.label), paddingTop: SPACE.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: 11,
  },
  optionText: { ...role(TYPE.body), flex: 1 },
  box: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { fontSize: 13, fontWeight: '800' },
  divide: { height: 1, marginVertical: SPACE.xs },
  swatch: { width: 12, height: 12, borderRadius: 4 },
  questionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: 13,
  },
  questionName: { ...role(TYPE.control), fontWeight: '600' },
  // `flex: 1` with `minWidth: 0` is what lets this truncate instead of pushing
  // the chevron off the row — a flex item's floor is its own content otherwise.
  questionSaid: { ...role(TYPE.note), flex: 1, minWidth: 0, textAlign: 'right' },
  questionSaidSet: {
    ...role(TYPE.note),
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    // Said twice over — the accent and a heavier weight — because a signal
    // carried only in hue does not survive greyscale or a colour-blind reader.
    fontWeight: '700',
  },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  empty: { ...role(TYPE.note), paddingVertical: SPACE.sm },
  // The foot sits outside the scroller, so it keeps its place while the
  // questions move. `borderTopColor` is themed at the call site.
  foot: { borderTopWidth: 1, paddingTop: SPACE.sm },
  clear: {
    marginTop: SPACE.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  clearText: { ...role(TYPE.control), fontWeight: '700' },
  clearTextInert: { ...role(TYPE.control), fontWeight: '400' },
})

/** Fraction of the screen the sheet may grow to before it scrolls instead. */
const SHEET_CAP = 0.8

/** Which question is open. One at a time, and none when the sheet is shown. */
type OpenQuestion = 'interest' | 'kind' | 'day'

export function FilterSheet({
  open,
  filter,
  onChange,
  onClose,
  members,
  ownMemberId,
  days,
}: {
  open: boolean
  filter: MarkerFilter
  onChange: (filter: MarkerFilter) => void
  onClose: () => void
  members: readonly TripMember[]
  /** So the reader is named the way the marker sheet names them. */
  ownMemberId: string | null
  /**
   * The days this trip offers to be narrowed by, in order.
   *
   * From `daysOffered` in `@pinpoint/core`, which is also what the laptop's
   * menu is handed — so the two offer the same days for the same trip.
   */
  days: readonly IsoDay[]
}) {
  const theme = useTheme()
  const say = useSay()
  const language = useLanguage()
  const insets = useSafeAreaInsets()
  const cap = Math.round(useWindowDimensions().height * SHEET_CAP)

  const [question, setQuestion] = useState<OpenQuestion | null>(null)

  const chosen = filter.interest.kind === 'wanted-by' ? filter.interest.members : []
  const kinds = filter.kind.kind === 'one-of' ? filter.kind.kinds : []
  const chosenDays = filter.day.kind === 'on' ? filter.day.days : []

  const setInterest = (interest: InterestFilter) => onChange({ ...filter, interest })

  // What the way out below is live for, and what the toolbar's filter button
  // is drawing its dot for. One predicate, read in both places.
  const narrowed = isFiltered(filter)

  const nameOf = (member: TripMember) =>
    member.id === ownMemberId ? say(message('interest.you')) : member.displayName

  /* Reopening shows the overview rather than whatever was last expanded: the
     rows are the point of the sheet, and one standing open is a state nobody
     asked to return to. */
  function close() {
    setQuestion(null)
    onClose()
  }

  function toggleMember(memberId: string) {
    const next = chosen.includes(memberId)
      ? chosen.filter((id) => id !== memberId)
      : [...chosen, memberId]

    // Unticking the last person is a request to stop filtering, not a question
    // about nobody — which would correctly select nothing and read as broken.
    setInterest(
      next.length === 0 ? { kind: 'anyone' } : { kind: 'wanted-by', members: next },
    )
  }

  function toggleKind(id: string) {
    const next = kinds.includes(id)
      ? kinds.filter((kind) => kind !== id)
      : [...kinds, id]

    // Same shape as unticking the last person, opposite meaning: no kinds
    // chosen selects everything rather than nothing, because a place has
    // exactly one kind.
    onChange({
      ...filter,
      kind: next.length === 0 ? { kind: 'any' } : { kind: 'one-of', kinds: next },
    })
  }

  function toggleDay(day: IsoDay) {
    const next = chosenDays.includes(day)
      ? chosenDays.filter((each) => each !== day)
      : [...chosenDays, day]

    onChange({
      ...filter,
      day: next.length === 0 ? { kind: 'any' } : { kind: 'on', days: next },
    })
  }

  /*
   * What each collapsed row says it is set to, in words rather than as a count.
   *
   * A member named here who has since left the trip resolves to nothing and
   * drops out, rather than showing an id.
   */
  const interestSaid =
    filter.interest.kind === 'unanswered'
      ? say(message('filter.nobodyAnsweredSaid'))
      : filter.interest.kind === 'wanted-by'
        ? say(
            wordList(
              chosen
                .map((id) => members.find((member) => member.id === id))
                .filter((member) => member !== undefined)
                .map(nameOf),
            ),
          )
        : say(message('filter.anyone'))

  const kindSaid =
    kinds.length === 0
      ? say(message('filter.anyKind'))
      : say(
          wordList(
            MARKER_TYPES.filter((type) => kinds.includes(type.id)).map((type) =>
              say(markerTypeMessage(type.id)),
            ),
          ),
        )

  const daySaid =
    filter.day.kind === 'undated'
      ? say(message('filter.noDay'))
      : chosenDays.length === 0
        ? say(message('filter.anyDay'))
        : say(wordList([...chosenDays].sort().map((day) => formatDayShort(language, day))))

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={close}
      // Android's back gesture reaches `onRequestClose`; on iOS the backdrop and
      // the Done button are the ways out.
    >
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={say(message('common.close'))}>
        {/* The sheet swallows presses so that touching a row does not dismiss
            through the backdrop underneath it. */}
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
              // Definite, so the scroller inside has a height to divide with
              // the foot. A container sizing to its children reports almost
              // nothing to a scroller and clips everything past the first row
              // — see `AGENTS.md`.
              maxHeight: cap,
              paddingBottom: SPACE.md + insets.bottom,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colour.ink }]}>{say(message('filter.name'))}</Text>
            <Pressable onPress={close} accessibilityRole="button" style={styles.done}>
              <Text style={[styles.doneText, { color: theme.colour.accentInk }]}>
                {say(message('common.done'))}
              </Text>
            </Pressable>
          </View>

          {/*
            The questions scroll; the way out does not.

            The sheet above has a definite `maxHeight`, so this and the foot
            divide that height between them. Without it this scroller would be
            asked how tall it is by a parent sizing to its children, answer
            almost nothing, and clip everything past the first row — see
            `AGENTS.md`, which is the same trap the city sheet already names.
          */}
          <ScrollView keyboardShouldPersistTaps="handled">
            {/*
              One question per row, opened one at a time.

              The laptop's panel had to collapse because five questions drawn at
              once outgrow it on a large trip; this sheet is taller, but the same
              content is the same content and a person scrolling past twenty-one
              days to reach `Hide visited` is the same defect with more room to
              hide in.
            */}
            <Question
              name={say(message('filter.wantedBy'))}
              said={interestSaid}
              set={filter.interest.kind !== 'anyone'}
              open={question === 'interest'}
              onToggle={() =>
                setQuestion(question === 'interest' ? null : 'interest')
              }
            >
              {/* The question this list asks, because the two below ask the
                  opposite one and tick boxes do not say which is which. */}
              <Heading>{say(message('filter.wantedByHeading'))}</Heading>

              {members.map((member) => (
                <Option
                  key={member.id}
                  label={nameOf(member)}
                  checked={chosen.includes(member.id)}
                  onPress={() => toggleMember(member.id)}
                />
              ))}

              <View style={[styles.divide, { backgroundColor: theme.colour.line }]} />

              {/* Not a person, so not one of the people. Picking it clears the
                  ticks rather than adding to them — "wanted by Ana, and also
                  nobody has answered" has no meaning. */}
              <Option
                label={say(message('filter.nobodyAnswered'))}
                checked={filter.interest.kind === 'unanswered'}
                onPress={() =>
                  setInterest(
                    filter.interest.kind === 'unanswered'
                      ? { kind: 'anyone' }
                      : { kind: 'unanswered' },
                  )
                }
              />
            </Question>

            <Question
              name={say(message('filter.kind'))}
              said={kindSaid}
              set={kinds.length > 0}
              open={question === 'kind'}
              onToggle={() => setQuestion(question === 'kind' ? null : 'kind')}
            >
              {/*
                `any`, and it has to be said rather than shown.

                This list and the one above it are both tick boxes in one sheet
                and they compose oppositely: naming two people asks for the
                places they agree on, naming two kinds asks for either. A place
                has exactly one kind, so the other reading would always select
                nothing — but nobody discovers that by ticking, they discover an
                empty map.
              */}
              <Heading>{say(message('filter.kindHeading'))}</Heading>

              {MARKER_TYPES.map((type) => (
                <Option
                  key={type.id}
                  label={say(markerTypeMessage(type.id))}
                  swatch={theme.markerType[type.id]}
                  checked={kinds.includes(type.id)}
                  onPress={() => toggleKind(type.id)}
                />
              ))}
            </Question>

            <Question
              name={say(message('filter.day'))}
              said={daySaid}
              set={filter.day.kind !== 'any'}
              open={question === 'day'}
              onToggle={() => setQuestion(question === 'day' ? null : 'day')}
            >
              <Heading>{say(message('filter.dayHeading'))}</Heading>

              {days.length === 0 ? (
                /* Said rather than left blank: an empty region reads as a list
                   that failed to load. */
                <Text style={[styles.empty, { color: theme.colour.inkMuted }]}>
                  {say(message('filter.noDays'))}
                </Text>
              ) : (
                inWeeks(days).map((run) => (
                  <View key={run[0]}>
                    <Heading>{runLabel(language, run)}</Heading>
                    {run.map((day) => (
                      <Option
                        key={day}
                        label={formatDayShort(language, day)}
                        checked={chosenDays.includes(day)}
                        onPress={() => toggleDay(day)}
                      />
                    ))}
                  </View>
                ))
              )}

              <View style={[styles.divide, { backgroundColor: theme.colour.line }]} />

              {/* Not a day, so not one of the days — the same shape as the
                  triage pile above and the same reason. "Thursday, and also the
                  ones with no day" is two questions wearing one answer. */}
              <Option
                label={say(message('filter.noDay'))}
                checked={filter.day.kind === 'undated'}
                onPress={() =>
                  onChange({
                    ...filter,
                    day:
                      filter.day.kind === 'undated'
                        ? { kind: 'any' }
                        : { kind: 'undated' },
                  })
                }
              />
            </Question>

            <View style={[styles.divide, { backgroundColor: theme.colour.line }]} />

            {/*
              The only way this product narrows by city, and deliberately the
              only one. A city is a name somebody chose for a cluster of places
              rather than a geographical fact, so hiding everything filed under
              a different name can hide a place that is genuinely around the
              corner. Being filed under *no* city is a state of the record
              instead. `city.ts` carries the measurement this rests on.
            */}
            <Option
              label={say(message('filter.unfiled'))}
              checked={filter.city === 'unfiled'}
              onPress={() =>
                onChange({
                  ...filter,
                  city: filter.city === 'unfiled' ? 'any' : 'unfiled',
                })
              }
            />

            <Option
              label={say(message('filter.hideVisited'))}
              checked={filter.visited === 'unvisited'}
              onPress={() =>
                onChange({
                  ...filter,
                  visited: filter.visited === 'unvisited' ? 'any' : 'unvisited',
                })
              }
            />
          </ScrollView>

          {/*
            Outside the scroller, so it keeps its place while the questions
            move. `marker-filtering` requires the way out to be reachable from
            where the narrowing is declared, and a trip spanning three weeks
            would otherwise push it past the bottom of the sheet.

            Permanent and inert rather than absent, which is the requirement and
            not a preference: a control that arrives on selection moves whatever
            is beside it, so applying a filter would rearrange the sheet that
            applied it.

            Inert through `accessibilityState` and a handler that returns, never
            by being unreachable — a disabled control leaves the tab order and
            goes silent, which is the colour-only failure arriving by a back
            door. And the two states differ by fill and by weight as well as by
            colour, for the same reason.
          */}
          <View style={[styles.foot, { borderTopColor: theme.colour.line }]}>
            <Pressable
              onPress={() => {
                if (narrowed) onChange(NO_FILTER)
              }}
              accessibilityRole="button"
              accessibilityLabel={say(message('filter.clear'))}
              accessibilityState={{ disabled: !narrowed }}
              style={[
                styles.clear,
                narrowed
                  ? {
                      borderColor: theme.colour.accent,
                      backgroundColor: theme.colour.accentWash,
                    }
                  : {
                      borderColor: 'transparent',
                      backgroundColor: theme.colour.surfaceMuted,
                    },
              ]}
            >
              <Text
                style={[
                  narrowed ? styles.clearText : styles.clearTextInert,
                  { color: narrowed ? theme.colour.accentInk : theme.colour.inkMuted },
                ]}
              >
                {say(message('filter.clearShort'))}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

/**
 * A list of words as a person would say it.
 *
 * Used only for what a collapsed row says it is set to, which is why naming
 * members is allowed here: the rule against it is about the *trigger*, whose
 * width would then follow its own state. This sits inside the sheet and
 * truncates.
 *
 * The last pair is joined by the catalogue, because `and` is a word.
 */
function wordList(words: readonly string[]): Message {
  if (words.length <= 1) return message('filter.listOne', { word: words[0] ?? '' })
  return message('filter.listAnd', {
    head: words.slice(0, -1).join(', '),
    last: words[words.length - 1]!,
  })
}

/**
 * Whole days between two of them.
 *
 * Through local midnights and rounded, because a day is not always twenty-four
 * hours long — a daylight-saving boundary makes one of them twenty-three, and
 * an unrounded division would put the day after it in the wrong week.
 */
function daysBetween(from: IsoDay, to: IsoDay): number {
  const ms = dateOfDay(to).getTime() - dateOfDay(from).getTime()
  return Math.round(ms / 86_400_000)
}

/**
 * The offered days, in seven-day runs from the first one.
 *
 * Runs rather than calendar weeks starting on a Monday, so a trip beginning on
 * a Saturday does not open with a two-day stub. The laptop groups them the same
 * way, from the same rule.
 *
 * Each run is **labelled by the days it covers, not by an ordinal**, and that
 * came from looking. `Week 1`, `Week 2`, `Week 3` read correctly on a trip of
 * consecutive days and lied on the live one, whose places sit on five days
 * scattered across two months: the group labelled `Week 2` began twenty-six
 * days after `Week 1`.
 */
function inWeeks(days: readonly IsoDay[]): readonly (readonly IsoDay[])[] {
  if (days.length === 0) return []
  const weeks: IsoDay[][] = []
  for (const day of days) {
    const index = Math.floor(daysBetween(days[0], day) / 7)
    ;(weeks[index] ??= []).push(day)
  }
  // Holes where a trip's places jump a month, which `daysOffered` permits.
  return weeks.filter((week) => week !== undefined)
}

/**
 * What a run of days is called: the stretch it covers, or the one day it holds.
 *
 * The wording is `@pinpoint/core`'s, not this file's. It used to be four lines
 * here and four identical lines in the other application, which is two answers
 * to one question waiting to drift apart — and a third was about to be written
 * for a trip's dates in the trip menu.
 */
function runLabel(language: Language, run: readonly IsoDay[]): string {
  return formatDayStretch(language, run[0]!, run[run.length - 1]!)
}

/** The small uppercase line that says what a list of ticks is asking. */
function Heading({ children }: { children: ReactNode }) {
  const theme = useTheme()
  return (
    <Text style={[styles.label, { color: theme.colour.inkMuted }]}>{children}</Text>
  )
}

/**
 * One question, as a row that expands.
 *
 * Closed, it is the same height on a trip of ten members and a trip of two —
 * which is what keeps the way out of the narrowing on screen rather than three
 * weeks of days below it.
 *
 * `said` is what this question is currently set to, in words. That is a
 * requirement rather than a nicety: a row reading `2` would be the same
 * unitless number the trigger already rejected, one level in.
 */
function Question({
  name,
  said,
  set,
  open,
  onToggle,
  children,
}: {
  name: string
  said: string
  set: boolean
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const theme = useTheme()
  const say = useSay()

  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        /* The whole state in the name, for somebody who is not looking at it —
           the chevron and the colour are drawn and reach nobody else. */
        accessibilityLabel={say(message('filter.questionSpoken', { name, said }))}
        style={styles.questionHead}
      >
        <Text style={[styles.questionName, { color: theme.colour.ink }]}>{name}</Text>
        <Text
          numberOfLines={1}
          style={[
            set ? styles.questionSaidSet : styles.questionSaid,
            { color: set ? theme.colour.accentInk : theme.colour.inkMuted },
          ]}
        >
          {said}
        </Text>
        {/*
          The rotation goes on a `View`, not on the glyph.

          `react-native-svg` reads `transform` off an `Svg`'s style and applies
          it as an SVG transform, where a rotation is a number of degrees and
          not the `'180deg'` string React Native's own transform takes. Handing
          it the string made the chevron **disappear** rather than fail — the
          open row simply had nothing at its right edge, which reads as a glyph
          that was never drawn and is not. Rotating an ordinary `View` around it
          keeps the transform in React Native's layout, where the string is what
          is expected.
        */}
        <View style={open ? styles.chevronOpen : undefined}>
          <ChevronDown size={16} color={theme.colour.inkMuted} />
        </View>
      </Pressable>
      {open ? <View>{children}</View> : null}
    </View>
  )
}

function Option({
  label,
  checked,
  onPress,
  swatch,
}: {
  label: string
  checked: boolean
  onPress: () => void
  /**
   * The colour this kind is drawn in on the map, where there is one.
   *
   * The same statement the map already makes, repeated in the control that
   * hides it, so ticking `Food` and watching the orange pins go is one idea
   * rather than two.
   */
  swatch?: string
}) {
  const theme = useTheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.option}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.colour.accent : theme.colour.lineStrong,
            backgroundColor: checked ? theme.colour.accent : 'transparent',
          },
        ]}
      >
        {checked ? (
          <Text style={[styles.tick, { color: theme.colour.ground }]}>✓</Text>
        ) : null}
      </View>
      {swatch === undefined ? null : (
        <View style={[styles.swatch, { backgroundColor: swatch }]} />
      )}
      <Text style={[styles.optionText, { color: theme.colour.ink }]}>{label}</Text>
    </Pressable>
  )
}

