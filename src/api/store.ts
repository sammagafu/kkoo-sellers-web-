/**
 * Public store/business microsite API.
 * GET /store/public/:slug_or_id — no auth. Used for the business microsite page.
 */
import client from './client'

export interface StorePublicProduct {
  id?: number
  title?: string
  price?: number
  cover_image?: string
  description?: string
  /** Average rating 0–5 for display (e.g. stars). */
  rating?: number
  /** Category name/slug for filtering (when listing is flat). */
  category_name?: string
  category_id?: number
  requires_prescription?: boolean
  [key: string]: unknown
}

export interface StorePromocode {
  type: 'discount_code' | 'promotion'
  code?: string
  name?: string
  description?: string
  discount_amount?: number
  discount_percent?: number
  min_order_amount?: number
  valid_until?: string
  end_datetime?: string
}

export interface StorePublicPayload {
  store_type: 'restaurant' | 'grocery' | 'marketplace' | 'pharmacy' | 'hotel'
  store: {
    business_name?: string
    business_address?: string
    address?: string
    contact_phone?: string
    contact_email?: string
    opening_hours?: string
    menu_slug?: string
    logo_url?: string
    bio?: string
    instagram_url?: string
    facebook_url?: string
    twitter_url?: string
    tiktok_url?: string
    linkedin_url?: string
    menu_card_primary_color?: string
    menu_card_accent_color?: string
    /** When true, show a verified partner badge on the microsite. */
    is_verified?: boolean
    verified_partner?: boolean
    [key: string]: unknown
  }
  categories?: Array<{ id: number; name: string; slug: string; products?: StorePublicProduct[] }>
  products?: StorePublicProduct[]
  microsite_url?: string
  share_slug?: string
  storefront_theme?: {
    logo_url?: string
    primary_color?: string
    accent_color?: string
    [key: string]: unknown
  }
  promocodes?: StorePromocode[]
  referral_code?: string
  api?: { menu_public?: string; catalog?: string }
}

export function getStorePublic(slugOrId: string | number): Promise<{ data: StorePublicPayload }> {
  return client.get(`/store/public/${encodeURIComponent(String(slugOrId))}`)
}
