import { movePlace } from '@pinpoint/core'
import { RADIUS, SPACE } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
// Deep import, not the package root — see marker-icon.tsx.
import GripVertical from 'lucide-react-native/icons/grip-vertical'
import { type ReactNode, useLayoutEffect, useMemo, useRef } from 'react'
import {
  AccessibilityInfo,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  type GestureType,
  ScrollView,
} from 'react-native-gesture-handler'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'

/**
 * A day's places, in an order that can be changed by dragging.
 *
 * Built here rather than taken from a sortable-list library: a day holds a
 * handful of places, and the two things that matter — that only the handle
 * drags, and that the list still scrolls everywhere else — are a few lines of
 * gesture wiring that a library would make harder to see.
 *
 * **Only the handle drags.** The rest of the row is the place's own button, and
 * a vertical swipe over it scrolls the list. The scroll waits for the handle's
 * drag to fail before it starts (`blocksExternalGesture`), which it does at once
 * for a touch anywhere else.
 *
 * **Dragging has a second route.** Every row offers `Move up` and `Move down` as
 * accessibility actions, offered only where the move is possible, and says the
 * new position aloud — a screen reader cannot drag.
 */

/** The space between rows, which a moving row has to travel past as well. */
const GAP = SPACE.xs

export function SortableDay<T extends { id: string; name: string }>({
  items,
  enabled,
  onReorder,
  renderRow,
  contentStyle,
  children,
}: {
  items: readonly T[]
  /** False with no signal: the handles and the actions are shown disabled. */
  enabled: boolean
  /** The day's ids in their new order. */
  onReorder: (markerIds: readonly string[]) => void
  /** One place's row. `handle` goes at its start; `actions` onto its button. */
  renderRow: (item: T, slot: RowSlot) => ReactNode
  contentStyle?: object
  /** Drawn above the rows, inside the scroll — the offline line. */
  children?: ReactNode
}) {
  const scroll = useMemo(() => Gesture.Native(), [])

  /** Which row is held, or -1; how far it has moved; where it would land. */
  const active = useSharedValue(-1)
  const dy = useSharedValue(0)
  const target = useSharedValue(-1)
  const heights = useSharedValue<number[]>([])

  /*
    A drop reorders the list in the next render, and the held row has to stay
    where it was let go until then — otherwise it snaps back for a frame before
    jumping to its new place. So the drag is reset when the order arrives, before
    paint.
  */
  const order = items.map((item) => item.id).join('|')
  const shownOrder = useRef(order)

  /*
    Each row's height, by place rather than by position: a row with a run's
    count under its name is taller, and after a reorder the positions have
    moved while the heights have not.
  */
  const sizes = useRef(new Map<string, number>())
  const ids = useMemo(() => order.split('|'), [order])
  function measured(id: string, height: number) {
    sizes.current.set(id, height)
    heights.set(ids.map((each) => sizes.current.get(each) ?? 0))
  }

  useLayoutEffect(() => {
    heights.set(ids.map((each) => sizes.current.get(each) ?? 0))
    if (shownOrder.current === order) return
    shownOrder.current = order
    active.set(-1)
    dy.set(0)
    target.set(-1)
  }, [order, ids, active, dy, target, heights])

  function drop(from: number, to: number) {
    if (from === to) {
      active.set(-1)
      dy.set(0)
      target.set(-1)
      return
    }
    onReorder(movePlace(items, from, to))
  }

  return (
    <GestureDetector gesture={scroll}>
      <ScrollView contentContainerStyle={contentStyle}>
        {children}
        {items.map((item, index) => (
          <SortableRow
            key={item.id}
            item={item}
            index={index}
            count={items.length}
            enabled={enabled}
            scroll={scroll}
            active={active}
            dy={dy}
            target={target}
            heights={heights}
            onMeasure={measured}
            onDrop={drop}
            onStep={(to) => {
              onReorder(movePlace(items, index, to))
            }}
            renderRow={renderRow}
          />
        ))}
      </ScrollView>
    </GestureDetector>
  )
}

/** What a row is handed to wire itself into the list. */
export interface RowSlot {
  /** The drag handle, to draw at the row's start. */
  handle: ReactNode
  /** Spread onto the row's pressable: `Move up` and `Move down` for a screen reader. */
  actions: {
    accessibilityActions: { name: string; label: string }[]
    onAccessibilityAction: (event: AccessibilityActionEvent) => void
  }
}

