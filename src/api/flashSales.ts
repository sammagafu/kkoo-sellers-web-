/**
 * Flash Sales API — time-limited lightning deals with live countdown
 * Docs: https://kkooapp-backend-fiber/docs/API.md#22-flash-sales
 */
import client from './client'
import type { FlashSale, FlashSaleCreatePayload } from '../types/flashSales'

// Public: live sales (visible to all buyers)
export async function listActiveFlashSales(params?: {
  page?: number
  vertical?: string
}): Promise<{ results: FlashSale[]; total: number }> {
  return client.get('/flash-sales/', { params }).then((r) => r.data)
}

export async function getFlashSale(slug: string): Promise<FlashSale> {
  return client.get(`/flash-sales/${slug}/`).then((r) => r.data)
}

// Admin CRUD
export async function adminListFlashSales(params?: {
  page?: number
  page_size?: number
  is_active?: boolean
}): Promise<{ results: FlashSale[]; total: number }> {
  return client.get('/admin/flash-sales/', { params }).then((r) => r.data)
}

export async function adminCreateFlashSale(
  data: FlashSaleCreatePayload
): Promise<FlashSale> {
  return client.post('/admin/flash-sales/', data).then((r) => r.data)
}

export async function adminUpdateFlashSale(
  id: number,
  data: Partial<FlashSaleCreatePayload>
): Promise<FlashSale> {
  return client.patch(`/admin/flash-sales/${id}/`, data).then((r) => r.data)
}

export async function adminDeleteFlashSale(id: number): Promise<{ message: string }> {
  return client.delete(`/admin/flash-sales/${id}/`).then((r) => r.data)
}

export async function adminAddFlashSaleItem(
  flashSaleId: number,
  data: {
    product_id: number
    sku_id?: number
    discount_percent?: number
    sale_price?: number
    original_price: number
    stock_limit?: number
  }
): Promise<{ item_id: number; message: string }> {
  return client
    .post(`/admin/flash-sales/${flashSaleId}/items/`, data)
    .then((r) => r.data)
}

export async function adminRemoveFlashSaleItem(
  flashSaleId: number,
  itemId: number
): Promise<{ message: string }> {
  return client
    .delete(`/admin/flash-sales/${flashSaleId}/items/${itemId}/`)
    .then((r) => r.data)
}
