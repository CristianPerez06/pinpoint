import { currencyLabel, searchCurrencies } from '@pinpoint/core'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
// One subpath each, like every other icon on this platform: Metro does not
// tree-shake in development, so the package root would pull all the glyphs in.
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import Search from 'lucide-react-native/icons/search'
import X from 'lucide-react-native/icons/x'
import { useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FieldLabel } from '@/components/ui'
import { useLanguage, useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { fieldRole, role } from '@/lib/type'

/** Fraction of the screen the picker takes. A definite height, so its list has room to scroll. */
const SHEET_HEIGHT = 0.8

/**
 * A city's optional second currency: none, or one chosen by searching a list.
 *
 * The phone's copy of the laptop's `CurrencyField`: the same list and the same
 * search from `@pinpoint/core`, so `yen` finds the yen on both. The field reads
 * `JPY — Japanese Yen` with a way to remove it, and choosing opens a sheet with
 * a search box over the list, because about 150 rows are not scrolled through
 * with a thumb.
 */
export function CurrencyField({
  value,
  onChange,
  hint,
}: {
  value: string | null
  onChange: (code: string | null) => void
  /** Under the field once a currency is chosen: what it means for this city. */
  hint?: string
}) {
  const theme = useTheme()
  const language = useLanguage()
  const say = useSay()
  const [picking, setPicking] = useState(false)

  return (
    <View style={styles.field}>
      <FieldLabel>{say(message('currencyField.label'))}</FieldLabel>
      <View
        style={[
          styles.control,
          { backgroundColor: theme.colour.surfaceMuted, borderColor: theme.colour.line },
        ]}
      >
        <Pressable
          onPress={() => setPicking(true)}
          accessibilityRole="button"
          accessibilityLabel={
            value === null
              ? say(message('currencyField.chooseLabel'))
              : say(
                  message('currencyField.changeLabel', {
                    currency: currencyLabel(language, value),
                  }),
                )
          }
          style={styles.open}
        >
          <Text
            style={[
              styles.value,
              { color: value === null ? theme.colour.inkMuted : theme.colour.ink },
            ]}
            numberOfLines={1}
          >
            {value === null ? say(message('currencyField.none')) : currencyLabel(language, value)}
          </Text>
        </Pressable>
        {value === null ? (
          <ChevronDown size={16} color={theme.colour.inkMuted} strokeWidth={2} />
        ) : (
          <Pressable
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel={say(message('common.removeNamed', { name: value }))}
            hitSlop={10}
          >
            <X size={16} color={theme.colour.inkMuted} strokeWidth={2} />
          </Pressable>
        )}
      </View>
      {/*
        The label used to carry `(optional)`. It no longer does — no label in
        either form states that a field is optional — so with nothing chosen the
        fact has to be said here, where it was previously said nowhere but the
        `None` the control already reads.
      */}
      {value !== null && hint ? (
        <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>{hint}</Text>
      ) : value === null ? (
        <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
          {say(message('currencyField.noneHint'))}
        </Text>
      ) : null}

      <CurrencyPicker
        open={picking}
        current={value}
        onClose={() => setPicking(false)}
        onPick={(code) => {
          onChange(code)
          setPicking(false)
        }}
      />
    </View>
  )
}

function CurrencyPicker({
  open,
  current,
  onClose,
  onPick,
}: {
  open: boolean
  current: string | null
  onClose: () => void
  onPick: (code: string) => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const height = Math.round(useWindowDimensions().height * SHEET_HEIGHT)
  const language = useLanguage()
  const say = useSay()
  const [query, setQuery] = useState('')
  const results = searchCurrencies(language, query)

  function close() {
    setQuery('')
    onClose()
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={say(message('common.close'))}>
        {/* A bare positioner; the surface is the `View` inside it. See `AGENTS.md`. */}
        <KeyboardAvoidingView behavior="padding">
          <View
            onStartShouldSetResponder={() => true}
            style={[
              styles.sheet,
              {
                height,
                backgroundColor: theme.colour.surface,
                borderColor: theme.colour.line,
                paddingBottom: SPACE.md + insets.bottom,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: theme.colour.ink }]}>
                {say(message('currencyField.label'))}
              </Text>
              <Pressable onPress={close} accessibilityRole="button" style={styles.cancel}>
                <Text style={[styles.cancelText, { color: theme.colour.accentInk }]}>
                  {say(message('common.cancel'))}
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.control,
                { backgroundColor: theme.colour.surfaceMuted, borderColor: theme.colour.line },
              ]}
            >
              <Search size={16} color={theme.colour.inkMuted} strokeWidth={2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={say(message('currencyField.searchPlaceholderShort'))}
                placeholderTextColor={theme.colour.inkMuted}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel={say(message('currencyField.search'))}
                style={[styles.search, { color: theme.colour.ink }]}
              />
            </View>

            <FlatList
              data={results}
              keyExtractor={([code]) => code}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: theme.colour.inkMuted }]}>
                  {say(message('currencyField.noMatch'))}
                </Text>
              }
              renderItem={({ item: [code, name] }) => {
                const chosen = code === current
                const colour = chosen ? theme.colour.accentInk : theme.colour.ink
                return (
                  <Pressable
                    onPress={() => onPick(code)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: chosen }}
                    style={[styles.option, { borderColor: theme.colour.line }]}
                  >
                    <Text style={[styles.code, { color: colour }]}>{code}</Text>
                    <Text style={[styles.name, { color: colour }]}>{name}</Text>
                  </Pressable>
                )
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  field: { gap: SPACE.xs },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.sm + 2,
    minHeight: 44,
  },
  open: { flex: 1, minWidth: 0, paddingVertical: 10 },
  value: { ...fieldRole(TYPE.body) },
  hint: { ...role(TYPE.note) },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { ...role(TYPE.title), flex: 1 },
  cancel: { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.sm },
  cancelText: { ...role(TYPE.control), fontWeight: '700' },
  search: { ...fieldRole(TYPE.body), flex: 1, paddingVertical: 10 },
  list: { flex: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACE.md,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  code: { ...role(TYPE.body), fontWeight: '700', width: 40 },
  name: { ...role(TYPE.body), flex: 1 },
  empty: { ...role(TYPE.note), paddingVertical: SPACE.sm },
})
