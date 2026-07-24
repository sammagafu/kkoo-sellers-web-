/** Production API — kkooapp.co.tz frontends call api.kkooapp.co.tz directly (not same-origin /api/v1). */
export const PRODUCTION_API_BASE_URL = 'https://api.kkooapp.co.tz/api/v1'

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function isKkooWebHost(hostname: string): boolean {
  return hostname === 'kkooapp.co.tz' || hostname.endsWith('.kkooapp.co.tz')
}

/** Resolve REST base URL from VITE_API_BASE_URL, with sane defaults per environment. */
export function resolveApiBaseUrl(
  envValue?: string,
  localFallback = 'http://localhost:8000/api/v1',
): string {
  const raw = String(envValue ?? import.meta.env.VITE_API_BASE_URL ?? '').trim()
  if (raw && !raw.startsWith('/')) {
    return raw.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    const base = origin.replace(/\/$/, '')
    if (isLocalHost(hostname)) {
      return raw.startsWith('/')
        ? `${base}${raw}`.replace(/\/$/, '')
        : localFallback.replace(/\/$/, '')
    }
    if (isKkooWebHost(hostname)) {
      return PRODUCTION_API_BASE_URL
    }
    return `${base}${raw || '/api/v1'}`.replace(/\/$/, '')
  }
  if (raw.startsWith('/')) return raw.replace(/\/$/, '')
  return localFallback.replace(/\/$/, '')
}
