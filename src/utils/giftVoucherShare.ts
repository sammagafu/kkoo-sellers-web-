/**
 * Share URL for a gift voucher code (matches kkoo-fiber GiftVouchersHandler.Create share_url pattern).
 */
export function giftVoucherShareUrl(code: string): string {
  const raw =
    (import.meta.env.VITE_APP_ORIGIN as string | undefined) ||
    (import.meta.env.VITE_BUYER_APP_URL as string | undefined) ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  const origin = String(raw || '').replace(/\/$/, '')
  if (!origin) return `/gift?code=${encodeURIComponent(code)}`
  return `${origin}/gift?code=${encodeURIComponent(code)}`
}
