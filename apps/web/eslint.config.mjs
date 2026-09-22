import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/**
 * Adds type information to the parser without which `restrict-template-expressions`
 * and `restrict-plus-operands` below cannot run at all. `projectService` finds the
 * tsconfig that owns each file rather than enumerating projects by hand, so nothing
 * here rots when a file moves.
 */
const typeAware = {
  files: ['**/*.ts', '**/*.tsx'],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/restrict-template-expressions': 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
  },
}

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      /*
       * MapLibre's worker, copied in from node_modules by
       * `scripts/copy-maplibre-worker.mjs` on every dev and build. It is
       * minified third-party output, it is gitignored, and nobody here can act
       * on anything said about it.
       *
       * Flat config does not read .gitignore, so being untracked was not enough:
       * these two files were 1077 of 1077 lint warnings, and that volume hid
       * real output twice while this feature was being built. A warning nobody
       * can fix is a warning that trains people to stop reading warnings.
       */
      'public/maplibre/**',
    ],
  },
  ...coreWebVitals,
  ...typescript,
  typeAware,
]

export default config
