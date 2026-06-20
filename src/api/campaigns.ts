/**
 * Platform in-app campaigns (buyers app + buyer web) — Fiber §32
 * @see kkooapp-backend-fiber/docs/API.md
 */
import client from './client'

export type CampaignPlacement = 'inapp_advert' | 'promo_banner' | 'promo_carousel' | 'home_hero' | 'rewards_top' | string
export type CampaignChannel = 'web_advert' | 'app_advert' | 'web_banner' | 'app_banner' | 'push' | string

export type AppCampaignPayload = {
  id?: number
  title: string
  subtitle?: string
  image_url?: string
  placement?: CampaignPlacement | string
  delivery_channels?: string
  gift_voucher_id?: number | null
  gift_label?: string
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

export type CampaignPushPayload = {
  dry_run?: boolean
  targets?: {
    mode?: 'subscribers' | 'users'
    user_ids?: number[]
    include_buyers?: boolean
    include_sellers?: boolean
    require_push?: boolean
  }
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
  push(id: number, data?: CampaignPushPayload) {
    return client.post(`/admin/campaigns/${id}/push/`, data ?? {})
  },
}
