import client from './client'

/** Gift voucher row from GET /users/gift-vouchers/ (kkoo-fiber models.GiftVoucher). */
export type GiftVoucherRow = {
  id?: number
  code?: string
  amount?: number
  currency_code?: string
  issued_by_user_id?: number
  recipient_user_id?: number | null
  recipient_email?: string
  message?: string
  status?: string
  expires_at?: string
  redeemed_at?: string | null
  redeemed_by_user_id?: number | null
  order_id?: number | null
  created_at?: string
}

export type GiftVoucherCreateResponse = {
  id?: number
  code?: string
  amount?: number
  currency_code?: string
  expires_at?: string
  message?: string
  share_url?: string
  share_text?: string
}

/** Payload for PATCH /users/admin/rewards/settings/ */
export interface RewardSettingsPayload {
  referrer_bonus?: number
  referred_bonus?: number
  purchase_reward_rate?: number
  purchase_reward_base_percent?: number
  purchase_reward_cap_per_order?: number
  max_purchase_reward_percent?: number
  min_redemption_points?: number
  points_to_cash_rate?: number
  points_expire_days?: number
  is_active?: boolean
}

export interface RewardRuleRow {
  id?: number
  vertical?: 'ride' | 'food' | 'hotel' | string
  earn_rate_percent?: number
  earn_cap_points?: number
  redeem_cap_percent?: number
  min_basket_amount?: number
  eligible_on_fees?: boolean
  eligible_on_promos?: boolean
  is_active?: boolean
}

export interface RewardRulesResponse {
  results?: RewardRuleRow[]
}

export interface RewardRulesPayload {
  rules: RewardRuleRow[]
}

export interface RewardQuotePayload {
  vertical: 'ride' | 'food' | 'hotel' | string
  subtotal: number
  fees?: number
  desired_points?: number
}

/** Admin: reward settings and referral stats (backend-specific). */
export const rewardsAdminApi = {
  getSettings() {
    return client.get('/users/admin/rewards/settings/')
  },
  /** API.md: PUT /users/admin/rewards/settings/ with partial RewardSettings fields. */
  updateSettings(data: RewardSettingsPayload) {
    return client.put('/users/admin/rewards/settings/', data)
  },
  getRules() {
    return client.get<RewardRulesResponse>('/users/admin/rewards/rules/')
  },
  updateRules(data: RewardRulesPayload) {
    return client.put<RewardRulesResponse>('/users/admin/rewards/rules/', data)
  },
  getReferralStats() {
    return client.get('/users/admin/referrals/stats/')
  },
}

/** User rewards (auth). API.md: balance, offers, redemption-options, transactions, redemptions. */
export const rewardsUserApi = {
  getBalance() {
    return client.get<{ total_balance?: number; available_balance?: number }>('/users/rewards/balance/')
  },
  getOffers() {
    return client.get('/users/rewards/offers/')
  },
  getRedemptionOptions() {
    return client.get<{ min_redemption_points?: number; points_to_cash_rate?: number }>('/users/rewards/redemption-options/')
  },
  getRules() {
    return client.get<{
      settings?: { min_redemption_points?: number; points_to_cash_rate?: number; is_active?: boolean }
      rules?: RewardRuleRow[]
    }>('/users/rewards/rules/')
  },
  quoteRedemption(data: RewardQuotePayload) {
    return client.post('/users/rewards/quote-redemption/', data)
  },
  getTransactions(params?: { page?: number; page_size?: number }) {
    return client.get('/users/rewards/transactions/', { params })
  },
  getRedemptions(params?: { page?: number; page_size?: number }) {
    return client.get('/users/rewards/redemptions/', { params })
  },
  getRedemption(id: number | string) {
    return client.get(`/users/rewards/redemptions/${id}/`)
  },
  createRedemption(data: Record<string, unknown>) {
    return client.post('/users/rewards/redemptions/', data)
  },
  cancelRedemption(id: number | string) {
    return client.post<{ message?: string }>(`/users/rewards/redemptions/${id}/cancel/`)
  },
  /** Gift vouchers (API.md). GET /users/gift-vouchers/?type=issued|received|all */
  getGiftVouchers(params?: { type?: 'issued' | 'received' | 'all' }) {
    return client.get<{ results: GiftVoucherRow[] }>('/users/gift-vouchers/', { params })
  },
  createGiftVoucher(data: {
    amount: number
    currency_code: string
    recipient_user_id?: number
    recipient_email?: string
    message?: string
    expires_in_days?: number
  }) {
    return client.post<GiftVoucherCreateResponse>('/users/gift-vouchers/', data)
  },
  validateGiftVoucher(code: string, order_amount: number) {
    return client.get<{ valid?: boolean; code?: string; amount?: number; discount_amount?: number; expires_at?: string }>(
      '/users/gift-vouchers/validate/',
      { params: { code, order_amount } }
    )
  },
}
