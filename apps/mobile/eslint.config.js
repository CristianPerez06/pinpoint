const expo = require('eslint-config-expo/flat')

/**
 * Icons come from `lucide-react-native/icons/<name>`, never the package root.
 *
 * The package ships 1767 icons and its root re-exports every one; Metro does not
 * tree-shake in development, so a single value import of the root pulls the
 * whole catalogue into the bundle — 8.5 MB became 12 MB, and 1694 modules became
 * 3391, to draw sixteen glyphs. The rule exists so that regression cannot be
 * reintroduced by an editor's auto-import, which offers the root by default.
 *
 * It is a bundle-size guard and nothing more. A previous version of this comment
 * also blamed the barrel for a startup crash; that diagnosis was wrong — the
 * crash came from stale codegen artifacts after adding native dependencies
 * incrementally — and the overstatement is removed rather than left to mislead.
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
