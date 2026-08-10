#!/usr/bin/env node
/**
 * Copy MapLibre's worker into `public/` so the browser can actually fetch it.
 *
 * WHY THIS EXISTS
 *
 * maplibre-gl v6 parses tiles in a module worker and derives its URL from its
 * own `import.meta.url` — roughly `new URL('./maplibre-gl-worker.mjs',
 * import.meta.url)`. That is correct for loose files and wrong under every
 * bundler: Turbopack rewrites `import.meta.url`, emits the worker as a
 * content-hashed asset under `/_next/static/media/`, and the path the library
 * computes at runtime points at `/_next/static/chunks/` where nothing is. The
 * request 404s, Next answers with its HTML error page, and the browser refuses
 * it:
 *
 *     Failed to load module script: The server responded with a
 *     non-JavaScript MIME type of "text/html".
 *
 * The failure is nearly silent and its shape is worth remembering: the main
 * thread still owns the camera and mounts markers as DOM, so pins appear in
 * exactly the right places over a blank canvas. It reads as a styling problem
 * and is not one.
 *
 * WHY A COPY RATHER THAN AN IMPORT
 *
 * `setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs',
 * import.meta.url).href)` looks tidier and depends on Turbopack resolving a
 * bare specifier inside `new URL`, which is a heuristic rather than a contract.
 * Copying to a path we choose is boring, and `curl` can prove it works.
 *
 * The copy is regenerated on every `dev` and `build` and is gitignored, so it
 * cannot drift from the installed version — which matters, because a worker
 * built from a different release than the bundle that spawns it fails in ways
 * far worse than a 404.
 *
 * The shared chunk comes along because the worker imports it as a sibling.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The worker resolves this by relative path, so the two must stay siblings.
const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))

// Resolved through the package rather than by walking node_modules, so it
// keeps working whatever the linker does with the layout.
const dist = dirname(require.resolve('maplibre-gl/dist/maplibre-gl.mjs'))
const target = join(here, '..', 'public', 'maplibre')

mkdirSync(target, { recursive: true })

for (const file of FILES) {
  const from = join(dist, file)
  if (!existsSync(from)) {
    // A maplibre release that renames these would otherwise produce a stale
    // copy and a map that silently stops rendering tiles.
    console.error(
      `[maplibre] ${file} is not in ${dist}.\n` +
        `maplibre-gl has changed its dist layout; update ` +
        `apps/web/scripts/copy-maplibre-worker.mjs and the setWorkerUrl call ` +
        `in apps/web/app/_components/trip-map.tsx.`,
    )
    process.exit(1)
  }
  copyFileSync(from, join(target, file))
}

console.log(`[maplibre] worker copied to public/maplibre/ (${FILES.join(', ')})`)
