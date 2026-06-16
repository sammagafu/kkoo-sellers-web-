/**
 * Returns (auth). API.md: list, get, create, update, cancel, evidence.
 */
import client from './client'

export const returnsApi = {
  list(params?: { page?: number }) {
    return client.get<{ results: unknown[] }>('/orders/returns/', { params })
  },
  get(id: number | string) {
    return client.get(`/orders/returns/${id}/`)
  },
  create(data: {
    order_id: number
    reason: string
    detailed_reason?: string
    refund_method: string
    items_to_return: Array<{ order_item_id: number; quantity: number; reason?: string }>
  }) {
    return client.post('/orders/returns/create/', data)
  },
  update(id: number | string, data: Record<string, unknown>) {
    return client.put(`/orders/returns/${id}/update/`, data)
  },
  cancel(id: number | string) {
    return client.post<{ message?: string }>(`/orders/returns/${id}/cancel/`)
  },
  addEvidence(id: number | string, formData: FormData) {
    return client.post(`/orders/returns/${id}/evidence/`, formData)
  },
}
