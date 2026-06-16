import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

export function useAuthDisplay() {
  const auth = useAuthStore()
  const { user, isAuthenticated } = storeToRefs(auth)

  const displayName = computed(() => {
    const currentUser = user.value
    return (
      currentUser?.full_name ||
      [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') ||
      currentUser?.username ||
      currentUser?.phone_number ||
      'Your account'
    )
  })

  const dashboardRoute = computed(() => auth.defaultRouteAfterAuth())

  return {
    isAuthenticated,
    displayName,
    dashboardRoute,
  }
}
