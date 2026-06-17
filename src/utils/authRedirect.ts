import type { RouteLocationRaw } from 'vue-router'

/** Safe post-login redirect from ?redirectedFrom= query. */
export function resolvePostAuthRedirect(
  redirectedFrom: unknown,
  fallback: RouteLocationRaw,
): RouteLocationRaw {
  if (typeof redirectedFrom !== 'string' || !redirectedFrom.startsWith('/')) {
    return fallback
  }
  if (redirectedFrom.startsWith('//') || redirectedFrom.includes('://')) {
    return fallback
  }
  return redirectedFrom
}
