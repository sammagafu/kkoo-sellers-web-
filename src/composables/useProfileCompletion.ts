import { ref, computed, onMounted } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userApi, sellerDocumentsApi } from '@/api'

const PROFILE_BANNER_DISMISSED_KEY = 'kkoo_profile_completion_banner_dismissed'

/**
 * Profile completion for sellers (seller profile + KYC docs) and other users (me: name, phone, email).
 * Returns percentage (0–100), route to profile page, and whether to show the update banner.
 */
export function useProfileCompletion() {
  const auth = useAuthStore()
  const loading = ref(true)
  const percentage = ref(100)
  const profileRoute = ref<RouteLocationRaw>({ name: 'dashboards.index' })
  const profileLabel = ref('Profile')

  const dismissed = ref(false)
  try {
    dismissed.value = sessionStorage.getItem(PROFILE_BANNER_DISMISSED_KEY) === '1'
  } catch {}

  const showBanner = computed(() => {
    return !dismissed.value && percentage.value < 100 && !loading.value
  })

  /** Show profile completion in TopBar whenever profile is incomplete (no dismiss). */
  const showInTopBar = computed(() => !loading.value && percentage.value < 100)

  /** Unwrapped for template use (router-link :to). */
  const profileRouteTo = computed<RouteLocationRaw>(() => profileRoute.value)
  const profileLabelLower = computed(() => profileLabel.value.toLowerCase())

  function dismiss() {
    dismissed.value = true
    try {
      sessionStorage.setItem(PROFILE_BANNER_DISMISSED_KEY, '1')
    } catch {}
  }

  function filled(s: unknown): boolean {
    return typeof s === 'string' && s.trim().length > 0
  }

  onMounted(async () => {
    loading.value = true
    percentage.value = 100
    try {
      if (auth.isSeller) {
        profileRoute.value = { name: 'seller.profile' }
        profileLabel.value = 'Seller profile'
        const detailsRes = await userApi.getSellerProfileDetails().catch(() => null)
        const details = detailsRes?.data
        if (details && typeof details === 'object') {
          if (details.kyc_complete === true) {
            percentage.value = 100
          } else {
            const required = (details.required_profile_fields?.length ?? 0) + (details.required_document_types?.length ?? 0)
            const missing = (details.missing_profile_fields?.length ?? 0) + (details.missing_document_types?.length ?? 0)
            const completed = Math.max(0, (required || 1) - missing)
            const total = required || 1
            percentage.value = Math.round((completed / total) * 100)
          }
        } else {
          const [profileRes, docsRes] = await Promise.all([
            userApi.getSellerProfile().catch(() => ({ data: {} })),
            sellerDocumentsApi.list().catch(() => ({ data: [] })),
          ])
          const p = (profileRes.data ?? {}) as Record<string, unknown>
          const docs = Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data as { results?: unknown[] })?.results ?? []
          const hasBusinessName = filled(p.business_name)
          const hasContactPhone = filled(p.contact_phone)
          const hasAddress = filled(p.business_address)
          const hasContactEmail = filled(p.contact_email)
          const hasDoc = docs.length > 0
          const total = 5
          const completed = [hasBusinessName, hasContactPhone, hasAddress, hasContactEmail, hasDoc].filter(Boolean).length
          percentage.value = Math.round((completed / total) * 100)
        }
      } else {
        profileRoute.value = { name: 'account.profile' }
        profileLabel.value = 'Account profile'
        const u = auth.user
        const hasFirst = filled(u?.first_name)
        const hasLast = filled(u?.last_name)
        const hasPhone = filled(u?.phone_number)
        const hasEmail = filled(u?.email)
        const total = 4
        const completed = [hasFirst, hasLast, hasPhone, hasEmail].filter(Boolean).length
        percentage.value = Math.round((completed / total) * 100)
      }
    } catch {
      percentage.value = 0
    } finally {
      loading.value = false
    }
  })

  return {
    loading,
    percentage,
    profileRoute: profileRouteTo,
    profileLabel,
    profileLabelLower,
    showBanner,
    showInTopBar,
    dismiss,
  }
}
