/**
 * Plain-language business type labels for onboarding pickers.
 * Keys match SellerProfile.seller_type / onboarding verticals.
 */
export type BusinessTypeKey = 'marketplace' | 'restaurant' | 'grocery' | 'pharmacy' | 'hotel' | string

export type BusinessTypeDisplay = {
  title: string
  hint: string
  badge?: string
}

const DISPLAY: Record<string, BusinessTypeDisplay> = {
  marketplace: {
    title: 'Shop',
    hint: 'Sell products online or in a store — clothes, electronics, general goods.',
    badge: 'Most common',
  },
  restaurant: {
    title: 'Restaurant',
    hint: 'Food and drinks with a menu — café, takeaway, or dine-in.',
  },
  grocery: {
    title: 'Grocery',
    hint: 'Fresh food, household items, and everyday shopping.',
  },
  pharmacy: {
    title: 'Pharmacy',
    hint: 'Medicines and health products.',
  },
  hotel: {
    title: 'Hotel',
    hint: 'Rooms, bookings, and guest stays.',
  },
}

export function businessTypeDisplay(
  key: string,
  fallback?: { label?: string; description?: string },
): BusinessTypeDisplay {
  const known = DISPLAY[String(key ?? '').toLowerCase()]
  if (known) return known
  return {
    title: fallback?.label || key || 'Business',
    hint: fallback?.description || 'Choose this if it matches what you run.',
  }
}

export function isDefaultBusinessType(key: string) {
  return String(key ?? '').toLowerCase() === 'marketplace'
}
