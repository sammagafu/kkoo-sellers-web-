export interface InviteChallenge {
  id: number
  title: string
  description?: string
  start_at: string
  end_at: string
  target_count: number
  reward_type: 'wallet_credit' | 'xp' | 'discount_code'
  reward_value: number
  is_active: boolean
  created_by_id: number
  created_at: string
  updated_at: string
}

export interface UserChallengeProgress {
  id: number
  user_id: number
  invite_challenge_id: number
  challenge: InviteChallenge
  invites_completed: number
  reward_claimed: boolean
  reward_claimed_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}
