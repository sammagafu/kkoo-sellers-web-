import client from './client'

/** User orders (auth). API.md: create, list, get, cancel. */
export const ordersUserApi = {
  create(data: {
    delivery_address_id: number
    delivery_location_text?: string
    delivery_lat?: number
    delivery_lng?: number
    delivery_zone?: string
    payment_method: string
    discount_code?: string
    use_loyalty_points?: boolean
    share_code?: string
    gift_voucher_code?: string
    /** Idempotent order create (header Idempotency-Key also supported). */
    idempotency_key?: string
    /** express | normal (default normal) */
    delivery_type?: 'express' | 'normal'
    delivery_delicate?: boolean
    /** Bolt-like ride/delivery fee (number) */
    delivery_fee?: number
  }) {
    return client.post('/orders/create/', data)
  },
  list(params?: { page?: number; page_size?: number }) {
    return client.get<{ results: unknown[] }>('/orders/', { params })
  },
  get(id: number) {
    return client.get(`/orders/${id}/`)
  },
  cancel(id: number) {
    return client.post(`/orders/${id}/cancel/`)
  },
  /** Order invoice: create, customize, send (for business owner/seller). Same endpoints as admin; backend may allow seller for their orders. */
  getInvoice(orderId: number) {
    return client.get<OrderInvoiceResponse>(`/orders/${orderId}/invoice/`)
  },
  createOrUpdateInvoice(orderId: number, customization?: OrderInvoiceCustomization) {
    return client.post<OrderInvoiceResponse>(`/orders/${orderId}/invoice/`, customization ? { customization } : {})
  },
  /**
   * kkoo-fiber has no POST /orders/:id/invoice/upload-logo/. Uses POST /users/seller/profile/logo/ (multipart `logo`) to get logo_url, then save via createOrUpdateInvoice.
   */
  uploadInvoiceLogo(_orderId: number, formData: FormData) {
    return client.post<{ logo_url?: string; message?: string }>('/users/seller/profile/logo/', formData)
  },
  sendInvoice(orderId: number, payload?: { delivery_method?: 'link' | 'email'; to_email?: string }) {
    return client.post<{ message?: string; sent_at?: string; share_url?: string; tracking_pixel_url?: string; sent_to_email?: string }>(
      `/orders/${orderId}/invoice/send/`,
      payload ?? {}
    )
  },
}

/** Admin: staff see all orders, refund, status, returns. API.md: refund at POST /orders/:id/refund/, status PATCH /orders/:id/status/, returns at /orders/returns/admin/ and /orders/returns/:id/... */
export const ordersAdminApi = {
  list(params?: { page?: number; page_size?: number; status?: string; search?: string }) {
    return client.get('/orders/', { params })
  },
  get(orderId: number) {
    return client.get(`/orders/${orderId}/`)
  },
  refund(orderId: number, data?: Record<string, unknown>) {
    return client.post(`/orders/${orderId}/refund/`, data ?? {})
  },
  updateStatus(orderId: number, status: string) {
    return client.patch(`/orders/${orderId}/status/`, { status })
  },
  /** API.md: GET /orders/returns/admin/ — list all return requests (admin) */
  listReturns(params?: { page?: number; page_size?: number; status?: string }) {
    return client.get('/orders/returns/admin/', { params })
  },
  getReturn(id: number) {
    return client.get(`/orders/returns/${id}/`)
  },
  approveReturn(id: number, data?: { admin_notes?: string }) {
    return client.post(`/orders/returns/${id}/approve/`, data)
  },
  rejectReturn(id: number, data?: { admin_notes?: string }) {
    return client.post(`/orders/returns/${id}/reject/`, data)
  },
  itemReceivedReturn(id: number) {
    return client.post(`/orders/returns/${id}/item-received/`)
  },
  processRefundReturn(id: number) {
    return client.post(`/orders/returns/${id}/process-refund/`)
  },
  /** INVOICES.md + API.md: order invoice (customize, send, track opens). */
  getInvoice(orderId: number) {
    return client.get<OrderInvoiceResponse>(`/orders/${orderId}/invoice/`)
  },
  createOrUpdateInvoice(orderId: number, customization?: OrderInvoiceCustomization) {
    return client.post<OrderInvoiceResponse>(`/orders/${orderId}/invoice/`, customization ? { customization } : {})
  },
  sendInvoice(orderId: number, payload?: { delivery_method?: 'link' | 'email'; to_email?: string }) {
    return client.post<{ message?: string; sent_at?: string; share_url?: string; tracking_pixel_url?: string; sent_to_email?: string }>(
      `/orders/${orderId}/invoice/send/`,
      payload ?? {}
    )
  },
}

/** Invoice response: API.md Order invoices. */
export interface OrderInvoiceResponse {
  id?: number
  order_id?: number
  sent_at?: string | null
  delivery_method?: string | null
  sent_to_email?: string | null
  first_opened_at?: string | null
  open_count?: number
  share_url?: string | null
  tracking_pixel_url?: string | null
  created_at?: string
  updated_at?: string
}

/** INVOICES.md customization fields. */
export interface OrderInvoiceCustomization {
  logo_url?: string
  company_name?: string
  primary_color?: string
  accent_color?: string
  footer_text?: string
  show_tax_id?: boolean
  tax_id_label?: string
  currency_code?: string
  extra_fields?: { label: string; value: string }[]
}
