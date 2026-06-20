/**
 * Admin broadcast notifications (push + in-app inbox).
 */
import client from './client'

export type AnnounceSalePayload = {
  title: string
  message: string
  target_app?: string
  data?: Record<string, unknown>
  dry_run?: boolean
  targets?: {
    mode?: 'subscribers' | 'users'
    user_ids?: number[]
    include_buyers?: boolean
    include_sellers?: boolean
    require_push?: boolean
  }
}

export const pushAnnouncementsApi = {
  announceSale(data: AnnounceSalePayload) {
    return client.post('/admin/notifications/sale/announce/', data)
  },
}
