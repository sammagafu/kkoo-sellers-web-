/**
 * Cart (auth). API.md: get, add, update item, remove item, clear.
 */
import client from './client'

export const cartApi = {
  get() {
    return client.get<{ items: Array<{ sku: unknown; product: unknown; quantity: number }> }>('/cart/')
  },
  add(sku_id: number, quantity = 1) {
    return client.post('/cart/add/', { sku_id, quantity })
  },
  updateItem(itemId: number | string, quantity: number) {
    return client.patch(`/cart/items/${itemId}/update/`, { quantity })
  },
  removeItem(itemId: number | string) {
    return client.delete(`/cart/items/${itemId}/remove/`).catch(() => client.delete(`/cart/items/${itemId}/`))
  },
  removeItemByBody(body: { cart_item_id?: number; item_id?: number }) {
    return client.post('/cart/remove-item/', body)
  },
  clear() {
    return client.post('/cart/clear/')
  },
}
