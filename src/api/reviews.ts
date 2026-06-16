/**
 * Reviews. API.md: list by product (no auth), submit (auth), helpful (auth).
 */
import client from './client'

export const reviewsApi = {
  listByProduct(productId: number, params?: { page?: number }) {
    return client.get<{ results: unknown[] }>(`/reviews/products/${productId}/`, { params })
  },
  submit(order_id: number, data: { product_id: number; rating: number; title?: string; comment?: string }) {
    return client.post(`/reviews/order/${order_id}/submit/`, data)
  },
  markHelpful(id: number) {
    return client.post(`/reviews/${id}/helpful/`)
  },
}
