import type { AxiosRequestConfig } from 'axios'
import client from './client'

/** API.md: list users; get/update single user (account_status, etc.). IMPORT.md: template download. */
export const usersAdminApi = {
  list(params?: {
    page?: number
    page_size?: number
    /** API.md: account_status */
    account_status?: string
    /** Legacy alias some UIs send */
    status?: string
    is_seller?: 0 | 1
    search?: string
  }) {
    return client.get('/users/admin/users/', { params })
  },
  get(userId: number) {
    return client.get(`/users/admin/users/${userId}/`)
  },
  update(userId: number, data: Record<string, unknown>) {
    return client.put(`/users/admin/users/${userId}/`, data)
  },
  /** Same body as update(); backend accepts PATCH for partial admin user updates. */
  patch(userId: number, data: Record<string, unknown>) {
    return client.patch(`/users/admin/users/${userId}/`, data)
  },
  /** PATCH buyer profile fields (currency, country) for post-registration onboarding. */
  patchBuyerProfile(userId: number, data: { currency_code?: string; country_code?: string }) {
    return client.patch(`/users/admin/users/${userId}/buyer-profile/`, data)
  },
  /** PATCH store/seller profile (business name, contacts, etc.). */
  patchSellerProfile(sellerId: number, data: Record<string, unknown>) {
    return client.patch(`/users/admin/sellers/${sellerId}/profile/`, data)
  },
  /**
   * Ban / suspend / activate via PATCH account_status (Fiber: PUT/PATCH /users/admin/users/:id/).
   * `reason` is accepted for UI but not persisted unless the backend adds a field.
   */
  userAction(userId: number, data: { action: 'ban' | 'suspend' | 'activate'; reason?: string }) {
    const status =
      data.action === 'ban' ? 'banned' : data.action === 'suspend' ? 'suspended' : 'active'
    return client.patch(`/users/admin/users/${userId}/`, { account_status: status })
  },
  /** IMPORT.md: GET /users/admin/import/templates/:type/ — returns CSV attachment. type: users | categories | brands | catalog. */
  getImportTemplate(type: 'users' | 'categories' | 'brands' | 'catalog') {
    return client.get(`/users/admin/import/templates/${type}/`, { responseType: 'blob' })
  },
  /** IMPORT.md: POST /users/admin/import/users/ — multipart `file` (CSV or .xlsx). */
  importUsers(file: File, config?: AxiosRequestConfig) {
    const form = new FormData()
    form.append('file', file)
    return client.post<{ message?: string; created?: number; errors?: string[] }>('/users/admin/import/users/', form, config)
  },
}

/** API.md: GET /users/admin/kyc-documents/, approve, reject. */
export const kycAdminApi = {
  list(params?: { status?: string; page?: number; page_size?: number }) {
    return client.get<{ results?: unknown[] }>('/users/admin/kyc-documents/', { params })
  },
  approve(id: number) {
    return client.post(`/users/admin/kyc-documents/${id}/approve/`)
  },
  reject(id: number, data?: { reason?: string }) {
    return client.post(`/users/admin/kyc-documents/${id}/reject/`, data ?? {})
  },
}

/** Seller (auth): KYC/document upload. API.md: GET/POST /users/seller/documents/ */
export const sellerDocumentsApi = {
  list() {
    return client.get<{ results?: unknown[] }>('/users/seller/documents/')
  },
  upload(formData: FormData) {
    return client.post('/users/seller/documents/', formData)
  },
}

/** Admin seller management. API.md: GET /users/admin/sellers/ with kyc_status. */
export const sellersAdminApi = {
  list(params?: { kyc_status?: string; page?: number; page_size?: number }) {
    return client.get('/users/admin/sellers/', { params })
  },
  get(sellerPk: number) {
    return client.get(`/users/admin/sellers/${sellerPk}/`)
  },
  approve(sellerPk: number) {
    return client.post(`/users/admin/sellers/${sellerPk}/approve/`)
  },
  reject(sellerPk: number, reason?: string) {
    return client.post(`/users/admin/sellers/${sellerPk}/reject/`, reason != null ? { reason } : undefined)
  },
}
