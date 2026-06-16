/** True when the signed-in seller owns this catalog product row. */
export function sellerOwnsProduct(
  product: { seller_id?: number | string | null },
  sellerUserId: number | string | undefined | null,
): boolean {
  const uid = Number(sellerUserId)
  if (!Number.isFinite(uid) || uid <= 0) return false
  const ownerId = Number(product.seller_id)
  return Number.isFinite(ownerId) && ownerId === uid
}
