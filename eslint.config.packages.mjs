import tseslint from 'typescript-eslint'

/**
 * The eight packages under `packages/` have no framework — no React, no Next,
 * no Expo — so they need no rules beyond these two, and one configuration
 * here serves all eight rather than eight copies that would have to be edited
 * in step. `tsconfig.base.json` is the same shape: shared tooling
 * configuration lives once at the root.
 *
 * `projectService` finds the tsconfig that owns each file rather than
 * enumerating projects by hand, so nothing here rots when a file moves.
 */
export default [
  {
    ignores: ['**/node_modules/**'],
  },
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
    },
  },
]
