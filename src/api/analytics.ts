import client from './client'

/** API.md: only overview, riders, logistics, earnings are implemented. Other endpoints may 404. */
export const analyticsAdminApi = {
  /** Dashboard: users_count, sellers_count, products_count, orders_count, pending_orders, total_revenue; riders; logistics; earnings */
  overview() {
    return client.get('/analytics/admin/overview/')
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

export const analyticsSellerApi = {
  overview(params?: { period?: '7d' | '30d' }) {
    return client.get<SellerAnalyticsResponse>('/analytics/seller/', { params })
  },
}
