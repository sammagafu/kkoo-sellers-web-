/**
 * Addresses (auth). API.md: CRUD + search.
 */
import client from './client'

export type AddressPayload = {
  street?: string
  district?: string
  region?: string
  ward?: string
  country?: string
  postal_code?: string
  is_default?: boolean
  latitude?: number
  longitude?: number
}

export const addressesApi = {
  list() {
    return client.get<{ results: unknown[] }>('/users/addresses/')
  },
  search(q: string, limit?: number) {
    return client.get<{ query: string; results: Array<{ formatted: string; latitude?: number; longitude?: number; place_id?: string; address?: string }> }>(
      '/users/addresses/search/',
      { params: { q, limit } }
    )
  },
  create(data: AddressPayload) {
    return client.post('/users/addresses/', data)
  },
  get(id: number | string) {
    return client.get(`/users/addresses/${id}/`)
  },
  update(id: number | string, data: Partial<AddressPayload>) {
    return client.put(`/users/addresses/${id}/`, data)
  },
  delete(id: number | string) {
    return client.delete(`/users/addresses/${id}/`)
  },
}
