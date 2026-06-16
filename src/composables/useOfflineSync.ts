/**
 * Vue Composable: useOfflineSync
 * Tracks offline status and pending sync count
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  getOnlineStatus,
  manualSync,
} from '@/utils/offlineClient'
import { getPendingUpdates, getStorageStats } from '@/utils/offlineStorage'

export interface OfflineSyncState {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  lastSync: Date | null
  storageStats: {
    cached: number
    pending: number
    totalSize: string
  }
}

export function useOfflineSync() {
  const isOnline = ref(true)
  const pendingCount = ref(0)
  const isSyncing = ref(false)
  const lastSync = ref<Date | null>(null)
  const storageStats = ref({
    cached: 0,
    pending: 0,
    totalSize: 'Unknown',
  })

  // Check online status
  const checkStatus = async () => {
    isOnline.value = getOnlineStatus()
    const pending = await getPendingUpdates()
    pendingCount.value = pending.length
    storageStats.value = await getStorageStats()
  }

  // Manual sync
  const sync = async () => {
    if (isSyncing.value) return

    isSyncing.value = true
    try {
      const result = await manualSync()
      lastSync.value = new Date()
      pendingCount.value = result.failed

      console.log(
        `[Sync] Synced: ${result.synced}, Failed: ${result.failed}`
      )

      // Trigger reload of affected data
      window.dispatchEvent(
        new CustomEvent('offline:synced', { detail: result })
      )
    } catch (err) {
      console.error('[Sync] Error:', err)
    } finally {
      isSyncing.value = false
    }
  }

  // Setup listeners
  onMounted(() => {
    checkStatus()

    // Listen for online/offline events
    window.addEventListener('online', checkStatus)
    window.addEventListener('offline', checkStatus)

    // Check status periodically
    const interval = setInterval(checkStatus, 30000) // Every 30s

    onUnmounted(() => {
      window.removeEventListener('online', checkStatus)
      window.removeEventListener('offline', checkStatus)
      clearInterval(interval)
    })
  })

  // Computed properties
  const statusText = computed(() => {
    if (isOnline.value) {
      return pendingCount.value > 0
        ? `Online • ${pendingCount.value} pending sync`
        : 'Online'
    }
    return pendingCount.value > 0
      ? `Offline • ${pendingCount.value} pending`
      : 'Offline'
  })

  const statusClass = computed(() => {
    if (isOnline.value) {
      return pendingCount.value > 0 ? 'warning' : 'success'
    }
    return 'danger'
  })

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSync,
    storageStats,
    statusText,
    statusClass,
    checkStatus,
    sync,
  }
}
