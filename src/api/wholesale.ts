import client from './client'

/** Public. API.md: products with wholesale tiers. */
export const wholesalePublicApi = {
  listProducts() {
    return client.get('/wholesale/products/')
  },
}

/** Auth. API.md: me, apply. */
export const wholesaleUserApi = {
  getMe() {
    return client.get('/wholesale/me/')
  },
  apply(data: {
    business_name: string
    tin_number?: string
    business_address?: string
    business_latitude?: number
    business_longitude?: number
    notes?: string
  }) {
    return client.post('/wholesale/apply/', data)
  },
}

/** Seller. API.md: tiers CRUD. */
export const wholesaleSellerApi = {
  listTiers(params?: { page?: number }) {
    return client.get('/wholesale/seller/tiers/', { params })
  },
  getTier(id: number) {
    return client.get(`/wholesale/seller/tiers/${id}/`)
  },
  createTier(data: { product_id?: number; product?: number; min_quantity: number; unit_price: number | string }) {
    return client.post('/wholesale/seller/tiers/', {
      product_id: data.product_id ?? data.product,
      min_quantity: data.min_quantity,
      unit_price: data.unit_price,
    })
  },
  updateTier(id: number, data: { min_quantity?: number; unit_price?: number }) {
    return client.put(`/wholesale/seller/tiers/${id}/`, data)
  },
  deleteTier(id: number) {
    return client.delete(`/wholesale/seller/tiers/${id}/`)
  },
}
