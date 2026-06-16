/**
 * Referral & rewards – referral part (auth). API.md: code, apply, stats.
 */
import client from './client'

export const referralApi = {
  getCode() {
    return client.get<{ code: string }>('/users/referral/code/')
  },
  apply(code: string) {
    return client.post<{ message?: string }>('/users/referral/apply/', { code })
  },
  getStats() {
    return client.get<{
      total_referrals?: number
      completed_referrals?: number
      rewarded_referrals?: number
      total_earnings?: number
    }>('/users/referral/stats/')
  },
}
