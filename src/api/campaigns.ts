/**
 * Platform in-app campaigns (buyers app) — Fiber §32
 * @see kkooapp-backend-fiber/docs/API.md
 */
import client from './client'

export type AppCampaignPayload = {
  id?: number
  title: string
  subtitle?: string
  image_url?: string
  placement?: 'home_hero' | 'rewards_top' | string
  cta_label?: string
  cta_route?: string
  cta_external_url?: string
  priority?: number
  start_at: string
  end_at: string
  target_app_key?: string
  max_impressions_per_user?: number
  cooldown_hours?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export const campaignsAdminApi = {
  list() {
    return client.get<{ results: unknown[] }>('/admin/campaigns/')
  },
  create(data: AppCampaignPayload) {
    return client.post('/admin/campaigns/', data)
  },
  patch(id: number, data: Partial<AppCampaignPayload>) {
    return client.patch(`/admin/campaigns/${id}/`, data)
  },
  delete(id: number) {
    return client.delete(`/admin/campaigns/${id}/`)
  },
}
