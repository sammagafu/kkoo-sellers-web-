/**
 * Keeps access tokens fresh without waiting for 401s (avoids refresh-token rotation races).
 */
import axios from 'axios'
import { mergeAdminAuthTokens, readAdminAuthTokens } from '@/utils/adminAuthSessionStorage'
import { syncPiniaAuthTokens } from '@/utils/syncPiniaAuthFromStorage'

function apiBaseURL(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (raw && typeof raw === 'string' && !raw.startsWith('/')) {
    return raw.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin.replace(/\/$/, '')}/api/v1`
  }
  return 'http://localhost:8080/api/v1'
}

/** Decode JWT `exp` (seconds since epoch). Returns null if missing or invalid. */
export function jwtExpiresAtMs(token: string | null | undefined): number | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null
    return payload.exp * 1000
  } catch {
    return null
  }
}

let refreshInFlight: Promise<{ access: string; refresh: string } | null> | null = null

/** Single-flight refresh: parallel 401s share one rotation (prevents refresh_replay_detected logout). */
export async function refreshAccessTokenSingleFlight(): Promise<{ access: string; refresh: string } | null> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const { refresh } = readAdminAuthTokens()
    if (!refresh) return null
    try {
      const { data } = await axios.post<{ access?: string; refresh?: string; access_token?: string }>(
        `${apiBaseURL()}/users/token/refresh/`,
        { refresh },
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
      )
      const access = data.access ?? (data as { access_token?: string }).access_token
      if (!access) return null
      const nextRefresh = (data.refresh ?? refresh) as string
      mergeAdminAuthTokens(access, nextRefresh)
      await syncPiniaAuthTokens(access, nextRefresh)
      return { access, refresh: nextRefresh }
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

let proactiveTimer: ReturnType<typeof setTimeout> | null = null
let visibilityHandler: (() => void) | null = null

function clearProactiveRefresh() {
  if (proactiveTimer != null) {
    clearTimeout(proactiveTimer)
    proactiveTimer = null
  }
  if (visibilityHandler && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
}

/** Schedule refresh before access token expires (and when tab becomes visible again). */
export function startProactiveTokenRefresh() {
  if (typeof window === 'undefined') return
  clearProactiveRefresh()

  const scheduleNext = () => {
    const { access, refresh } = readAdminAuthTokens()
    if (!refresh) return
    const accessExpMs = jwtExpiresAtMs(access)
    const refreshExpMs = jwtExpiresAtMs(refresh)
    const now = Date.now()
    // Refresh before whichever JWT expires first (min 5 min, max 6h between checks).
    let targetExpMs = accessExpMs
    if (refreshExpMs != null && (targetExpMs == null || refreshExpMs < targetExpMs)) {
      targetExpMs = refreshExpMs
    }
    let delayMs = 6 * 60 * 60 * 1000
    if (targetExpMs != null) {
      const ttlMs = Math.max(targetExpMs - now, 60_000)
      delayMs = Math.min(Math.max(ttlMs - 30 * 60 * 1000, 5 * 60 * 1000), 6 * 60 * 60 * 1000)
    }
    proactiveTimer = setTimeout(async () => {
      await refreshAccessTokenSingleFlight()
      scheduleNext()
    }, delayMs)
  }

  visibilityHandler = () => {
    if (document.visibilityState !== 'visible') return
    const { access, refresh } = readAdminAuthTokens()
    if (!refresh) return
    const expMs = jwtExpiresAtMs(access)
    if (expMs == null || expMs - Date.now() < 15 * 60 * 1000) {
      void refreshAccessTokenSingleFlight().then(() => scheduleNext())
    }
  }
  document.addEventListener('visibilitychange', visibilityHandler)

  // If already near expiry on startup, refresh immediately.
  const { access, refresh } = readAdminAuthTokens()
  if (refresh) {
    const expMs = jwtExpiresAtMs(access)
    if (expMs == null || expMs - Date.now() < 20 * 60 * 1000) {
      void refreshAccessTokenSingleFlight().then(() => scheduleNext())
      return
    }
  }
  scheduleNext()
}

export function stopProactiveTokenRefresh() {
  clearProactiveRefresh()
}
