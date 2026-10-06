const expo = require('eslint-config-expo/flat')

const { wordsRules } = require('../../eslint.words.cjs')

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

/**
 * Ferrostar is imported from `components/following/` and nowhere else.
 *
 * Evaluating it installs its compiled core into the JavaScript engine, and Expo
 * Router evaluates every screen file at launch — so one import anywhere a
 * screen reaches runs it for everybody, and in #282 that made the development
 * build reload itself when *Calculate route* was pressed (`route-following`,
 * *Calculating a route never restarts the application*). The map loads the
 * following view with `lazy()`, which is the only way in. Types cost nothing
 * and stay allowed.
 */
const NO_FERROSTAR_OUTSIDE_FOLLOWING = {
  group: ['@stadiamaps/*'],
  allowTypeImports: true,
  message:
    'Ferrostar is evaluated only once following starts. Import it from components/following/, which the map loads with lazy().',
}

const config = [
  {
    ignores: ['.expo/**', 'node_modules/**', 'expo-env.d.ts'],
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      globals: { __dirname: 'readonly' },
    },
  },
  ...expo,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: [NO_ICON_BARREL], patterns: [NO_FERROSTAR_OUTSIDE_FOLLOWING] },
      ],
    },
  },
  {
    files: ['components/following/**/*.ts', 'components/following/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { paths: [NO_ICON_BARREL] }],
    },
  },
  /**
   * Adds type information to the parser without which `restrict-template-expressions`
   * and `restrict-plus-operands` below cannot run at all. `projectService` finds the
   * tsconfig that owns each file rather than enumerating projects by hand, so nothing
   * here rots when a file moves.
   */
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
    },
  },
  /**
   * Words a person reads are not written into a component. The rules and what
   * they permit are stated once, in `eslint.words.cjs`, for both applications.
   */
  { files: ['**/*.tsx'], rules: wordsRules },
]

module.exports = config
