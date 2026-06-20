import client from './client'

/** API.md: only overview, riders, logistics, earnings are implemented. Other endpoints may 404. */
export const analyticsAdminApi = {
  /** Dashboard: users_count, sellers_count, products_count, orders_count, pending_orders, total_revenue; riders; logistics; earnings */
  overview() {
    return client.get('/analytics/admin/overview/')
  },
  /** Investor dashboard: GMV, growth, channel/location/device, deals, top categories */
  dashboard(params?: { period?: '7d' | '30d' | '90d' | 'all' }) {
    return client.get<AdminDashboardResponse>('/analytics/admin/dashboard/', { params })
  },
  riders() {
    return client.get('/analytics/admin/riders/')
  },
  logistics() {
    return client.get('/analytics/admin/logistics/')
  },
  earnings() {
    return client.get('/analytics/admin/earnings/')
  },
  /** GET /analytics/admin/notifications/ — total, by_type, push_tokens_active, series_7d */
  notifications() {
    return client.get<{
      total?: number
      by_type?: Record<string, number>
      push_tokens_active?: number
      series_7d?: { date: string; count: number }[]
    }>('/analytics/admin/notifications/')
  },
  /** Screen views / exits from client navigation tracking */
  eventAggregates(params?: {
    event_name?: 'screen_view' | 'screen_exit'
    hours?: number
    limit?: number
  }) {
    return client.get<{
      hours?: number
      event_name?: string
      results?: {
        surface?: string
        vertical?: string
        event_name?: string
        count?: number
      }[]
    }>('/analytics/admin/events/aggregates/', { params })
  },
}

export interface AdminDashboardSummary {
  gmv?: number
  orders?: number
  average_order_value?: number
  discount_total?: number
  orders_with_discount?: number
  new_users?: number
}

export interface AdminDashboardGrowth {
  gmv_pct?: number | null
  orders_pct?: number | null
  users_pct?: number | null
}

export interface AdminDashboardBreakdownRow {
  channel?: string
  device?: string
  gmv?: number
  orders?: number
}

export interface AdminDashboardLocationRow {
  delivery_area_id?: number | null
  name?: string
  delivery_zone?: string
  gmv?: number
  orders?: number
}

export interface AdminDashboardCategoryRow {
  category_id?: number | null
  category_name?: string
  gmv?: number
  units?: number
}

export interface AdminDashboardSeriesPoint {
  date?: string
  gmv?: number
  orders?: number
}

export interface AdminDashboardResponse {
  period?: string
  summary?: AdminDashboardSummary
  growth?: AdminDashboardGrowth
  sales_by_channel?: AdminDashboardBreakdownRow[]
  sales_by_device?: AdminDashboardBreakdownRow[]
  sales_by_location?: AdminDashboardLocationRow[]
  deals?: {
    active_promotions?: number
    active_flash_sales?: number
    orders_with_discount?: number
    total_discount_amount?: number
  }
  promotion_performance?: AdminPromotionPerformanceRow[]
  flash_sale_performance?: AdminFlashSalePerformanceRow[]
  top_categories?: AdminDashboardCategoryRow[]
  gmv_series?: AdminDashboardSeriesPoint[]
}

export interface AdminPromotionPerformanceRow {
  promotion_id?: number
  name?: string
  promotion_type?: string
  target_app_key?: string
  is_active?: boolean
  uses_count?: number
  max_uses?: number | null
  total_burn?: number
  discount_percent?: number
  redemption_rate_pct?: number | null
}

export interface AdminFlashSalePerformanceRow {
  flash_sale_id?: number
  name?: string
  vertical?: string
  is_active?: boolean
  units_sold?: number
  item_count?: number
}

/** API.md: GET /analytics/seller/ — full seller analytics. Optional ?period=7d|30d for sales_series. */
export interface SellerAnalyticsTopProduct {
  product_id?: number
  title?: string
  slug?: string
  revenue?: number
  units_sold?: number
}

export interface SellerAnalyticsSalesSeriesPoint {
  date?: string
  sales?: number
  orders?: number
}

export interface SellerAnalyticsResponse {
  total_orders?: number
  total_sales?: number
  orders_this_week?: number
  orders_this_month?: number
  sales_this_week?: number
  sales_this_month?: number
  sales_today?: number
  orders_by_status?: Record<string, number>
  average_order_value?: number
  products_count?: number
  products_low_stock_count?: number
  total_views?: number
  returns_count?: number
  average_rating?: number
  total_reviews?: number
  last_order_at?: string | null
  /** Payout (API.md) */
  paid_out?: number
  pending_payout?: number
  /** Conversion (API.md) */
  total_viewers?: number
  orders_from_viewers?: number
  conversion_rate?: number
  /** Top products by revenue (API.md) */
  top_products?: SellerAnalyticsTopProduct[]
  /** Daily sales when ?period=7d or 30d (API.md) */
  sales_series?: SellerAnalyticsSalesSeriesPoint[]
}

export interface SellerCustomerRow {
  user_id?: number
  name?: string
  phone_number?: string
  order_count?: number
  total_spent?: number
  last_order_at?: string | null
  location?: string
  delivery_area_id?: number | null
  is_repeat?: boolean
}

export interface SellerCustomersResponse {
  period?: string
  summary?: {
    unique_customers?: number
    repeat_customers?: number
    repeat_rate_pct?: number
  }
  top_customers?: SellerCustomerRow[]
  customers_by_location?: { location?: string; orders?: number; gmv?: number }[]
}

export const analyticsSellerApi = {
  overview(params?: { period?: '7d' | '30d' }) {
    return client.get<SellerAnalyticsResponse>('/analytics/seller/', { params })
  },
  customers(params?: { period?: '7d' | '30d' | '90d' | 'all'; limit?: number }) {
    return client.get<SellerCustomersResponse>('/analytics/seller/customers/', { params })
  },
}
