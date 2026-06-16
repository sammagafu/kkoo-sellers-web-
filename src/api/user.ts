/**
 * User endpoints (auth required). API.md: GET/PUT /users/me/, currency, buyer/seller profile.
 */
import client from './client'

export const userApi = {
  getMe() {
    return client.get('/users/me/')
  },
  updateMe(data: { email?: string; first_name?: string; last_name?: string; language_preference?: string; date_of_birth?: string }) {
    return client.put('/users/me/', data)
  },
  getBuyerProfile() {
    return client.get('/users/buyer/profile/')
  },
  getSellerProfile() {
    return client.get('/users/seller/profile/')
  },
  /** GET /users/seller/profile/details/ — profile_groups, KYC required/missing, kyc_complete, documents. For onboarding/completion. */
  getSellerProfileDetails() {
    return client.get<{
      profile?: Record<string, unknown>
      profile_groups?: Record<string, unknown>
      kyc_complete?: boolean
      documents?: unknown[]
      required_profile_fields?: string[]
      missing_profile_fields?: string[]
      required_document_types?: string[]
      missing_document_types?: string[]
    }>('/users/seller/profile/details/')
  },
  putSellerProfile(data: Record<string, unknown>) {
    return client.put('/users/seller/profile/', data)
  },
  /** Upload seller profile logo (multipart). API.md: POST /users/seller/profile/logo/ — field name `logo`. Returns { logo_url, message }. */
  uploadSellerProfileLogo(formData: FormData) {
    return client.post<{ logo_url?: string; message?: string }>('/users/seller/profile/logo/', formData)
  },
  getCurrency() {
    return client.get<{ currency_code: string }>('/users/me/currency/')
  },
  putCurrency(currency_code: string) {
    return client.put<{ currency_code: string }>('/users/me/currency/', { currency_code })
  },
  /** GET /users/me/backup-codes/ — unused/consumed counts; plaintext codes are never listed. */
  getBackupCodesStatus() {
    return client.get<{
      unused_count?: number
      consumed_count?: number
      available?: boolean
      note?: string
    }>('/users/me/backup-codes/')
  },
  /** POST /users/me/backup-codes/regenerate/ — returns new codes once; invalidates prior unused codes. */
  regenerateBackupCodes() {
    return client.post<{ backup_codes?: string[]; backup_codes_message?: string }>('/users/me/backup-codes/regenerate/')
  },
  /** POST /users/me/avatar/ — multipart field `avatar`. */
  uploadAvatar(formData: FormData) {
    return client.post<{ avatar_url?: string; avatar?: string; user?: Record<string, unknown>; message?: string }>(
      '/users/me/avatar/',
      formData,
    )
  },
}
