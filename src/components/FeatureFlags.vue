<template>
  <div class="feature-flags card border-0 shadow-sm h-100">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p class="text-uppercase text-muted small fw-semibold mb-2">Feature Flags</p>
          <h3 class="h5 mb-1">Control rollout without leaving the admin desk</h3>
          <p class="text-muted mb-0">Turn premium programs on or off, then tune rollout percentages for the experiments we are actively learning from.</p>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6" v-for="flag in flagItems" :key="flag.key">
          <label class="flag-card h-100">
            <span>
              <span class="flag-card__title">{{ flag.title }}</span>
              <span class="flag-card__copy">{{ flag.copy }}</span>
            </span>
            <input v-model="featureFlags[flag.key]" class="form-check-input mt-1" type="checkbox" />
          </label>
        </div>
      </div>

      <div>
        <p class="text-uppercase text-muted small fw-semibold mb-3">Experiments</p>
        <div class="row g-3" v-for="experiment in experimentItems" :key="experiment.toggleKey">
          <div class="col-lg-4">
            <label class="flag-card">
              <span>
                <span class="flag-card__title">{{ experiment.title }}</span>
                <span class="flag-card__copy">{{ experiment.copy }}</span>
              </span>
              <input v-model="experiments[experiment.toggleKey]" class="form-check-input mt-1" type="checkbox" />
            </label>
          </div>
          <div class="col-lg-8">
            <label class="form-label text-muted small mb-1">Rollout percent</label>
            <div class="d-flex align-items-center gap-3">
              <input
                v-model.number="experiments[experiment.percentKey]"
                class="form-range"
                type="range"
                min="0"
                max="100"
              />
              <span class="rollout-pill">{{ experiments[experiment.percentKey] }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PremiumExperimentsConfig, PremiumFeatureFlags } from '@/types/premium'

type FeatureFlagKey = keyof PremiumFeatureFlags
type ExperimentToggleKey = 'buyer_upsell_enabled' | 'rider_premier_enabled' | 'seller_elite_enabled'
type ExperimentPercentKey =
  | 'buyer_upsell_rollout_percent'
  | 'rider_premier_rollout_percent'
  | 'seller_elite_rollout_percent'

defineProps<{
  featureFlags: PremiumFeatureFlags
  experiments: PremiumExperimentsConfig
}>()

const flagItems: Array<{ key: FeatureFlagKey; title: string; copy: string }> = [
  { key: 'buyer_membership', title: 'Buyer membership', copy: 'Controls premium tiers, upgrades, and buyer-only perks.' },
  { key: 'rider_premier', title: 'Rider premier', copy: 'Controls premier enrollment and rider reward messaging.' },
  { key: 'seller_elite', title: 'Seller elite', copy: 'Controls elite enrollment and premium seller access.' },
  { key: 'priority_support', title: 'Priority support', copy: 'Enables fast-track support promises across premium programs.' },
  { key: 'premium_analytics', title: 'Premium analytics', copy: 'Unlocks premium-only reporting and operator insights.' },
]

const experimentItems: Array<{
  toggleKey: ExperimentToggleKey
  percentKey: ExperimentPercentKey
  title: string
  copy: string
}> = [
  {
    toggleKey: 'buyer_upsell_enabled',
    percentKey: 'buyer_upsell_rollout_percent',
    title: 'Buyer upsell prompts',
    copy: 'Test premium upgrade prompts in buyer journeys.',
  },
  {
    toggleKey: 'rider_premier_enabled',
    percentKey: 'rider_premier_rollout_percent',
    title: 'Premier rider rollout',
    copy: 'Control how widely premier messaging and perks are shown to riders.',
  },
  {
    toggleKey: 'seller_elite_enabled',
    percentKey: 'seller_elite_rollout_percent',
    title: 'Seller elite rollout',
    copy: 'Gradually expand elite tooling and messaging for businesses.',
  },
]
</script>

<style scoped lang="scss">
.feature-flags {
  background: linear-gradient(180deg, var(--kkoo-panel-bg) 0%, var(--kkoo-panel-muted) 100%);
}

.flag-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1rem 0.95rem;
  border: 1px solid var(--kkoo-panel-border);
  border-radius: 1rem;
  background: var(--kkoo-panel-bg);
}

.flag-card__title {
  display: block;
  color: var(--kkoo-panel-ink);
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.flag-card__copy {
  display: block;
  color: var(--kkoo-panel-sub);
  font-size: 0.925rem;
  line-height: 1.55;
}

.rollout-pill {
  min-width: 4.25rem;
  text-align: center;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: var(--kkoo-accent-tint);
  color: #9a6700;
  font-weight: 700;
}
</style>
