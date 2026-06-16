import client from './client'

export interface DispatchRulesPayload {
  dispatch_directed_offers_enabled?: boolean
  dispatch_bundle_enabled?: boolean
  default_search_radius_meters?: number
  max_search_radius_meters?: number
  offer_timeout_seconds?: number
  max_reassignments?: number
  bundle_pickup_radius_meters?: number
  bundle_dropoff_radius_meters?: number
  bundle_max_added_eta_minutes?: number
  updated_at?: string
}

/** Public. API.md: areas, places search, delivery-quote (surge pricing). */
export const logisticsPublicApi = {
  listAreas() {
    return client.get('/logistics/areas/')
  },
  /** Surge pricing: returns base_fee, surge_multiplier (1.0–2.5), total_fee. Use total_fee as delivery_fee when creating order/job. */
  deliveryQuote(params: { delivery_area_id?: number; base_fee?: number }) {
    return client.get<{ base_fee?: number; surge_multiplier?: number; total_fee?: number; demand?: number; available_riders?: number }>('/logistics/delivery-quote/', { params })
  },
  searchPlaces(q: string) {
    return client.get<Array<{ formatted: string; latitude?: number; longitude?: number; place_id?: string; address?: string }>>(
      '/logistics/places/search/',
      { params: { q } }
    )
  },
}

/** Buyer (auth). API.md: order tracking, review assignment. */
export const logisticsBuyerApi = {
  getTracking(order_id: number) {
    return client.get<{ status?: string; rider?: unknown; gps_track_link?: string; delivery_address?: unknown }>(
      `/logistics/orders/${order_id}/tracking/`
    )
  },
  reviewAssignment(assignmentId: number, data: { rating: number; comment?: string }) {
    return client.post(`/logistics/assignments/${assignmentId}/review/`, data)
  },
}

/** Admin-only. API.md: use these for admin UI to avoid 403 admin_use_admin_endpoints (rider endpoints are for rider app). */
export const logisticsAdminApi = {
  /** GET /logistics/settings/ — commission %, pay-after-N, free rides, min payout. */
  getSettings() {
    return client.get<{
      delivery_commission_percent?: number
      payout_every_n_rides?: number
      free_rides_before_payout?: number
      min_payout_amount?: number
      updated_at?: string
      updated_by?: { id?: number; first_name?: string; last_name?: string }
    }>('/logistics/settings/')
  },
  /** PUT /logistics/settings/ — update commission, pay-after-N, free rides, min payout. */
  updateSettings(data: {
    delivery_commission_percent?: number
    payout_every_n_rides?: number
    free_rides_before_payout?: number
    min_payout_amount?: number
  }) {
    return client.put('/logistics/settings/', data)
  },
  /** GET /logistics/zones/ — list delivery zones (admin). Use this instead of public /logistics/areas/ on admin pages. */
  listZones(params?: Record<string, unknown>) {
    return client.get('/logistics/zones/', { params })
  },
  /**
   * Drivers (a.k.a. riders) — admin management.
   * Note: backend paths remain `/logistics/riders/*`.
   */
  listDrivers(params?: { status?: string; zone?: string }) {
    return client.get('/logistics/riders/', { params })
  },
  getDriver(id: number) {
    return client.get(`/logistics/riders/${id}/`)
  },
  /** PATCH /logistics/riders/:id/ — quotas, status, and onboarding fields (name, vehicle, license, etc.). */
  updateDriver(id: number, data: Record<string, unknown>) {
    return client.patch(`/logistics/riders/${id}/`, data)
  },
  /** POST /logistics/riders/:id/verify/ — action "approve" | "reject" */
  verifyDriver(id: number, payload: { action: 'approve' | 'reject'; rejection_reason?: string }) {
    return client.post(`/logistics/riders/${id}/verify/`, payload)
  },
  listDriverDocuments(driverId: number) {
    return client.get<{ results?: unknown[] }>(`/logistics/riders/${driverId}/documents/`)
  },
  listDriverPayouts(driverId: number) {
    return client.get<{ results?: unknown[] }>(`/logistics/riders/${driverId}/payouts/`)
  },
  listPendingOrders(params?: { area?: string; area_id?: number; group_by?: string }) {
    return client.get('/logistics/orders/pending-assignment/', { params })
  },
  getZone(id: number) {
    return client.get(`/logistics/zones/${id}/`)
  },
  getDispatchRules() {
    return client.get<DispatchRulesPayload>('/logistics/dispatch-rules/')
  },
  updateDispatchRules(data: DispatchRulesPayload) {
    return client.put<DispatchRulesPayload>('/logistics/dispatch-rules/', data)
  },
  getZonePricing(id: number) {
    return client.get(`/logistics/zones/${id}/pricing/`)
  },
  setZonePricing(id: number, data: { base_fee?: number; per_km_fee?: number; min_fee?: number; max_fee?: number; currency?: string }) {
    return client.put(`/logistics/zones/${id}/pricing/`, data)
  },
  updateZone(id: number, data: Record<string, unknown>) {
    return client.patch(`/logistics/zones/${id}/`, data)
  },
}

export const logisticsAreasApi = {
  list() {
    return client.get('/logistics/areas/')
  },
}
