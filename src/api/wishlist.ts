/**
 * Wishlist (auth). API.md: list, add, remove, clear, check.
 */
import client from './client'

export const wishlistApi = {
  list() {
    return client.get('/users/wishlist/')
  },
  add(product_id: number) {
    return client.post('/users/wishlist/add/', { product_id })
  },
  remove(id: number | string) {
    return client.delete(`/users/wishlist/${id}/remove/`)
  },
  clear() {
    return client.post('/users/wishlist/clear/')
  },
  check(product_id: number) {
    return client.get<{ in_wishlist: boolean }>('/users/wishlist/check/', { params: { product_id } })
  },
}
