/**
 * Single place for persisted admin panel auth (`kkoo_admin_auth` in localStorage).
 * Pinia auth store and axios client both use this so tokens stay consistent on disk.
 */

export const ADMIN_AUTH_STORAGE_KEY = 'kkoo_admin_auth'

export type AdminAuthPersistedBlob = {
  access?: string | null
  refresh?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  user?: unknown
  activeAccountRole?: string | null
}

export function readAdminAuthBlob(): AdminAuthPersistedBlob | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as AdminAuthPersistedBlob
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

export function readAdminAuthTokens(): { access: string | null; refresh: string | null } {
  const b = readAdminAuthBlob()
  if (!b) return { access: null, refresh: null }
  return {
    access: b.access ?? b.accessToken ?? null,
    refresh: b.refresh ?? b.refreshToken ?? null,
  }
}

/** Merge rotated tokens into the existing blob (keeps user + activeAccountRole). */
export function mergeAdminAuthTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return
  try {
    const prev = readAdminAuthBlob() ?? {}
    const next: AdminAuthPersistedBlob = { ...prev, access, refresh }
    if (next.access && next.refresh) {
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(next))
    }
  } catch {
    // ignore quota / privacy mode
  }
}

export function writeAdminAuthSession(blob: AdminAuthPersistedBlob) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(blob))
  } catch {
    // ignore
  }
}

export function clearAdminAuthSession() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
  } catch {
    // ignore
  }
}
