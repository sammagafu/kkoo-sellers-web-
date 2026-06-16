/**
 * Super-app API (API.md, SUPER_APP_INTEGRATION.md).
 * Verticals, restaurants, menu, grocery stores. No auth required for public discovery.
 */
import client from './client'

export interface RestaurantMenuItem {
  id?: number
  title?: string
  slug?: string
  base_price?: number
  discount_price?: number
  price?: number
  cover_image?: string
  skus?: { id?: number; stock_quantity?: number }[]
  description?: string
}

export interface MenuCategory {
  id?: number
  name?: string
  slug?: string
  products?: RestaurantMenuItem[]
}

export interface RestaurantMenuResponse {
  restaurant?: {
    user_id?: number
    seller_id?: number
    business_name?: string
    business_address?: string
    contact_phone?: string
    prep_time_minutes?: number
    opening_hours?: string
    menu_slug?: string
  }
  categories?: MenuCategory[]
  share_url?: string
  share_slug?: string
}

export interface RestaurantListItem {
  user_id?: number
  seller_id?: number
  business_name?: string
  contact_phone?: string
  business_address?: string
  prep_time_minutes?: number
  opening_hours?: string
  min_order_amount?: number
  delivery_radius_km?: number
  average_rating?: number
  total_orders?: number
  menu_slug?: string
}

/** Hotel list item (same shape as restaurant; sellers with seller_type=hotel). */
export interface HotelListItem {
  user_id?: number
  seller_id?: number
  business_name?: string
  contact_phone?: string
  business_address?: string
  opening_hours?: string
  menu_slug?: string
}

/** Hotel menu response (API returns hotel + categories; same structure as restaurant menu). */
export interface HotelMenuResponse {
  hotel?: {
    user_id?: number
    seller_id?: number
    business_name?: string
    business_address?: string
    contact_phone?: string
    opening_hours?: string
    menu_slug?: string
  }
  categories?: MenuCategory[]
  share_url?: string
  share_slug?: string
  store_type?: string
}

export interface MenuDisplayProduct {
  id?: number
  title?: string
  slug?: string
  description?: string
  base_price?: number
  discount_price?: number | null
  price?: number
  cover_image?: string
  category_name?: string
  category_slug?: string
  prep_time_minutes?: number
  course_type?: string
  dietary_tags?: string[]
}

export interface MenuDisplaySlide {
  id?: string
  kind?: 'single' | 'combo'
  design?: 'spotlight' | 'editorial' | 'combo'
  headline?: string
  subheadline?: string
  product?: MenuDisplayProduct
  products?: MenuDisplayProduct[]
}

export interface MenuDisplayResponse {
  store_type?: string
  share_slug?: string
  share_url?: string
  display_url?: string
  store?: {
    user_id?: number
    store_slug?: string
    business_name?: string
    business_address?: string
    contact_phone?: string
    contact_email?: string
    opening_hours?: string
    menu_slug?: string
    prep_time_minutes?: number
  }
  storefront_theme?: Record<string, unknown>
  display?: {
    enabled?: boolean
    design?: string
    rotation_seconds?: number
    randomize?: boolean
    use_best_sellers?: boolean
    max_best_sellers?: number
    product_ids?: number[]
    combo_product_ids?: number[]
    combo_group_size?: number
    background_preset?: string
    background_image_url?: string
    background_color?: string
    accent_color?: string
    text_color?: string
    headline?: string
    subheadline?: string
    show_prices?: boolean
    show_category?: boolean
  }
  best_sellers?: MenuDisplayProduct[]
  selected_products?: MenuDisplayProduct[]
  combo_products?: MenuDisplayProduct[]
  slides?: MenuDisplaySlide[]
  counts?: Record<string, number>
}

export const superAppApi = {
  /** GET /super-app/verticals/ — list verticals (marketplace, food, grocery, ride). */
  getVerticals() {
    return client.get<{ results: { id?: string; name?: string; slug?: string; enabled?: boolean; description?: string }[] }>(
      '/super-app/verticals/'
    )
  },
  /** GET /super-app/restaurants/ — list restaurants (sellers with seller_type=restaurant). */
  getRestaurants(params?: { limit?: number; offset?: number }) {
    return client.get<{ results: RestaurantListItem[] }>('/super-app/restaurants/', { params })
  },
  /** GET /super-app/restaurants/:seller_id/menu/ — menu by category. */
  getRestaurantMenu(sellerId: number | string) {
    return client.get<RestaurantMenuResponse>(`/super-app/restaurants/${sellerId}/menu/`)
  },
  getMenuDisplay(slugOrId: number | string) {
    return client.get<MenuDisplayResponse>(`/menu/public/${encodeURIComponent(String(slugOrId))}/display/`)
  },
  /** GET /super-app/hotels/ — list hotels (sellers with seller_type=hotel). */
  getHotels(params?: { limit?: number; offset?: number }) {
    return client.get<{ results: HotelListItem[] }>('/super-app/hotels/', { params })
  },
  /** GET /super-app/hotels/:seller_id/menu/ — hotel menu by category (rooms, services, etc.). */
  getHotelMenu(sellerId: number | string) {
    return client.get<HotelMenuResponse>(`/super-app/hotels/${sellerId}/menu/`)
  },
  /** GET /super-app/grocery-stores/ — list grocery stores. */
  getGroceryStores(params?: { limit?: number; offset?: number }) {
    return client.get<{ results: unknown[] }>('/super-app/grocery-stores/', { params })
  },
  /** GET /super-app/grocery-stores/:seller_id/products/ — store + products URL. */
  getGroceryStoreProducts(sellerId: number | string) {
    return client.get(`/super-app/grocery-stores/${sellerId}/products/`)
  },
}
