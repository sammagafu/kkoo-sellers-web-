import client from './client'
import type { PremiumAdminMetrics, PremiumAdminSettings, PremiumMembership } from '@/types/premium'

export const premiumAdminApi = {
  getSettings() {
    return client.get<PremiumAdminSettings>('/users/admin/premium/settings/')
  },
  updateSettings(data: PremiumAdminSettings) {
    return client.put<PremiumAdminSettings>('/users/admin/premium/settings/', data)
  },
  getMetrics() {
    return client.get<PremiumAdminMetrics>('/users/admin/premium/metrics/')
  },
  getMemberships(params?: {
    program?: string
    status?: string
    q?: string
  }) {
    return client.get<{ results: PremiumMembership[] }>('/users/admin/premium/memberships/', { params })
  },
}
