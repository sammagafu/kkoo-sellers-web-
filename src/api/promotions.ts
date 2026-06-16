import client from './client'

/** Optional fields for create/update. Cover is 1920×786, processed server-side. */
export type PromotionAdminPayload = {
  name?: string
  slug?: string
  promotion_type?: string
  description?: string
  discount_percent?: number
  priority?: number
  start_datetime?: string
  end_datetime?: string
  min_order_amount?: number
  is_active?: boolean
  max_discount_cap?: number
  max_total_burn?: number
  max_uses?: number
  max_uses_per_user?: number
  [key: string]: unknown
}

export const promotionsAdminApi = {
  /** API.md: optional is_active filter */
  list(params?: { page?: number; is_active?: boolean }) {
    return client.get('/promotions/admin/', { params })
  },
  /** Create with JSON body (no cover). Prefer createWithCover for new promotions. */
  create(data: Record<string, unknown>) {
    return client.post('/promotions/admin/', data)
  },
  /**
   * Create promotion with cover image (multipart). Required: name, cover_image or cover (file).
   * Optional: slug, promotion_type, description, discount_percent, priority, start_datetime, end_datetime, min_order_amount, is_active.
   * Cover is resized/cropped to 1920×786 server-side.
   */
  createWithCover(formData: FormData) {
    return client.post('/promotions/admin/', formData)
  },
  get(id: number) {
    return client.get(`/promotions/admin/${id}/`)
  },
  /** Get one promotion by slug (for edit form). */
  getBySlug(slug: string) {
    return client.get(`/promotions/admin/${slug}/`)
  },
  update(id: number, data: Record<string, unknown>) {
    return client.put(`/promotions/admin/${id}/`, data)
  },
  updateBySlug(slug: string, data: Record<string, unknown>) {
    return client.put(`/promotions/admin/${slug}/`, data)
  },
  /**
   * Update promotion with optional new cover image (multipart). Same optional fields as createWithCover.
   * If formData includes cover_image or cover file, backend processes to 1920×786.
   */
  updateWithCover(slug: string, formData: FormData) {
    return client.put(`/promotions/admin/${slug}/`, formData)
  },
  patch(id: number, data: Record<string, unknown>) {
    return client.patch(`/promotions/admin/${id}/`, data)
  },
  patchBySlug(slug: string, data: Record<string, unknown>) {
    return client.patch(`/promotions/admin/${slug}/`, data)
  },
  delete(id: number) {
    return client.delete(`/promotions/admin/${id}/`)
  },
  deleteBySlug(slug: string) {
    return client.delete(`/promotions/admin/${slug}/`)
  },
  listCodes(params?: { page?: number }) {
    return client.get('/promotions/admin/codes/', { params })
  },
  createCode(data: Record<string, unknown>) {
    return client.post('/promotions/admin/codes/', data)
  },
  getCode(id: number) {
    return client.get(`/promotions/admin/codes/${id}/`)
  },
  updateCode(id: number, data: Record<string, unknown>) {
    return client.put(`/promotions/admin/codes/${id}/`, data)
  },
  deleteCode(id: number) {
    return client.delete(`/promotions/admin/codes/${id}/`)
  },
  listBundles(params?: { page?: number }) {
    return client.get('/promotions/admin/bundles/', { params })
  },
  createBundle(data: Record<string, unknown>) {
    return client.post('/promotions/admin/bundles/', data)
  },
  getBundle(id: number) {
    return client.get(`/promotions/admin/bundles/${id}/`)
  },
  updateBundle(id: number, data: Record<string, unknown>) {
    return client.put(`/promotions/admin/bundles/${id}/`, data)
  },
  deleteBundle(id: number) {
    return client.delete(`/promotions/admin/bundles/${id}/`)
  },
  /** Ride/delivery promo codes. API.md: discount_type percent|fixed, discount_value, min_delivery_fee, valid_from, valid_until, max_uses. */
  listRidePromotions(params?: { is_active?: boolean }) {
    return client.get<{ results: unknown[] }>('/promotions/admin/ride-promotions/', { params })
  },
  createRidePromotion(data: Record<string, unknown>) {
    return client.post('/promotions/admin/ride-promotions/', data)
  },
  getRidePromotion(id: number) {
    return client.get(`/promotions/admin/ride-promotions/${id}/`)
  },
  updateRidePromotion(id: number, data: Record<string, unknown>) {
    return client.put(`/promotions/admin/ride-promotions/${id}/`, data)
  },
  patchRidePromotion(id: number, data: Record<string, unknown>) {
    return client.patch(`/promotions/admin/ride-promotions/${id}/`, data)
  },
}
