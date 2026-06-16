/**
 * Avoid static import cycles (api client ↔ auth store). Called after axios refreshes tokens on disk.
 */
export async function syncPiniaAuthTokens(access: string, refresh: string): Promise<void> {
  try {
    const { getActivePinia } = await import('pinia')
    const pinia = getActivePinia()
    if (!pinia) return
    const { useAuthStore } = await import('@/stores/auth')
    useAuthStore(pinia).setTokens(access, refresh)
  } catch {
    // No Pinia (tests / SSR) — disk is still authoritative.
  }
}

/** Clear in-memory auth when refresh fails; does not clear offline IndexedDB. */
export async function resetPiniaAuthAfterRefreshFailure(): Promise<void> {
  try {
    const { getActivePinia } = await import('pinia')
    const pinia = getActivePinia()
    if (!pinia) return
    const { useAuthStore } = await import('@/stores/auth')
    await useAuthStore(pinia).resetAuthIdentityFromHttpClient()
  } catch {
    // ignore
  }
}
