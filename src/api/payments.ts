/**
 * Payments (auth except webhooks). API.md: Selcom initiate, simulate (dev).
 */
import client from './client'

export const paymentsApi = {
  initiateSelcom(
    orderRef: string | number,
    redirect_url?: string,
    cancel_url?: string,
  ) {
    const ref = String(orderRef).trim()
    return client.post<{
      payment_gateway_url?: string
      payment_token?: string
      order_id?: number
    }>('/payments/selcom/initiate/', {
      order_ref: ref,
      order_number: ref,
      ...(Number.isFinite(Number(ref)) && Number(ref) > 0
        ? { order_id: Number(ref) }
        : {}),
      redirect_url,
      cancel_url,
    })
  },
  simulate(order_id?: number, ref?: string) {
    return client.get<{ message?: string; order_id?: number }>('/payments/simulate/', {
      params: { order_id, ref },
    })
  },
}
