<template>
  <div class="premium-config-panel">
    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3 mb-4">
      <div>
        <p class="text-uppercase text-muted small fw-semibold mb-2">Phase 4</p>
        <h2 class="h3 mb-2">Premium programs that match how the platform actually runs</h2>
        <p class="text-muted mb-0 premium-config-panel__intro">
          Set buyer membership tiers, control rider and seller qualification rules, and watch how premium adoption is moving in one place.
        </p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-outline-secondary" type="button" :disabled="loading || saving" @click="refreshAll">
          Refresh
        </button>
        <button class="btn btn-primary" type="button" :disabled="saving || loading" @click="save">
          {{ saving ? 'Saving…' : 'Save premium settings' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="loading" class="premium-config-panel__loading">
      <div class="spinner-border text-primary" role="status" aria-hidden="true" />
      <span>Loading premium programs…</span>
    </div>

    <template v-else>
      <PremiumMetrics :metrics="metrics" class="mb-4" />

      <div class="row g-4">
        <div class="col-12">
          <FeatureFlags
            :feature-flags="settings.feature_flags"
            :experiments="settings.experiments"
          />
        </div>

        <div class="col-xl-7">
          <form class="d-grid gap-4" @submit.prevent="save">
            <section class="settings-card">
              <div class="settings-card__header">
                <div>
                  <p class="settings-card__eyebrow">Buyer premium</p>
                  <h3 class="settings-card__title">Membership tiers and billing rules</h3>
                </div>
                <span class="settings-card__badge">Trial {{ settings.global.trial_period }} days</span>
              </div>

              <div class="row g-3">
                <div class="col-12 col-lg-4" v-for="tier in buyerTierCards" :key="tier.key">
                  <div class="tier-card">
                    <p class="tier-card__title">{{ tier.label }}</p>
                    <div class="mb-3">
                      <label class="form-label">Monthly price (TZS)</label>
                      <input v-model.number="tier.model.price" class="form-control" type="number" min="0" />
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Order discount (%)</label>
                      <input v-model.number="tier.model.discount" class="form-control" type="number" min="0" max="100" />
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Free deliveries / month</label>
                      <input v-model.number="tier.model.free_deliveries" class="form-control" type="number" min="0" />
                    </div>
                    <div class="form-check form-switch">
                      <input
                        :id="`priority-${tier.key}`"
                        v-model="tier.model.priority_support"
                        class="form-check-input"
                        type="checkbox"
                      />
                      <label class="form-check-label" :for="`priority-${tier.key}`">Priority support</label>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section class="settings-card">
              <div class="settings-card__header">
                <div>
                  <p class="settings-card__eyebrow">Rider premier</p>
                  <h3 class="settings-card__title">Qualification rules and earnings uplift</h3>
                </div>
                <span class="settings-card__badge">Rollout {{ settings.experiments.rider_premier_rollout_percent }}%</span>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Minimum deliveries</label>
                  <input v-model.number="settings.riders.min_deliveries" class="form-control" type="number" min="0" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Minimum rating</label>
                  <input v-model.number="settings.riders.min_rating" class="form-control" type="number" min="0" max="5" step="0.1" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Base bonus (%)</label>
                  <input v-model.number="settings.riders.base_bonus" class="form-control" type="number" min="0" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Tier bonus (%)</label>
                  <input v-model.number="settings.riders.tier_bonus" class="form-control" type="number" min="0" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Referral bonus (TZS)</label>
                  <input v-model.number="settings.riders.referral_bonus" class="form-control" type="number" min="0" />
                </div>
              </div>

              <div class="toggle-grid mt-3">
                <label v-for="item in riderBenefitItems" :key="item.key" class="toggle-card">
                  <span>
                    <span class="toggle-card__title">{{ item.label }}</span>
                    <span class="toggle-card__copy">{{ item.copy }}</span>
                  </span>
                  <input v-model="settings.riders.benefits[item.key]" class="form-check-input mt-1" type="checkbox" />
                </label>
              </div>
            </section>

            <section class="settings-card">
              <div class="settings-card__header">
                <div>
                  <p class="settings-card__eyebrow">Seller elite</p>
                  <h3 class="settings-card__title">Business thresholds and premium tooling</h3>
                </div>
                <span class="settings-card__badge">Savings {{ commissionSavings }}%</span>
              </div>

              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Minimum monthly revenue (TZS)</label>
                  <input v-model.number="settings.sellers.min_revenue" class="form-control" type="number" min="0" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Minimum rating</label>
                  <input v-model.number="settings.sellers.min_rating" class="form-control" type="number" min="0" max="5" step="0.1" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Minimum fulfillment (%)</label>
                  <input v-model.number="settings.sellers.min_fulfillment" class="form-control" type="number" min="0" max="100" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Standard commission (%)</label>
                  <input v-model.number="settings.sellers.standard_commission" class="form-control" type="number" min="0" max="100" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Elite commission (%)</label>
                  <input v-model.number="settings.sellers.elite_commission" class="form-control" type="number" min="0" max="100" />
                </div>
              </div>

              <div class="toggle-grid mt-3">
                <label v-for="item in sellerBenefitItems" :key="item.key" class="toggle-card">
                  <span>
                    <span class="toggle-card__title">{{ item.label }}</span>
                    <span class="toggle-card__copy">{{ item.copy }}</span>
                  </span>
                  <input v-model="settings.sellers.benefits[item.key]" class="form-check-input mt-1" type="checkbox" />
                </label>
              </div>
            </section>

            <section class="settings-card">
              <div class="settings-card__header">
                <div>
                  <p class="settings-card__eyebrow">Global policy</p>
                  <h3 class="settings-card__title">Enrollment, renewal, and operating targets</h3>
                </div>
                <span class="settings-card__badge">{{ formatPercent(metrics.summary.penetration_rate_percent) }} live penetration</span>
              </div>

              <div class="row g-3">
                <div class="col-md-4">
                  <div class="form-check form-switch mt-4">
                    <input id="enrollment-enabled" v-model="settings.global.enrollment_enabled" class="form-check-input" type="checkbox" />
                    <label class="form-check-label" for="enrollment-enabled">Enrollment enabled</label>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-check form-switch mt-4">
                    <input id="auto-renewal" v-model="settings.global.auto_renewal" class="form-check-input" type="checkbox" />
                    <label class="form-check-label" for="auto-renewal">Auto-renewal enabled</label>
                  </div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Trial period (days)</label>
                  <input v-model.number="settings.global.trial_period" class="form-control" type="number" min="0" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Penetration target (%)</label>
                  <input v-model.number="settings.global.penetration_target" class="form-control" type="number" min="0" max="100" step="0.1" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Growth target (%)</label>
                  <input v-model.number="settings.global.growth_target" class="form-control" type="number" min="0" max="100" step="0.1" />
                </div>
              </div>

              <div class="toggle-grid mt-3 toggle-grid--compact">
                <label class="toggle-card">
                  <span>
                    <span class="toggle-card__title">Upgrade notifications</span>
                    <span class="toggle-card__copy">Tell users when premium access changes.</span>
                  </span>
                  <input v-model="settings.global.notifications.upgrades" class="form-check-input mt-1" type="checkbox" />
                </label>
                <label class="toggle-card">
                  <span>
                    <span class="toggle-card__title">Renewal reminders</span>
                    <span class="toggle-card__copy">Send reminders before renewals land.</span>
                  </span>
                  <input v-model="settings.global.notifications.renewals" class="form-check-input mt-1" type="checkbox" />
                </label>
                <label class="toggle-card">
                  <span>
                    <span class="toggle-card__title">Benefit updates</span>
                    <span class="toggle-card__copy">Communicate benefit changes clearly.</span>
                  </span>
                  <input v-model="settings.global.notifications.benefits" class="form-check-input mt-1" type="checkbox" />
                </label>
              </div>
            </section>

            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <p class="text-muted small mb-0">
                Last updated {{ formatDate(settings.updated_at) }}
                <span v-if="settings.updated_by_user_id">· by user {{ settings.updated_by_user_id }}</span>
              </p>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary" type="button" :disabled="saving" @click="loadSettings">
                  Reset form
                </button>
                <button class="btn btn-primary" type="submit" :disabled="saving">
                  {{ saving ? 'Saving…' : 'Save changes' }}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div class="col-xl-5">
          <section class="settings-card h-100">
            <div class="settings-card__header mb-3">
              <div>
                <p class="settings-card__eyebrow">Premium members</p>
                <h3 class="settings-card__title">Who is active, pending, or ready for follow-up</h3>
              </div>
              <span class="settings-card__badge">{{ memberships.length }} records</span>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-5">
                <label class="form-label">Program</label>
                <select v-model="filters.program" class="form-select">
                  <option value="">All programs</option>
                  <option value="buyer">Buyer membership</option>
                  <option value="rider">Rider premier</option>
                  <option value="seller">Seller elite</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Status</label>
                <select v-model="filters.status" class="form-select">
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="pending_review">Pending review</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div class="col-md-3 d-grid">
                <label class="form-label opacity-0">Apply</label>
                <button class="btn btn-outline-secondary" type="button" @click="applyMembershipFilters">Apply</button>
              </div>
              <div class="col-12">
                <label class="form-label">Search</label>
                <input
                  v-model.trim="filters.q"
                  class="form-control"
                  type="search"
                  placeholder="Search by name or phone"
                  @keyup.enter="applyMembershipFilters"
                />
              </div>
            </div>

            <div class="membership-list">
              <article v-for="membership in memberships" :key="membership.id" class="membership-card">
                <div class="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <p class="membership-card__name mb-1">{{ membership.user?.display_name || `User ${membership.user_id}` }}</p>
                    <p class="membership-card__meta mb-0">
                      {{ membership.program_label || titleCase(membership.program) }} · {{ titleCase(membership.tier) }}
                    </p>
                  </div>
                  <span class="membership-status" :class="`membership-status--${membership.status}`">
                    {{ titleCase(membership.status.replace('_', ' ')) }}
                  </span>
                </div>

                <div class="membership-card__details">
                  <span>{{ membership.user?.phone_number || 'No phone' }}</span>
                  <span v-if="membership.started_at">Started {{ formatDate(membership.started_at) }}</span>
                  <span v-if="membership.renews_at">Renews {{ formatDate(membership.renews_at) }}</span>
                </div>

                <p v-if="membership.notes" class="membership-card__notes mb-0">{{ membership.notes }}</p>
              </article>

              <div v-if="memberships.length === 0" class="membership-empty">
                No premium memberships match the current filters.
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { premiumAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import FeatureFlags from './FeatureFlags.vue'
import PremiumMetrics from './PremiumMetrics.vue'
import {
  createDefaultPremiumAdminSettings,
  type PremiumAdminMetrics,
  type PremiumAdminSettings,
  type PremiumMembership,
  type PremiumTierConfig,
} from '@/types/premium'

const settings = reactive<PremiumAdminSettings>(createDefaultPremiumAdminSettings())
const metrics = ref<PremiumAdminMetrics>(createEmptyMetrics())
const memberships = ref<PremiumMembership[]>([])

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')

const filters = reactive({
  program: '',
  status: '',
  q: '',
})

const buyerTierCards = computed<Array<{ key: 'standard' | 'gold' | 'platinum'; label: string; model: PremiumTierConfig }>>(() => [
  { key: 'standard', label: 'Standard', model: settings.buyers.standard },
  { key: 'gold', label: 'Gold', model: settings.buyers.gold },
  { key: 'platinum', label: 'Platinum', model: settings.buyers.platinum },
])

const riderBenefitItems = [
  { key: 'dedicated_manager' as const, label: 'Dedicated manager', copy: 'Assign a human owner for top performers.' },
  { key: 'instant_payouts' as const, label: 'Instant payouts', copy: 'Unlock faster access to earned payouts.' },
  { key: 'insurance' as const, label: 'Premium insurance', copy: 'Add stronger cover for active premier riders.' },
  { key: 'loans' as const, label: 'Loan eligibility', copy: 'Open financing access for trusted riders.' },
]

const sellerBenefitItems = [
  { key: 'dedicated_manager' as const, label: 'Dedicated manager', copy: 'Give elite sellers one accountable growth contact.' },
  { key: 'marketing' as const, label: 'Marketing support', copy: 'Fund campaigns that unlock more demand.' },
  { key: 'training' as const, label: 'Training programs', copy: 'Help operators tighten quality and execution.' },
  { key: 'priority_support' as const, label: 'Priority support', copy: 'Fast-track operational blockers and urgent issues.' },
]

const commissionSavings = computed(() => Math.max(0, settings.sellers.standard_commission - settings.sellers.elite_commission))

function createEmptyMetrics(): PremiumAdminMetrics {
  return {
    summary: {
      total_active_members: 0,
      pending_reviews: 0,
      monthly_recurring_revenue: 0,
      penetration_rate_percent: 0,
      penetration_target_percent: 0,
      growth_target_percent: 0,
    },
    by_program: {
      buyer: { active: 0, trial: 0, pending_review: 0, cancelled: 0 },
      rider: { active: 0, trial: 0, pending_review: 0, cancelled: 0 },
      seller: { active: 0, trial: 0, pending_review: 0, cancelled: 0 },
    },
    rollout: {
      buyer_upsell_percent: 0,
      rider_premier_percent: 0,
      seller_elite_percent: 0,
    },
    recent_activity: [],
  }
}

function applySettings(target: PremiumAdminSettings, source: PremiumAdminSettings) {
  Object.assign(target.buyers.standard, source.buyers.standard)
  Object.assign(target.buyers.gold, source.buyers.gold)
  Object.assign(target.buyers.platinum, source.buyers.platinum)
  Object.assign(target.riders, source.riders)
  Object.assign(target.riders.benefits, source.riders.benefits)
  Object.assign(target.sellers, source.sellers)
  Object.assign(target.sellers.benefits, source.sellers.benefits)
  Object.assign(target.global, source.global)
  Object.assign(target.global.notifications, source.global.notifications)
  Object.assign(target.feature_flags, source.feature_flags)
  Object.assign(target.experiments, source.experiments)
  target.updated_at = source.updated_at
  target.updated_by_user_id = source.updated_by_user_id
}

function formatDate(value?: string | null) {
  if (!value) return 'just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function titleCase(value: string) {
  return value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function loadSettings() {
  try {
    const { data } = await premiumAdminApi.getSettings()
    applySettings(settings, data)
  } catch (e: unknown) {
    throw new Error(formatApiError(e, 'Failed to load premium settings'))
  }
}

async function loadMetrics() {
  try {
    const { data } = await premiumAdminApi.getMetrics()
    metrics.value = data
  } catch (e: unknown) {
    throw new Error(formatApiError(e, 'Failed to load premium metrics'))
  }
}

async function loadMemberships() {
  try {
    const { data } = await premiumAdminApi.getMemberships({
      program: filters.program || undefined,
      status: filters.status || undefined,
      q: filters.q || undefined,
    })
    memberships.value = data.results ?? []
  } catch (e: unknown) {
    throw new Error(formatApiError(e, 'Failed to load premium memberships'))
  }
}

async function applyMembershipFilters() {
  error.value = ''
  try {
    await loadMemberships()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load premium memberships'
  }
}

async function refreshAll() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await Promise.all([loadSettings(), loadMetrics(), loadMemberships()])
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to refresh premium configuration'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await premiumAdminApi.updateSettings(settings)
    applySettings(settings, data)
    success.value = 'Premium settings saved. The premium experience now follows the updated rollout and qualification rules.'
    await Promise.all([loadMetrics(), loadMemberships()])
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to save premium settings')
  } finally {
    saving.value = false
  }
}

onMounted(refreshAll)
</script>

<style scoped lang="scss">
.premium-config-panel__intro {
  max-width: 56rem;
  line-height: 1.7;
}

.premium-config-panel__loading {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: #475569;
}

.settings-card {
  padding: 1.35rem;
  border-radius: 1.25rem;
  border: 1px solid #e8eaf2;
  background: linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
}

.settings-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.settings-card__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.settings-card__title {
  font-size: 1.1rem;
  color: #14213d;
  margin: 0;
}

.settings-card__badge {
  padding: 0.42rem 0.72rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.tier-card,
.membership-card,
.toggle-card {
  border: 1px solid #edf2f7;
  border-radius: 1rem;
  background: #fff;
}

.tier-card {
  height: 100%;
  padding: 1rem;
}

.tier-card__title,
.toggle-card__title {
  display: block;
  color: #14213d;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.toggle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
}

.toggle-grid--compact {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.toggle-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
}

.toggle-card__copy {
  display: block;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.55;
}

.membership-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: 58rem;
  overflow: auto;
}

.membership-card {
  padding: 1rem;
}

.membership-card__name {
  color: #14213d;
  font-weight: 700;
}

.membership-card__meta,
.membership-card__details,
.membership-card__notes {
  color: #64748b;
  font-size: 0.92rem;
}

.membership-card__details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.85rem;
}

.membership-card__notes {
  margin-top: 0.75rem;
  line-height: 1.6;
}

.membership-status {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.membership-status--active {
  background: #ecfdf3;
  color: #047857;
}

.membership-status--trial {
  background: #eef2ff;
  color: #3730a3;
}

.membership-status--pending_review {
  background: #fff7e8;
  color: #9a6700;
}

.membership-status--cancelled {
  background: #fef2f2;
  color: #b91c1c;
}

.membership-empty {
  padding: 1rem;
  border: 1px dashed #d7deea;
  border-radius: 1rem;
  text-align: center;
  color: #64748b;
}
</style>
