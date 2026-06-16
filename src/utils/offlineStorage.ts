/**
 * Offline Storage Manager — IndexedDB + Cache API
 * Optimized for slow/offline networks in Africa
 */

const DB_NAME = 'kkoo-admin-db'
const DB_VERSION = 1
const CACHE_NAME = 'kkoo-admin-v1'
const API_CACHE = 'kkoo-api-cache'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

// IndexedDB Stores
const STORES = {
  RESPONSES: 'api_responses',
  PENDING_UPDATES: 'pending_updates',
  SETTINGS: 'settings',
}

/**
 * Initialize IndexedDB
 */
export async function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      // API responses cache
      if (!db.objectStoreNames.contains(STORES.RESPONSES)) {
        const store = db.createObjectStore(STORES.RESPONSES, { keyPath: 'url' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Pending updates queue
      if (!db.objectStoreNames.contains(STORES.PENDING_UPDATES)) {
        const store = db.createObjectStore(STORES.PENDING_UPDATES, {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Settings & preferences
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
      }
    }
  })
}

/**
 * Save API response to IndexedDB
 */
export async function cacheResponse<T>(
  url: string,
  data: T,
  ttl = 7 * 24 * 60 * 60 * 1000 // 7 days default
): Promise<void> {
  try {
    const db = await initOfflineDB()
    const tx = db.transaction(STORES.RESPONSES, 'readwrite')
    const store = tx.objectStore(STORES.RESPONSES)

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        url,
        data,
        timestamp: Date.now(),
        ttl,
      })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (err) {
    console.warn('[Offline] Failed to cache response:', err)
  }
}

/**
 * Retrieve cached API response
 */
export async function getCachedResponse<T>(url: string): Promise<T | null> {
  try {
    const db = await initOfflineDB()
    const tx = db.transaction(STORES.RESPONSES, 'readonly')
    const store = tx.objectStore(STORES.RESPONSES)

    return new Promise((resolve, reject) => {
      const request = store.get(url)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (!result) {
          resolve(null)
          return
        }

        // Check TTL
        if (Date.now() - result.timestamp > result.ttl) {
          store.delete(url) // Cleanup expired entry
          resolve(null)
        } else {
          resolve(result.data as T)
        }
      }
    })
  } catch (err) {
    console.warn('[Offline] Failed to retrieve cached response:', err)
    return null
  }
}

/**
 * Queue pending update for retry when online
 */
export async function queuePendingUpdate(
  method: string,
  url: string,
  data: unknown,
  headers?: Record<string, string>
): Promise<number> {
  try {
    const db = await initOfflineDB()
    const tx = db.transaction(STORES.PENDING_UPDATES, 'readwrite')
    const store = tx.objectStore(STORES.PENDING_UPDATES)

    return new Promise((resolve, reject) => {
      const request = store.add({
        method,
        url,
        data,
        headers,
        timestamp: Date.now(),
        retryCount: 0,
      })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result as number)
    })
  } catch (err) {
    console.error('[Offline] Failed to queue update:', err)
    throw err
  }
}

/**
 * Get all pending updates
 */
export async function getPendingUpdates(): Promise<
  {
    id: number
    method: string
    url: string
    data: unknown
    headers?: Record<string, string>
    retryCount: number
    timestamp: number
  }[]
> {
  try {
    const db = await initOfflineDB()
    const tx = db.transaction(STORES.PENDING_UPDATES, 'readonly')
    const store = tx.objectStore(STORES.PENDING_UPDATES)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (err) {
    console.warn('[Offline] Failed to get pending updates:', err)
    return []
  }
}

/**
 * Remove pending update after successful sync
 */
export async function removePendingUpdate(id: number): Promise<void> {
  try {
    const db = await initOfflineDB()
    const tx = db.transaction(STORES.PENDING_UPDATES, 'readwrite')
    const store = tx.objectStore(STORES.PENDING_UPDATES)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (err) {
    console.error('[Offline] Failed to remove pending update:', err)
  }
}

/**
 * Clear all offline data (for logout, etc)
 */
export async function clearOfflineData(): Promise<void> {
  try {
    const tasks: Promise<void>[] = []

    if (typeof indexedDB !== 'undefined') {
      tasks.push(
        new Promise<void>((resolve) => {
          const request = indexedDB.open(DB_NAME)
          request.onerror = () => resolve()
          request.onsuccess = () => {
            const db = request.result
            db.close()
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
            deleteRequest.onerror = () => resolve()
            deleteRequest.onsuccess = () => resolve()
          }
        })
      )
    }

    if (typeof caches !== 'undefined') {
      tasks.push(
        caches.keys().then((names) =>
          Promise.all(names.map((name) => caches.delete(name))).then(() => {})
        )
      )
    }

    await Promise.all(tasks)
  } catch (err) {
    console.error('[Offline] Failed to clear offline data:', err)
  }
}

/**
 * Get offline storage stats
 */
export async function getStorageStats(): Promise<{
  cached: number
  pending: number
  totalSize: string
}> {
  try {
    const db = await initOfflineDB()
    let cached = 0,
      pending = 0

    for (const storeName of [STORES.RESPONSES, STORES.PENDING_UPDATES]) {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)

      const result = await new Promise<number>((resolve, reject) => {
        const request = store.count()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })

      if (storeName === STORES.RESPONSES) cached = result
      else pending = result
    }

    // Estimate size (rough calculation)
    const estimate =
      navigator.storage?.estimate && (await navigator.storage.estimate())
    const usage = estimate?.usage
    const quota = estimate?.quota

    return {
      cached,
      pending,
      totalSize:
        typeof usage === 'number' && typeof quota === 'number'
          ? `${Math.round(usage / 1024 / 1024)}MB / ${Math.round(quota / 1024 / 1024)}MB`
          : 'Unknown',
    }
  } catch (err) {
    console.warn('[Offline] Failed to get storage stats:', err)
    return { cached: 0, pending: 0, totalSize: 'Unknown' }
  }
}
