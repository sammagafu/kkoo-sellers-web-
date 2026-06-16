<template>
  <VerticalLayout class="insights-page">
    <b-row class="page-header-row mb-4">
      <b-col>
        <h4 class="page-heading mb-0">Referral & Rewards</h4>
        <p class="page-subtitle text-muted mb-0">Your referral code, stats, rewards balance, and redemptions.</p>
      </b-col>
    </b-row>
    <p v-if="error" class="text-danger mb-3">{{ error }}</p>

    <!-- Key metrics (Skillset-style: big numbers, first card hero) -->
    <h6 class="section-label mb-2 mt-4">Overview</h6>
    <p class="text-muted small mb-3">Referral and reward metrics at a glance.</p>
    <b-row class="mb-4">
      <b-col md="6" lg="3" class="mb-3">
        <b-card no-body class="insights-stat-card insights-stat-card--hero h-100">
          <b-card-body class="d-flex align-items-center gap-3">
            <div class="insights-stat-icon-wrap insights-stat-icon--primary rounded">
              <Icon icon="solar:users-group-two-rounded-bold-duotone" class="insights-stat-icon" />
            </div>
            <div class="min-w-0">
              <p class="insights-stat-label mb-0">Total referrals</p>
              <p class="insights-stat-value mb-0">{{ referralStats?.total_referrals ?? '—' }}</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col md="6" lg="3" class="mb-3">
        <b-card no-body class="insights-stat-card h-100">
          <b-card-body class="d-flex align-items-center gap-3">
            <div class="insights-stat-icon-wrap insights-stat-icon--success rounded">
              <Icon icon="solar:verified-check-bold-duotone" class="insights-stat-icon" />
            </div>
            <div class="min-w-0">
              <p class="insights-stat-label mb-0">Completed</p>
              <p class="insights-stat-value mb-0">{{ referralStats?.completed_referrals ?? '—' }}</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col md="6" lg="3" class="mb-3">
        <b-card no-body class="insights-stat-card h-100">
          <b-card-body class="d-flex align-items-center gap-3">
            <div class="insights-stat-icon-wrap insights-stat-icon--warning rounded">
              <Icon icon="solar:gift-bold-duotone" class="insights-stat-icon" />
            </div>
            <div class="min-w-0">
              <p class="insights-stat-label mb-0">Rewarded</p>
              <p class="insights-stat-value mb-0">{{ referralStats?.rewarded_referrals ?? '—' }}</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col md="6" lg="3" class="mb-3">
        <b-card no-body class="insights-stat-card h-100">
          <b-card-body class="d-flex align-items-center gap-3">
            <div class="insights-stat-icon-wrap insights-stat-icon--info rounded">
              <Icon icon="solar:wallet-money-bold-duotone" class="insights-stat-icon" />
            </div>
            <div class="min-w-0">
              <p class="insights-stat-label mb-0">Total earnings</p>
              <p class="insights-stat-value mb-0">{{ referralStats?.total_earnings ?? '—' }}</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <h6 class="section-label mb-2 mt-4">Referral code</h6>
    <b-card class="mb-4">
      <p v-if="referralCode" class="mb-0 fs-5 fw-semibold">{{ referralCode }}</p>
      <p v-else class="text-muted mb-0">Loading…</p>
    </b-card>

    <h6 class="section-label mb-2 mt-4">Rewards balance</h6>
    <b-card class="mb-4">
      <b-list-group v-if="balance !== null" flush>
        <b-list-group-item class="d-flex justify-content-between"><span>Total balance</span><strong>{{ balance.total_balance ?? '—' }}</strong></b-list-group-item>
        <b-list-group-item class="d-flex justify-content-between"><span>Available</span><strong>{{ balance.available_balance ?? '—' }}</strong></b-list-group-item>
      </b-list-group>
      <p v-else class="text-muted mb-0">Loading…</p>
    </b-card>

    <h6 class="section-label mb-2 mt-4">Redemption options</h6>
    <b-card class="mb-4">
      <b-list-group v-if="redemptionOptions" flush>
        <b-list-group-item class="d-flex justify-content-between"><span>Min redemption points</span><strong>{{ redemptionOptions.min_redemption_points ?? '—' }}</strong></b-list-group-item>
        <b-list-group-item class="d-flex justify-content-between"><span>Points to cash rate</span><strong>{{ redemptionOptions.points_to_cash_rate ?? '—' }}</strong></b-list-group-item>
      </b-list-group>
      <p v-else class="text-muted mb-0">Loading…</p>
    </b-card>

    <h6 class="section-label mb-2 mt-4">Recent transactions</h6>
    <b-card class="mb-4">
      <b-table v-if="transactions.length" :items="transactions" :fields="txFields" striped small responsive />
      <p v-else-if="!txLoaded" class="text-muted mb-0">Loading…</p>
      <EmptyState v-else />
    </b-card>

    <h6 class="section-label mb-2 mt-4">My redemptions</h6>
    <b-card>
      <b-table v-if="redemptions.length" :items="redemptions" :fields="redemptionFields" striped small responsive />
      <p v-else-if="!redemptionsLoaded" class="text-muted mb-0">Loading…</p>
      <EmptyState v-else />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { referralApi, rewardsUserApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const error = ref('')
const referralCode = ref('')
const referralStats = ref<Record<string, unknown> | null>(null)
const balance = ref<Record<string, unknown> | null>(null)
const redemptionOptions = ref<Record<string, unknown> | null>(null)
const transactions = ref<Record<string, unknown>[]>([])
const txLoaded = ref(false)
const redemptions = ref<Record<string, unknown>[]>([])
const redemptionsLoaded = ref(false)

const txFields = [
  { key: 'id', label: 'ID' },
  { key: 'points', label: 'Points' },
  { key: 'type', label: 'Type' },
  { key: 'created_at', label: 'Date' },
]
const redemptionFields = [
  { key: 'id', label: 'ID' },
  { key: 'status', label: 'Status' },
  { key: 'points', label: 'Points' },
  { key: 'created_at', label: 'Date' },
]

async function load() {
  error.value = ''
  try {
    const [codeRes, statsRes, balanceRes, optionsRes] = await Promise.all([
      referralApi.getCode(),
      referralApi.getStats(),
      rewardsUserApi.getBalance(),
      rewardsUserApi.getRedemptionOptions(),
    ])
    referralCode.value = (codeRes.data as { code?: string })?.code ?? ''
    referralStats.value = (statsRes.data ?? {}) as Record<string, unknown>
    balance.value = (balanceRes.data ?? {}) as Record<string, unknown>
    redemptionOptions.value = (optionsRes.data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load')
  }

  try {
    const { data } = await rewardsUserApi.getTransactions({ page_size: 20 })
    const raw = (data as { results?: unknown[] })?.results ?? (Array.isArray(data) ? data : [])
    transactions.value = raw as Record<string, unknown>[]
  } catch {
    transactions.value = []
  } finally {
    txLoaded.value = true
  }

  try {
    const { data } = await rewardsUserApi.getRedemptions({ page_size: 20 })
    const raw = (data as { results?: unknown[] })?.results ?? (Array.isArray(data) ? data : [])
    redemptions.value = raw as Record<string, unknown>[]
  } catch {
    redemptions.value = []
  } finally {
    redemptionsLoaded.value = true
  }
}

onMounted(load)
</script>

<style scoped>
.insights-page .page-heading { font-size: 1.25rem; font-weight: 600; color: var(--bs-headings-color); }
.insights-page .page-subtitle { font-size: 0.875rem; line-height: 1.5; color: var(--bs-secondary-color); }
.insights-page .section-label {
  color: var(--bs-headings-color);
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: 0.01em;
}
.insights-stat-card .insights-stat-icon-wrap {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
}
.insights-stat-icon { width: 1.618rem; height: 1.618rem; color: inherit; }
.insights-stat-card .insights-stat-label { font-size: 0.875rem; line-height: 1.5; color: var(--bs-secondary-color); margin: 0; }
.insights-stat-card .insights-stat-value { font-size: 2rem; line-height: 1.2; font-weight: 600; letter-spacing: -0.02em; color: var(--bs-body-color); margin: 0; }
.insights-stat-icon--primary { background: linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.22), rgba(var(--bs-primary-rgb), 0.06)); color: var(--bs-primary); }
.insights-stat-icon--success { background: linear-gradient(135deg, rgba(var(--bs-success-rgb), 0.22), rgba(var(--bs-success-rgb), 0.06)); color: var(--bs-success); }
.insights-stat-icon--warning { background: linear-gradient(135deg, rgba(var(--bs-warning-rgb), 0.22), rgba(var(--bs-warning-rgb), 0.06)); color: var(--bs-warning); }
.insights-stat-icon--info { background: linear-gradient(135deg, rgba(var(--bs-info-rgb), 0.22), rgba(var(--bs-info-rgb), 0.06)); color: var(--bs-info); }
.insights-stat-card--hero {
  background: #5C308F !important;
  box-shadow: 0 8px 24px rgba(92, 48, 143, 0.35);
}
.insights-stat-card--hero .insights-stat-label { color: rgba(255, 255, 255, 0.85); }
.insights-stat-card--hero .insights-stat-value { color: #fff; }
.insights-stat-card--hero .insights-stat-icon-wrap { background: rgba(255, 255, 255, 0.2) !important; }
.insights-stat-card--hero .insights-stat-icon { color: #F7A829 !important; }
</style>
