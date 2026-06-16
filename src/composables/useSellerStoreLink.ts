import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api'

/**
 * For seller: loads profile once and exposes the public store microsite URL and slug.
 * Use in TopBar, Dashboard, etc. to show a "Display microsite" link.
 */
export function useSellerStoreLink() {
  const auth = useAuthStore()
  const loaded = ref(false)
  const slugOrId = ref<string>('')
  const storeLink = ref('')

  const hasStoreLink = computed(() => !!storeLink.value)

  onMounted(async () => {
    if (!auth.isSeller) {
      loaded.value = true
      return
    }
    try {
      const { data } = await authApi.getSellerProfile().catch(() => ({ data: null }))
      const d = (data ?? {}) as Record<string, unknown>
      const id = d.id ?? d.user_id
      const slug = typeof d.menu_slug === 'string' ? d.menu_slug.trim() : ''
      const slugOrIdVal = slug || (id != null ? String(id) : '')
      slugOrId.value = slugOrIdVal
      if (slugOrIdVal) {
        const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        storeLink.value = `${origin}${basePath}/store/${encodeURIComponent(slugOrIdVal)}`
      }
    } finally {
      loaded.value = true
    }
  })

  return { storeLink, slugOrId, loaded, hasStoreLink }
}
