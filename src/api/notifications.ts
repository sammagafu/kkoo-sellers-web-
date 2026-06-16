/**
 * Notifications (auth). API.md: list, unread count, mark read, push token.
 */
import client from './client'

export const notificationsApi = {
  list(params?: { unread_only?: boolean }) {
    return client.get('/notifications/', { params: params?.unread_only !== undefined ? { unread_only: params.unread_only } : undefined })
  },
  getUnreadCount() {
    return client.get<{ unread_count: number }>('/notifications/unread-count/')
  },
  markAllRead() {
    return client.post<{ message?: string }>('/notifications/mark-all-read/')
  },
  get(id: number | string) {
    return client.get(`/notifications/${id}/`)
  },
  markRead(id: number | string) {
    return client.patch(`/notifications/${id}/`)
  },
  registerPushToken(data: { token: string; platform: string; device_id?: string }) {
    return client.post<{ message?: string; id?: number }>('/notifications/push-token/register/', data)
  },
  deletePushToken(token: string) {
    return client.delete(`/notifications/push-token/${encodeURIComponent(token)}/`)
  },
  /** Notification preferences (subscriptions). API: GET/POST /notifications/preferences/, DELETE .../:id/ */
  getPreferences() {
    return client.get<{ results?: { id: number; type: string; category_id?: number; search_phrase?: string }[] }>('/notifications/preferences/')
  },
  createPreference(data: { type: string; category_id?: number; search_phrase?: string }) {
    return client.post('/notifications/preferences/', data)
  },
  deletePreference(id: number | string) {
    return client.delete(`/notifications/preferences/${id}/`)
  },
}
