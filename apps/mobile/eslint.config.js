const expo = require('eslint-config-expo/flat')

/**
 * Icons come from `lucide-react-native/icons/<name>`, never the package root.
 *
 * This is a guard against a crash, not a preference about tidiness. The package
 * ships 1767 icons and its root re-exports every one; Metro does not tree-shake
 * in development, so a single value import of the root pulls the whole
 * catalogue into the bundle — 8.5 MB became 12 MB, and a few hundred modules
 * became 3391.
 *
 * The bundle still built and Metro reported success. Hermes then died compiling
 * the barrel's re-export function — it compiles lazily on a fibre with a
 * fixed-size stack — and the failure arrived as `free_list_checksum_botch`
 * inside malloc: SIGABRT, no JavaScript error, no red screen, and nothing in
 * the Metro log past a successful bundle. It reads as a broken native module
 * and is not one.
 *
 * The rule names the exact path rather than a pattern, because a pattern
 * matching `lucide-react-native` also matches `lucide-react-native/icons/bed`
 * and forbids the fix. `allowTypeImports` keeps `import type { LucideIcon }`
 * legal — types are erased before Metro sees them and cost nothing.
 */
const NO_ICON_BARREL = {
  name: 'lucide-react-native',
  allowTypeImports: true,
  message:
    'Import icons individually — lucide-react-native/icons/<name>. The package root pulls all 1767 icons into the bundle and crashes Hermes at startup with no JavaScript error.',
}

const config = [
  {
    ignores: ['.expo/**', 'node_modules/**', 'expo-env.d.ts'],
  },
  ...expo,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { paths: [NO_ICON_BARREL] }],
    },
  },
]

module.exports = config
