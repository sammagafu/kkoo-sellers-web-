import client from './client'

/** Bank or mobile money provider item (admin-managed, is_available = shown to sellers). */
export interface PayoutMethodOption {
  id: number | string
  name: string
  code?: string
  is_available?: boolean
}

export interface PayoutMethodsSettings {
  banks: PayoutMethodOption[]
  mobile_money_providers: PayoutMethodOption[]
  selcom_enabled: boolean
}

export const payoutsAdminApi = {
  list(params?: { page?: number; seller_id?: number }) {
    return client.get('/payments/admin/payouts/', { params })
  },
  create(data: { seller_id: number; [k: string]: unknown }) {
    return client.post('/payments/admin/payouts/', data)
  },
  get(id: number) {
    return client.get(`/payments/admin/payouts/${id}/`)
  },
  update(id: number, data: Record<string, unknown>) {
    return client.patch(`/payments/admin/payouts/${id}/`, data)
  },
  /** GET payout method settings (banks, mobile money, Selcom). Backend: GET /payments/admin/payout-methods/ */
  getPayoutMethods() {
    return client.get<PayoutMethodsSettings>('/payments/admin/payout-methods/')
  },
  /** PUT payout method settings. Backend: PUT /payments/admin/payout-methods/ */
  updatePayoutMethods(data: PayoutMethodsSettings) {
    return client.put<PayoutMethodsSettings>('/payments/admin/payout-methods/', data)
  },
}

/** Seller: get only available payout methods (for withdrawal choice). Backend: GET /payments/seller/available-payout-methods/ */
export const payoutsSellerApi = {
  getAvailablePayoutMethods() {
    return client.get<PayoutMethodsSettings>('/payments/seller/available-payout-methods/')
  },
}
