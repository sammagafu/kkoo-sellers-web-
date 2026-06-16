/**
 * Offline API Client — Auto-cache reads, queue writes
 * Extends base client.ts with offline-first capabilities
 */

import axios, { AxiosError } from 'axios'
import {
  cacheResponse,
  getCachedResponse,
  queuePendingUpdate,
  getPendingUpdates,
  removePendingUpdate,
} from './offlineStorage'

// Detect online/offline status
let isOnline = true

window.addEventListener('online', () => {
  isOnline = true
  console.log('[Offline] Status: ONLINE → syncing pending updates')
  syncPendingUpdates()
})

window.addEventListener('offline', () => {
  isOnline = false
  console.log('[Offline] Status: OFFLINE → queuing writes')
})

// Check initial status
isOnline = navigator.onLine

/**
 * Get current online status
 */
export function getOnlineStatus(): boolean {
  return isOnline
}

/**
 * Wrap axios request with offline support
 * GET requests use cache first; POST/PATCH/DELETE queue if offline
 */
export async function offlineAwareRequest<T>(
  method: string,
  url: string,
  data?: unknown,
  config?: any
): Promise<T> {
  const cacheKey = `${method}:${url}`

  // GET requests: Cache first, then network
  if (method.toUpperCase() === 'GET') {
    if (!isOnline) {
      const cached = await getCachedResponse<T>(cacheKey)
      if (cached) {
        console.log('[Offline] Serving from cache:', url)
        return cached
      }
      throw new Error('No cached data and offline')
    }

    try {
      const response = await axios({ method, url, ...config })
      // Cache successful response
      await cacheResponse(cacheKey, response.data, 24 * 60 * 60 * 1000) // 24h
      return response.data
    } catch (err) {
      // Fallback to cache on network error
      const cached = await getCachedResponse<T>(cacheKey)
      if (cached) {
        console.warn('[Offline] Network error, serving cached:', url)
        return cached
      }
      throw err
    }
  }

  // POST/PATCH/DELETE: Queue if offline, send if online
  if (!isOnline) {
    console.log('[Offline] Queueing write:', method, url)
    await queuePendingUpdate(method, url, data, config?.headers)
    // Return optimistic response
    return { id: 'pending' } as T
  }

  try {
    const response = await axios({ method, url, data, ...config })
    return response.data
  } catch (err) {
    // If server error, queue for retry
    if (
      err instanceof AxiosError &&
      (!err.response || err.response.status >= 500)
    ) {
      console.log('[Offline] Server error, queuing for retry:', method, url)
      await queuePendingUpdate(method, url, data, config?.headers)
      return { id: 'pending' } as T
    }
    throw err
  }
}

/**
 * Sync all pending updates when coming online
 */
async function syncPendingUpdates(): Promise<void> {
  if (!isOnline) return

  const pending = await getPendingUpdates()
  if (pending.length === 0) return

  console.log(`[Offline] Syncing ${pending.length} pending updates...`)

  for (const update of pending) {
    try {
      const response = await axios({
        method: update.method,
        url: update.url,
        data: update.data,
        headers: update.headers,
      })

      if (response.status >= 200 && response.status < 300) {
        await removePendingUpdate(update.id)
        console.log('[Offline] ✓ Synced:', update.method, update.url)
      }
    } catch (err) {
      // Increment retry count
      update.retryCount++
      if (update.retryCount > 3) {
        console.error('[Offline] ✗ Max retries, removing:', update.url)
        await removePendingUpdate(update.id)
      }
    }
  }

  console.log('[Offline] Sync complete')
}

/**
 * Manual sync trigger
 */
export async function manualSync(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingUpdates()
  let synced = 0,
    failed = 0

  for (const update of pending) {
    try {
      await axios({
        method: update.method,
        url: update.url,
        data: update.data,
        headers: update.headers,
      })
      await removePendingUpdate(update.id)
      synced++
    } catch {
      failed++
    }
  }

  return { synced, failed }
}