function SortableRow<T extends { id: string; name: string }>({
  item,
  index,
  count,
  enabled,
  scroll,
  active,
  dy,
  target,
  heights,
  onMeasure,
  onDrop,
  onStep,
  renderRow,
}: {
  item: T
  index: number
  count: number
  enabled: boolean
  scroll: GestureType
  active: SharedValue<number>
  dy: SharedValue<number>
  target: SharedValue<number>
  heights: SharedValue<number[]>
  onMeasure: (id: string, height: number) => void
  onDrop: (from: number, to: number) => void
  onStep: (to: number) => void
  renderRow: (item: T, slot: RowSlot) => ReactNode
}) {
  const theme = useTheme()
  const say = useSay()

  /*
    Where the held row would land, from how far it has travelled: past half of
    a neighbour's height and it has swapped with that neighbour.
  */
  function landing(from: number, moved: number): number {
    const sizes = heights.get()
    let at = from
    let left = moved
    if (moved > 0) {
      while (at + 1 < count && left > ((sizes[at + 1] ?? 0) + GAP) / 2) {
        left -= (sizes[at + 1] ?? 0) + GAP
        at += 1
      }
    } else {
      while (at - 1 >= 0 && -left > ((sizes[at - 1] ?? 0) + GAP) / 2) {
        left += (sizes[at - 1] ?? 0) + GAP
        at -= 1
      }
    }
    return at
  }

  const pan = Gesture.Pan()
    .enabled(enabled)
    // On the JavaScript thread: the list is a handful of rows, and it keeps the
    // arithmetic above in one plain function.
    .runOnJS(true)
    .minDistance(2)
    .blocksExternalGesture(scroll)
    .onStart(() => {
      active.set(index)
      target.set(index)
      dy.set(0)
    })
    .onUpdate((event) => {
      dy.set(event.translationY)
      target.set(landing(index, event.translationY))
    })
    .onEnd(() => onDrop(index, target.get()))
    .onFinalize((_, success) => {
      if (!success) {
        active.set(-1)
        dy.set(0)
        target.set(-1)
      }
    })

  const style = useAnimatedStyle(() => {
    const held = active.get()
    if (held === -1) return { transform: [{ translateY: 0 }], zIndex: 0 }
    if (held === index) {
      return { transform: [{ translateY: dy.get() }], zIndex: 2 }
    }
    const shift = (heights.get()[held] ?? 0) + GAP
    const to = target.get()
    const by = held < index && index <= to ? -shift : to <= index && index < held ? shift : 0
    return { transform: [{ translateY: withTiming(by, { duration: 150 }) }], zIndex: 0 }
  })

  function onLayout(event: LayoutChangeEvent) {
    onMeasure(item.id, event.nativeEvent.layout.height)
  }

  function step(to: number) {
    onStep(to)
    AccessibilityInfo.announceForAccessibility(
      say(message('calendar.movedTo', { name: item.name, position: to + 1, count })),
    )
  }

  const handle = (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.handle, !enabled && styles.handleDisabled]}
        // The handle is for a finger. A screen reader moves the place with the
        // row's own actions instead, so this is not a second stop for it.
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <GripVertical size={18} color={theme.colour.inkMuted} />
      </View>
    </GestureDetector>
  )

  /*
    No actions at all with no signal, rather than actions that do nothing: the
    platform has no way to mark one of these disabled, and the line above the
    list says why moving is unavailable.
  */
  const actions: RowSlot['actions'] = {
    accessibilityActions: enabled
      ? [
          ...(index > 0 ? [{ name: 'moveUp', label: say(message('calendar.moveUp')) }] : []),
          ...(index < count - 1
            ? [{ name: 'moveDown', label: say(message('calendar.moveDown')) }]
            : []),
        ]
      : [],
    onAccessibilityAction: (event) => {
      if (!enabled) return
      if (event.nativeEvent.actionName === 'moveUp' && index > 0) step(index - 1)
      if (event.nativeEvent.actionName === 'moveDown' && index < count - 1) step(index + 1)
    },
  }

  return (
    <Animated.View
      onLayout={onLayout}
      style={[styles.row, { backgroundColor: theme.colour.surface }, style]}
    >
      {renderRow(item, { handle, actions })}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  row: { borderRadius: RADIUS.md },
  handle: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    width: 28,
  },
  handleDisabled: { opacity: 0.4 },
})
