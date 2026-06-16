import client from './client'

/** API.md: POST /users/register/ → { user, tokens: { access, refresh }, message } */
export type RegisterBody = {
  phone_number: string
  first_name: string
  last_name: string
  is_buyer?: boolean
}

/** API.md: OTP verify returns { user, tokens: { access, refresh } } */
export type LoginResponse = {
  user?: unknown
  access?: string
  refresh?: string
  tokens?: { access: string; refresh: string }
}

export const authApi = {
  /** POST /users/register/ – phone_number, first_name, last_name, optional is_buyer (panel is OTP-only; no password). */
  register(data: RegisterBody) {
    return client.post<{ user: unknown; tokens: { access: string; refresh: string }; message?: string }>('/users/register/', data)
  },
  /** POST /users/token/refresh/ – body: { refresh } */
  refresh(refreshToken: string) {
    return client.post<{ access: string; refresh?: string }>('/users/token/refresh/', { refresh: refreshToken })
  },
  /** POST /users/otp/request/ – phone_number; also_push can deliver code in-app when user exists (fewer SMS). */
  requestOtp(
    phone_number: string,
    options?: { country_code?: string; channel?: 'sms'; also_push?: boolean; app_key?: string },
  ) {
    const body: {
      phone_number: string
      country_code?: string
      channel?: string
      also_push?: boolean
      app_key?: string
    } = { phone_number }
    if (options?.country_code) body.country_code = options.country_code
    if (options?.channel) body.channel = options.channel
    if (options?.also_push) {
      body.also_push = true
      body.app_key = options.app_key ?? 'admin_panel'
    }
    return client.post<{
      message?: string
      debug_otp?: string
      skipped_resend?: boolean
      cooldown_seconds?: number
    }>('/users/otp/request/', body)
  },
  /** POST /users/otp/verify/ – phone_number, otp_code → { user, tokens } */
  verifyOtp(phone_number: string, otp_code: string) {
    return client.post<LoginResponse>('/users/otp/verify/', { phone_number, otp_code })
  },
  /** Legacy OTP paths (CUTOVER.md). Backend aliases: POST /users/auth/otp-request/, auth/otp-verify/ */
  requestOtpLegacy(phone_number: string, country_code?: string, channel?: 'sms') {
    const body: { phone_number: string; country_code?: string; channel?: string } = { phone_number }
    if (country_code) body.country_code = country_code
    if (channel) body.channel = channel
    return client.post<{ message?: string; debug_otp?: string }>('/users/auth/otp-request/', body)
  },
  verifyOtpLegacy(phone_number: string, otp_code: string) {
    return client.post<LoginResponse>('/users/auth/otp-verify/', { phone_number, otp_code })
  },
  /** POST /users/logout/ – invalidate access token (from header); optional body { refresh } to revoke refresh token too. */
  logout(body?: { refresh?: string }) {
    return client.post<{ message?: string }>('/users/logout/', body ?? {})
  },
  getMe() {
    return client.get('/users/me/')
  },
  getSellerProfile() {
    return client.get('/users/seller/profile/')
  },
  updateSellerProfile(data: Record<string, unknown>) {
    return client.put('/users/seller/profile/', data)
  },
  patchSellerStorefrontTheme(storefront_theme: Record<string, unknown> | null) {
    return client.patch('/users/seller/profile/storefront-theme/', { storefront_theme })
  },
  /** Register as seller: same as register with is_buyer: false or omitted. OTP-only — no password field. */
  registerSeller(data: { phone_number: string; first_name?: string; last_name?: string; email?: string }) {
    const payload = {
      phone_number: data.phone_number,
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      is_buyer: false as const,
    }
    return client.post<{ user: unknown; tokens: { access: string; refresh: string }; message?: string }>('/users/register/', payload)
  },
  /** Register as buyer/customer. OTP-only — sign in with SMS code after registration. */
  registerBuyer(data: { phone_number: string; first_name?: string; last_name?: string }) {
    const payload: Record<string, unknown> = {
      phone_number: data.phone_number,
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      is_buyer: true,
    }
    return client.post<{ user: unknown; tokens: { access: string; refresh: string }; message?: string }>('/users/register/', payload)
  },
}
