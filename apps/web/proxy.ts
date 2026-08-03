import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'

/**
 * Runs before every matched request.
 *
 * Next 16 renamed this convention from `middleware` to `proxy`; the old name
 * still works but warns at build time.
 */
export default async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  /**
   * Everything except static assets. The session has to be refreshed on page
   * requests; refreshing it while serving an image is wasted work.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
