/**
 * Platform campaign image specs — keep in sync with:
 * - kkooapp-backend-fiber/internal/models/app_campaign_creative.go
 * - kkoo-buyer-web/src/constants/campaignCreative.ts
 * - kkoo-buyers-app/docs/CAMPAIGNS_ADMIN.md
 */
export const CAMPAIGN_ADVERT = {
  creativeType: 'inapp_advert' as const,
  width: 1080,
  height: 1350,
  label: '1080 × 1350',
  aspectLabel: '4:5 portrait',
  tip: 'Full-screen web carousel and in-app advert popup. Design safe content in the lower third for title + CTA.',
}

export const CAMPAIGN_PROMO_BANNER = {
  creativeType: 'promo_banner' as const,
  width: 1920,
  height: 786,
  label: '1920 × 786',
  aspectLabel: 'landscape banner',
  tip: 'Strip banners (home promo strip, Eat/Grocery tabs, cart, checkout, rewards). Same size as promotion covers.',
}

const FULLSCREEN_PLACEMENTS = new Set([
  'inapp_advert',
  'modal',
  'home_hero',
  'promo_carousel',
])

export type CampaignCreativeSpec = {
  creativeType: 'inapp_advert' | 'promo_banner'
  width: number
  height: number
  label: string
  aspectLabel: string
  tip: string
  isPortrait: boolean
}

/** Resolve upload size for a placement (matches backend CreativeSpecForPlacement). */
export function creativeSpecForPlacement(placement?: string | null): CampaignCreativeSpec {
  const p = String(placement ?? '').trim().toLowerCase()
  if (FULLSCREEN_PLACEMENTS.has(p)) {
    return { ...CAMPAIGN_ADVERT, isPortrait: true }
  }
  return { ...CAMPAIGN_PROMO_BANNER, isPortrait: false }
}

export function isFullscreenCampaignPlacement(placement?: string | null) {
  return FULLSCREEN_PLACEMENTS.has(String(placement ?? '').trim().toLowerCase())
}

/** Short helper line for forms. */
export function imageUploadHint(placement?: string | null) {
  const spec = creativeSpecForPlacement(placement)
  return `Upload ${spec.label} px (${spec.aspectLabel}). ${spec.tip}`
}

/** Compact size badge text, e.g. "1080×1350". */
export function imageSizeBadge(placement?: string | null) {
  const spec = creativeSpecForPlacement(placement)
  return `${spec.width}×${spec.height}`
}

/** CSS aspect-ratio value for preview frames. */
export function imageAspectCss(placement?: string | null) {
  const spec = creativeSpecForPlacement(placement)
  return `${spec.width} / ${spec.height}`
}

export const CAMPAIGN_IMAGE_SIZE_SUMMARY = [
  {
    placements: 'inapp_advert, home_hero, promo_carousel',
    size: CAMPAIGN_ADVERT.label,
    use: 'Full-screen popup / marketplace carousel (web)',
  },
  {
    placements: 'promo_banner, food_tab_top, grocery_tab_top, cart_top, checkout_top, rewards_top',
    size: CAMPAIGN_PROMO_BANNER.label,
    use: 'Horizontal strip banners',
  },
] as const
