<template>
  <div class="premium-metrics">
    <div class="row g-3 mb-4">
      <div class="col-md-6 col-xl-3" v-for="card in summaryCards" :key="card.label">
        <div class="metric-card h-100">
          <p class="metric-card__label">{{ card.label }}</p>
          <p class="metric-card__value">{{ card.value }}</p>
          <p class="metric-card__hint mb-0">{{ card.hint }}</p>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-7">
        <div class="metric-panel h-100">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <p class="text-uppercase text-muted small fw-semibold mb-2">Program Mix</p>
              <h3 class="h5 mb-1">Where premium is moving</h3>
              <p class="text-muted mb-0">Live breakdown across buyer, rider, and seller programs.</p>
            </div>
            <div class="target-pill">
              Target {{ metrics.summary.penetration_target_percent.toFixed(1) }}%
            </div>
          </div>

          <div class="program-grid">
            <article class="program-card" v-for="program in programCards" :key="program.key">
              <p class="program-card__title">{{ program.title }}</p>
              <div class="program-card__stats">
                <span><strong>{{ program.status.active }}</strong> active</span>
                <span><strong>{{ program.status.trial }}</strong> trial</span>
                <span><strong>{{ program.status.pending_review }}</strong> pending</span>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="metric-panel h-100">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <p class="text-uppercase text-muted small fw-semibold mb-2">Recent Activity</p>
              <h3 class="h5 mb-1">Latest premium movement</h3>
            </div>
            <div class="target-pill target-pill--dark">
              Growth {{ metrics.summary.growth_target_percent.toFixed(0) }}%
            </div>
          </div>

          <div class="activity-list">
            <div class="activity-row" v-for="item in metrics.recent_activity" :key="item.id">
              <div>
                <p class="activity-row__title">{{ item.user?.display_name || `User ${item.user_id}` }}</p>
                <p class="activity-row__copy mb-0">{{ item.program_label || item.program }} · {{ item.tier }} · {{ item.status }}</p>
              </div>
              <span class="activity-row__time">{{ formatDate(item.updated_at) }}</span>
            </div>
            <p v-if="metrics.recent_activity.length === 0" class="text-muted mb-0">No premium movement yet.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PremiumAdminMetrics } from '@/types/premium'

const props = defineProps<{
  metrics: PremiumAdminMetrics
}>()

const currencyFormatter = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('en-TZ', {
  maximumFractionDigits: 1,
})

const summaryCards = computed(() => [
  {
    label: 'Active premium members',
    value: props.metrics.summary.total_active_members.toLocaleString(),
    hint: `${props.metrics.summary.pending_reviews.toLocaleString()} pending review`,
  },
  {
    label: 'Monthly recurring revenue',
    value: currencyFormatter.format(props.metrics.summary.monthly_recurring_revenue),
    hint: 'Buyer memberships currently billing',
  },
  {
    label: 'Penetration rate',
    value: `${percentFormatter.format(props.metrics.summary.penetration_rate_percent)}%`,
    hint: `Target ${percentFormatter.format(props.metrics.summary.penetration_target_percent)}%`,
  },
  {
    label: 'Growth target',
    value: `${percentFormatter.format(props.metrics.summary.growth_target_percent)}%`,
    hint: 'Rollout pacing across premium programs',
  },
])

const programCards = computed(() => [
  { key: 'buyer', title: 'Buyer membership', status: props.metrics.by_program.buyer },
  { key: 'rider', title: 'Rider premier', status: props.metrics.by_program.rider },
  { key: 'seller', title: 'Seller elite', status: props.metrics.by_program.seller },
])

function formatDate(value?: string | null) {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}
</script>

<style scoped lang="scss">
.metric-card,
.metric-panel {
  border: 1px solid #e8eaf2;
  border-radius: 1.1rem;
  background: #fff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
}

.metric-card {
  padding: 1.15rem 1.1rem;
}

.metric-card__label,
.program-card__title,
.activity-row__copy {
  color: #64748b;
}

.metric-card__label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.metric-card__value {
  color: #14213d;
  font-size: 1.6rem;
  line-height: 1.15;
  font-weight: 800;
  margin-bottom: 0.35rem;
}

.metric-card__hint {
  font-size: 0.92rem;
}

.metric-panel {
  padding: 1.35rem;
}

.program-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.9rem;
}

.program-card {
  padding: 1rem;
  border-radius: 0.95rem;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid #edf2f7;
}

.program-card__title {
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.program-card__stats {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #0f172a;
  font-size: 0.95rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.activity-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #edf2f7;
}

.activity-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.activity-row__title {
  color: #14213d;
  font-weight: 700;
  margin-bottom: 0.15rem;
}

.activity-row__time {
  white-space: nowrap;
  color: #94a3b8;
  font-size: 0.85rem;
}

.target-pill {
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: #fff7e8;
  color: #9a6700;
  font-size: 0.85rem;
  font-weight: 700;
}

.target-pill--dark {
  background: #eef2ff;
  color: #3730a3;
}
</style>
