import path from 'node:path'

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    /**
     * Pin the workspace root. Next infers it by walking up for lockfiles, and
     * a stray lockfile anywhere above the repo (a `yarn.lock` in $HOME, say)
     * silently wins — which then skews output file tracing. Inference is not
     * worth depending on when the answer is known.
     */
    root: path.resolve(import.meta.dirname, '../..'),
  },

  /**
   * Shared packages ship TypeScript source rather than build output, so Next
   * has to transpile them.
   *
   * Keep this list complete. It is the same list as the `@pinpoint/*` entries
   * in package.json — a package missing here fails at build time with an
   * unhelpful parse error, and the drift is silent until then.
   */
  transpilePackages: [
    '@pinpoint/auth',
    '@pinpoint/core',
    '@pinpoint/data',
    '@pinpoint/geocode',
    '@pinpoint/map',
    '@pinpoint/supabase',
    '@pinpoint/tokens',
  ],
}

export default nextConfig
