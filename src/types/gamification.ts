export interface UserXP {
  id: number
  user_id: number
  total_xp: number
  level: number
  level_name: string
  created_at: string
  updated_at: string
}

export interface XPEvent {
  id: number
  user_id: number
  event_type: string
  xp_awarded: number
  reference_id?: number
  note?: string
  created_at: string
}

export interface UserStreak {
  id: number
  user_id: number
  current_streak: number
  longest_streak: number
  total_active_days: number
  last_activity_date: string // YYYY-MM-DD
  streak_freeze_available_at?: string
  streak_freeze_used: boolean
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: number
  code: string
  title: string
  description?: string
  icon_url?: string
  category: 'orders' | 'social' | 'exploration' | 'loyalty' | 'milestone'
  xp_reward: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface UserAchievement {
  id: number
  user_id: number
  achievement_id: number
  achievement_code: string
  earned_at: string
}

export interface ScratchCard {
  id: number
  user_id: number
  order_id?: number
  reward_type: 'discount_percent' | 'free_delivery' | 'wallet_credit' | 'xp' | 'nothing'
  reward_value: number
  code?: string
  is_scratched: boolean
  scratched_at?: string
  expires_at: string
  is_used: boolean
  used_at?: string
  created_at: string
}

export interface GameLeaderboardEntry {
  rank: number
  user_id: number
  display_name: string
  total_xp: number
  level_name: string
}

// Response wrappers
export interface Streak extends UserStreak {}
