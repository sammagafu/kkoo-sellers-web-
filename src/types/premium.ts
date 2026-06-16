export interface PremiumTierConfig {
  price: number
  discount: number
  free_deliveries: number
  priority_support: boolean
}

export interface PremiumBenefitsToggle {
  dedicated_manager: boolean
  instant_payouts?: boolean
  insurance?: boolean
  loans?: boolean
  marketing?: boolean
  training?: boolean
  priority_support?: boolean
}

export interface PremiumNotificationsConfig {
  upgrades: boolean
  renewals: boolean
  benefits: boolean
}

export interface PremiumFeatureFlags {
  buyer_membership: boolean
  rider_premier: boolean
  seller_elite: boolean
  priority_support: boolean
  premium_analytics: boolean
}

export interface PremiumExperimentsConfig {
  buyer_upsell_enabled: boolean
  buyer_upsell_rollout_percent: number
  rider_premier_enabled: boolean
  rider_premier_rollout_percent: number
  seller_elite_enabled: boolean
  seller_elite_rollout_percent: number
}

export interface PremiumAdminSettings {
  buyers: {
    standard: PremiumTierConfig
    gold: PremiumTierConfig
    platinum: PremiumTierConfig
  }
  riders: {
    min_deliveries: number
    min_rating: number
    base_bonus: number
    tier_bonus: number
    referral_bonus: number
    benefits: PremiumBenefitsToggle
  }
  sellers: {
    min_revenue: number
    min_rating: number
    min_fulfillment: number
    standard_commission: number
    elite_commission: number
    benefits: PremiumBenefitsToggle
  }
  global: {
    enrollment_enabled: boolean
    trial_period: number
    auto_renewal: boolean
    notifications: PremiumNotificationsConfig
    penetration_target: number
    growth_target: number
  }
  feature_flags: PremiumFeatureFlags
  experiments: PremiumExperimentsConfig
  updated_at?: string
  updated_by_user_id?: number | null
}

export interface PremiumMembershipUser {
  id: number
  phone_number: string
  first_name?: string
  last_name?: string
  display_name: string
}

export interface PremiumMembership {
  id: number
  user_id: number
  program: string
  tier: string
  status: string
  source: string
  started_at?: string | null
  trial_ends_at?: string | null
  renews_at?: string | null
  last_billed_at?: string | null
  cancelled_at?: string | null
  benefit_snapshot?: Record<string, unknown> | string | null
  qualification?: Record<string, unknown> | string | null
  notes?: string
  updated_at: string
  user?: PremiumMembershipUser
  program_label?: string
}

export interface PremiumProgramStatusBreakdown {
  active: number
  trial: number
  pending_review: number
  cancelled: number
}

export interface PremiumAdminMetrics {
  summary: {
    total_active_members: number
    pending_reviews: number
    monthly_recurring_revenue: number
    penetration_rate_percent: number
    penetration_target_percent: number
    growth_target_percent: number
  }
  by_program: {
    buyer: PremiumProgramStatusBreakdown
    rider: PremiumProgramStatusBreakdown
    seller: PremiumProgramStatusBreakdown
  }
  rollout: {
    buyer_upsell_percent: number
    rider_premier_percent: number
    seller_elite_percent: number
  }
  recent_activity: PremiumMembership[]
}

export function createDefaultPremiumAdminSettings(): PremiumAdminSettings {
  return {
    buyers: {
      standard: { price: 0, discount: 5, free_deliveries: 0, priority_support: false },
      gold: { price: 14990, discount: 15, free_deliveries: 3, priority_support: false },
      platinum: { price: 24990, discount: 25, free_deliveries: 8, priority_support: true },
    },
    riders: {
      min_deliveries: 1000,
      min_rating: 4.9,
      base_bonus: 25,
      tier_bonus: 10,
      referral_bonus: 10000,
      benefits: {
        dedicated_manager: true,
        instant_payouts: true,
        insurance: true,
        loans: true,
      },
    },
    sellers: {
      min_revenue: 1500000,
      min_rating: 4.8,
      min_fulfillment: 98,
      standard_commission: 2,
      elite_commission: 1,
      benefits: {
        dedicated_manager: true,
        marketing: true,
        training: true,
        priority_support: true,
      },
    },
    global: {
      enrollment_enabled: true,
      trial_period: 7,
      auto_renewal: true,
      notifications: {
        upgrades: true,
        renewals: true,
        benefits: true,
      },
      penetration_target: 8,
      growth_target: 35,
    },
    feature_flags: {
      buyer_membership: true,
      rider_premier: true,
      seller_elite: true,
      priority_support: true,
      premium_analytics: true,
    },
    experiments: {
      buyer_upsell_enabled: true,
      buyer_upsell_rollout_percent: 100,
      rider_premier_enabled: true,
      rider_premier_rollout_percent: 100,
      seller_elite_enabled: true,
      seller_elite_rollout_percent: 100,
    },
    updated_at: '',
    updated_by_user_id: null,
  }
}
