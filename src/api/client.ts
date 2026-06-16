/**
 * KKOO API client for the seller & admin panel.
 * Base URL from import.meta.env.VITE_API_BASE_URL (e.g. http://localhost:8080/api/v1).
 * Per API.md: Bearer token, refresh on 401, clear tokens when refresh fails.
 * (Buyers use the mobile app and customer website.)
 */
import axios, { type AxiosInstance } from 'axios'
import {
  clearAdminAuthSession,
  readAdminAuthTokens,
} from '@/utils/adminAuthSessionStorage'
import { refreshAccessTokenSingleFlight } from '@/utils/tokenRefresh'
import { resetPiniaAuthAfterRefreshFailure } from '@/utils/syncPiniaAuthFromStorage'

function inferDefaultBaseURL(): string {
  if (typeof window === 'undefined') return 'http://localhost:8080/api/v1'
  const origin = window.location.origin.replace(/\/$/, '')
  // Same-origin /api/v1 — nginx (or host proxy) forwards to Fiber; avoids CORS on uploads.
  return `${origin}/api/v1`
}

function normalizeBaseURL(raw: string): string {
  if (raw.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin.replace(/\/$/, '')}${raw}`.replace(/\/$/, '')
    }
    return raw.replace(/\/$/, '')
  }
  try {
    const u = new URL(raw)
    return u.toString().replace(/\/$/, '')
  } catch {
    return raw.replace(/\/$/, '')
  }
}

// Prefer build-time env; otherwise inferred default; final fallback handled in inferDefaultBaseURL()
const baseURL = normalizeBaseURL(import.meta.env.VITE_API_BASE_URL || inferDefaultBaseURL())

/** Clear stored auth (e.g. when refresh fails). Caller should redirect to login. */
export function clearStoredAuth() {
  clearAdminAuthSession()
  void resetPiniaAuthAfterRefreshFailure()
}

const client: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

client.interceptors.request.use((config) => {
  const { access } = readAdminAuthTokens()
  if (access) config.headers.Authorization = `Bearer ${access}`
  if (config.data instanceof FormData) delete config.headers['Content-Type']
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    // API.md: 403 — seller_profile_required; admin_use_admin_endpoints (admin hit seller/rider-only endpoint → redirect to admin UI)
    if (err.response?.status === 403) {
      const code = err.response?.data?.error_code
      // admin_required / superuser_required: surfaces to UI (no global redirect — wrong role vs wrong credentials)
      if (code === 'seller_profile_required') {
        try {
          const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
          const path = window.location.pathname || ''
          // Staff on admin catalog routes should see the error, not leave the page.
          if (
            !path.includes('/seller/profile') &&
            !path.includes('/auth/') &&
            !path.includes('/admin/catalog')
          ) {
            window.location.href = (window.location.origin || '') + base + '/seller/profile'
            return Promise.reject(err)
          }
        } catch (_) {
          // ignore
        }
      }
      if (code === 'admin_use_admin_endpoints') {
        try {
          const path = window.location.pathname || ''
          if (!path.includes('/admin/')) {
            const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
            window.location.href = (window.location.origin || '') + base + '/admin/logistics'
            return Promise.reject(err)
          }
        } catch (_) {
          // ignore
        }
      }
    }
    // Never attempt refresh-token retry for auth endpoints.
    const originalUrl = String(original?.url ?? '')
    const isAuthEndpoint =
      originalUrl.includes('/users/login/') ||
      originalUrl.includes('/users/register/') ||
      originalUrl.includes('/users/otp/') ||
      originalUrl.includes('/users/auth/otp-') ||
      originalUrl.includes('/users/password/reset-') ||
      originalUrl.includes('/users/token/refresh/')

    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true
      const rotated = await refreshAccessTokenSingleFlight()
      if (rotated?.access) {
        original.headers.Authorization = `Bearer ${rotated.access}`
        return client(original)
      }
      clearStoredAuth()
      const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
      if (!window.location.pathname.startsWith(basePath + '/auth/')) {
        window.location.href = (window.location.origin || '') + basePath + '/auth/sign-in'
      }
    }
    return Promise.reject(err)
  }
)

export default client
