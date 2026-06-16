/**
 * Sharing (auth except land). API.md: create share, land by ref, earnings.
 */
import client from './client'

export const sharesApi = {
  create(body: { product_id?: number; product_slug?: string }) {
    return client.post<{ id?: number; code?: string; product_id?: number; land_url?: string }>('/shares/', body)
  },
  land(ref: string) {
    return client.get<{ share_code?: string; product?: unknown }>('/shares/land/', { params: { ref } })
  },
  getEarnings() {
    return client.get<{ units_sold?: number; commission_pending?: number; commission_paid?: number; sales?: unknown[] }>('/shares/earnings/')
  },
}
