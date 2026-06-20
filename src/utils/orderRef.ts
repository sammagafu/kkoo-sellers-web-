/** Public order ref for URLs and API paths (uuid preferred, then order_number, then legacy id). */
export function resolveOrderRef(order: Record<string, unknown> | null | undefined): string | undefined {
  if (!order) return undefined
  const uuid = order.uuid
  if (typeof uuid === 'string' && uuid.trim()) return uuid.trim()
  const orderNumber = order.order_number
  if (typeof orderNumber === 'string' && orderNumber.trim()) return orderNumber.trim()
  if (typeof orderNumber === 'number' && orderNumber > 0) return String(orderNumber)
  const legacyId = order.id ?? order.order_id
  if (legacyId != null) {
    const s = String(legacyId).trim()
    if (s && s !== 'undefined') return s
  }
  return undefined
}

export function sellerOrderDetailRoute(order: Record<string, unknown>) {
  const id = resolveOrderRef(order)
  if (!id) return undefined
  return { name: 'seller.orders.detail' as const, params: { id } }
}
