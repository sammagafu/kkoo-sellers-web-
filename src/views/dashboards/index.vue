<template>
  <VerticalLayout class="dashboard-home">
    <DashboardCommandHero :greeting-name="greetingName" :user-avatar="userAvatar" />


    <!-- Admin Dashboard -->
    <template v-if="isAdminOrStaff">
      <div class="dashboard-page-head mb-3">
        <h4 class="dashboard-heading mb-1">Admin dashboard</h4>
        <p class="dashboard-subtitle text-muted mb-0">Overview of platform metrics and activity.</p>
      </div>
      <p v-if="overviewDate" class="text-muted small mb-2">Report date: {{ overviewDate }}</p>

      <!-- Label: Pending / incomplete (full row) -->
      <h6 class="dashboard-section-label dashboard-section-label--accent mb-2 mt-4">Pending & action items</h6>
      <p class="text-muted small mb-2">Sellers, KYC documents, returns, redemptions, and orders waiting for action.</p>
      <b-row v-if="adminCounts.length" class="dashboard-stat-row mb-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-5">
        <b-col v-for="(item, idx) in adminCounts" :key="'count-' + idx" class="mb-3">
          <StatisticsCard :item="item" />
        </b-col>
      </b-row>
      <b-row v-else-if="loadingCounts" class="mb-4">
        <b-col><p class="text-muted">Loading counts…</p></b-col>
      </b-row>

      <!-- Label: Insights -->
      <h6 class="dashboard-section-label mb-2 mt-4">Platform insights</h6>
      <p class="text-muted small mb-2">Users, sellers, products, orders, revenue, and growth.</p>
      <template v-if="adminOverviewRows.length">
        <template v-for="(row, rowIdx) in adminOverviewRows" :key="'overview-' + rowIdx">
          <p v-if="adminOverviewRowLabels[rowIdx]" class="text-muted small mb-1 mt-2">{{ adminOverviewRowLabels[rowIdx] }}</p>
          <b-row class="dashboard-stat-row mb-4">
            <b-col md="6" xl="3" v-for="(item, idx) in row" :key="'overview-' + rowIdx + '-' + idx">
              <StatisticsCard :item="item" />
            </b-col>
          </b-row>
        </template>
      </template>
      <b-row v-else-if="loading" class="mb-4">
        <b-col><p class="text-muted">Loading overview…</p></b-col>
      </b-row>
      <b-row v-else-if="adminError" class="mb-4">
        <b-col><b-alert variant="warning" show>{{ adminError }}</b-alert></b-col>
      </b-row>
      <b-row v-else class="dashboard-stat-row mb-4">
        <b-col md="6" xl="3" v-for="(item, idx) in adminStatsFallback" :key="idx">
          <StatisticsCard :item="item" />
        </b-col>
      </b-row>

      <!-- Overview charts -->
      <h6 class="dashboard-section-label mb-2 mt-4">Overview charts</h6>
      <p class="text-muted small mb-2">Key platform metrics at a glance.</p>
      <b-row v-if="adminMetricsChart || adminSellersDonutChart" class="mb-4">
        <b-col xl="8" class="mb-3 mb-xl-0" v-if="adminMetricsChart">
          <b-card class="h-100">
            <ApexChart :chart="adminMetricsChart" />
          </b-card>
        </b-col>
        <b-col xl="4" v-if="adminSellersDonutChart">
          <b-card class="h-100">
            <ApexChart :chart="adminSellersDonutChart" />
          </b-card>
        </b-col>
      </b-row>

      <!-- Upcoming events -->
      <h6 class="dashboard-section-label mb-2 mt-4">Upcoming events</h6>
      <p class="text-muted small mb-2">Your schedule at a glance.</p>
      <b-row class="mb-4">
        <b-col xl="4">
          <b-card class="h-100">
            <b-list-group flush>
              <b-list-group-item
                v-for="event in upcomingEvents"
                :key="event.id"
                class="d-flex align-items-center justify-content-between"
              >
                <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                  <span
                    class="rounded flex-shrink-0"
                    style="width: 8px; height: 8px; background: var(--bs-primary);"
                  ></span>
                  <span class="text-truncate">{{ event.title }}</span>
                </div>
                <small class="text-muted flex-shrink-0 ms-2">{{ event.dateText }}</small>
              </b-list-group-item>
              <b-list-group-item v-if="!upcomingEvents.length" class="text-muted">
                No upcoming events
              </b-list-group-item>
            </b-list-group>
          </b-card>
        </b-col>
      </b-row>

      <DashboardQuickActions :items="adminQuickActions" />
    </template>

    <!-- Rider (Driver) Dashboard -->
    <template v-else-if="isRider">
      <b-row class="mb-3">
        <b-col>
          <h4 class="dashboard-heading mb-0">Driver Dashboard</h4>
          <p class="dashboard-subtitle text-muted mb-0">Your earnings and delivery assignments.</p>
        </b-col>
      </b-row>
      <h6 class="dashboard-section-label mb-2 mt-4">Quick links</h6>
      <b-row>
        <b-col>
          <b-card class="dashboard-quick-links mb-0">
            <b-list-group flush>
            </b-list-group>
          </b-card>
        </b-col>
      </b-row>
    </template>

    <!-- Seller Dashboard -->
    <template v-else-if="isSeller">
      <b-row class="mb-3">
        <b-col>
          <h4 class="dashboard-heading mb-0">Seller dashboard</h4>
          <p class="dashboard-subtitle text-muted mb-0">Your sales and company overview.</p>
        </b-col>
      </b-row>

      <!-- Company profile completion (hidden when complete) -->
      <b-card v-if="companyCompletionLoaded && companyCompletionPercent < 100" class="mb-4">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h6 class="text-muted text-uppercase small mb-1">Company profile completion</h6>
            <div class="d-flex align-items-center gap-3">
              <div class="progress flex-grow-1" style="height: 1.25rem; max-width: 280px;">
                <div
                  class="progress-bar"
                  :class="companyCompletionPercent >= 100 ? 'bg-success' : (companyCompletionPercent >= 50 ? 'bg-info' : 'bg-warning')"
                  :style="{ width: companyCompletionPercent + '%' }"
                  role="progressbar"
                  :aria-valuenow="companyCompletionPercent"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <span class="fw-semibold">{{ companyCompletionPercent }}%</span>
            </div>
          </div>
          <b-button variant="outline-primary" size="sm" :to="{ name: 'seller.profile' }">Complete profile</b-button>
        </div>
      </b-card>

      <h6 class="dashboard-section-label mb-2 mt-4">Your performance</h6>
      <p class="text-muted small mb-2">Sales, orders, products, and customers.</p>
      <b-row v-if="sellerStats.length" class="dashboard-stat-row mb-4">
        <b-col md="6" xl="3" v-for="(item, idx) in sellerStats" :key="idx">
          <StatisticsCard :item="item" />
        </b-col>
      </b-row>
      <b-row v-else-if="loading" class="mb-4">
        <b-col><p class="text-muted">Loading dashboard…</p></b-col>
      </b-row>
      <b-row v-else-if="sellerError" class="mb-4">
        <b-col><b-alert variant="warning" show>{{ sellerError }}</b-alert></b-col>
      </b-row>
      <b-row v-else class="dashboard-stat-row mb-4">
        <b-col md="6" xl="3" v-for="(item, idx) in sellerStatsFallback" :key="idx">
          <StatisticsCard :item="item" />
        </b-col>
      </b-row>

      <h6 class="dashboard-section-label mb-2 mt-4">Performance chart</h6>
      <p class="text-muted small mb-2">Breakdown of your key metrics.</p>
      <b-row v-if="sellerMetricsChart" class="mb-4">
        <b-col md="6" xl="5">
          <b-card class="h-100">
            <ApexChart :chart="sellerMetricsChart" />
          </b-card>
        </b-col>
      </b-row>

      <h6 class="dashboard-section-label mb-2 mt-4">Quick links</h6>
      <b-row>
        <b-col>
          <b-card class="dashboard-quick-links mb-0">
            <b-list-group flush>
              <b-list-group-item :to="{ name: 'seller.dashboard' }" action>Seller dashboard</b-list-group-item>
              <b-list-group-item :to="{ name: 'seller.products' }" action>My Products</b-list-group-item>
              <b-list-group-item :to="{ name: 'seller.orders' }" action>My Orders</b-list-group-item>
              <b-list-group-item :to="{ name: 'seller.analytics' }" action>Analytics</b-list-group-item>
              <b-list-group-item :to="{ name: 'seller.profile' }" action>Profile</b-list-group-item>
              <b-list-group-item :to="{ name: 'seller.documents' }" action>My Documents (KYC)</b-list-group-item>
              <b-list-group-item :to="{ name: 'seller.wholesale' }" action>Wholesale Tiers</b-list-group-item>
              <b-list-group-item :to="{ name: 'seller.referral-rewards' }" action>Referral & Rewards</b-list-group-item>
              <b-list-group-item :to="{ name: 'seller.share-earnings' }" action>Share Earnings</b-list-group-item>
              <b-list-group-item :to="{ name: 'seller.search-insights' }" action>Search Insights</b-list-group-item>
            </b-list-group>
          </b-card>
        </b-col>
      </b-row>
    </template>

    <!-- No role / fallback (e.g. buyer) -->
    <template v-else>
      <b-row class="mb-3">
        <b-col>
          <h4 class="dashboard-heading mb-0">Dashboard</h4>
          <p class="dashboard-subtitle text-muted mb-0">Welcome. Your role does not have a custom dashboard.</p>
        </b-col>
      </b-row>
      <h6 class="dashboard-section-label mb-2 mt-4">Overview</h6>
      <b-row>
        <b-col md="6" xl="3" v-for="(item, idx) in defaultStats" :key="idx">
          <StatisticsCard :item="item" />
        </b-col>
      </b-row>
      <h6 class="dashboard-section-label mb-2 mt-4">Quick links</h6>
      <b-row>
        <b-col>
          <b-card class="dashboard-quick-links mb-0">
            <b-list-group flush>
              <b-list-group-item :to="{ name: 'account.notifications' }" action>Notifications</b-list-group-item>
            </b-list-group>
          </b-card>
        </b-col>
      </b-row>
    </template>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import DashboardCommandHero from '@/components/dashboard/DashboardCommandHero.vue'
import DashboardQuickActions, { type QuickActionItem } from '@/components/dashboard/DashboardQuickActions.vue'
import StatisticsCard from '@/views/dashboards/components/StatisticsCard.vue'
import { useAuthStore } from '@/stores/auth'
import { canAccessSellerManagement } from '@/assets/data/kkoo-menu'
import { useProfileCompletion } from '@/composables/useProfileCompletion'
import { analyticsAdminApi, analyticsSellerApi, sellersAdminApi, ordersAdminApi, kycAdminApi, redemptionsAdminApi } from '@/api'
import type { StatisticCardType, ApexChartType } from '@/types'
import ApexChart from '@/components/ApexChart.vue'

const auth = useAuthStore()
const isAdminOrStaff = computed(() => auth.isAdminOrStaff)
const canManageSellers = computed(() => canAccessSellerManagement(auth.user))
const isSeller = computed(() => auth.isSeller)
const isRider = computed(() => false)

const dashboardEventSeeds = [
  { id: 'seller-sync', title: 'Seller sync check-in', start: Date.now() + 12 * 60 * 60 * 1000 },
  { id: 'ops-review', title: 'Operations review', start: Date.now() + 24 * 60 * 60 * 1000 },
  { id: 'stock-follow-up', title: 'Low-stock follow-up', start: Date.now() + 36 * 60 * 60 * 1000 },
  { id: 'rider-standup', title: 'Rider dispatch stand-up', start: Date.now() + 48 * 60 * 60 * 1000 },
  { id: 'merchant-support', title: 'Merchant support window', start: Date.now() + 72 * 60 * 60 * 1000 },
] as const

const greetingName = computed(() => {
  const u = auth.user
  if (!u) return ''
  const first = (u as { first_name?: string }).first_name
  const last = (u as { last_name?: string }).last_name
  const name = [first, last].filter(Boolean).join(' ')
  return name || (u as { phone_number?: string }).phone_number || ''
})
const userAvatar = computed(() => {
  const u = auth.user as { avatar_url?: string; avatar?: string } | null
  const raw = u?.avatar_url ?? u?.avatar ?? ''
  if (!raw) return ''
  if (raw.startsWith('http')) return raw
  const base = (import.meta.env.VITE_MEDIA_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080')
    .toString()
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/$/, '')
  return raw.startsWith('/') ? `${base}${raw}` : `${base}/${raw}`
})

const { percentage: companyCompletionPercent, loading: companyCompletionLoading } = useProfileCompletion()
const companyCompletionLoaded = computed(() => !companyCompletionLoading.value)

const loading = ref(false)
const loadingCounts = ref(false)
const adminError = ref('')
const sellerError = ref('')
const adminOverviewData = ref<Record<string, unknown> | null>(null)
const adminCounts = ref<StatisticCardType[]>([])
const sellerStats = ref<StatisticCardType[]>([])

const overviewDate = computed(() => {
  const d = adminOverviewData.value?.date
  return d != null ? String(d) : ''
})

function pickNumber(data: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const raw = data[k]
    if (typeof raw === 'number' && !Number.isNaN(raw)) return raw
    if (typeof raw === 'string') { const n = parseFloat(raw); if (!Number.isNaN(n)) return n }
  }
  return 0
}

function pickNested(data: Record<string, unknown>, path: string): number | undefined {
  const parts = path.split('.')
  let current: unknown = data
  for (const p of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[p]
  }
  if (typeof current === 'number' && !Number.isNaN(current)) return current
  if (typeof current === 'string') { const n = parseFloat(current); if (!Number.isNaN(n)) return n }
  return undefined
}

/** Build overview stat card from API response. */
function overviewCard(
  data: Record<string, unknown>,
  config: { key: string; nested?: string; title: string; icon: string; prefix?: string; suffix?: string; growthKey?: string; to?: { name: string } },
): StatisticCardType {
  const num = config.nested ? (pickNested(data, config.nested) ?? pickNumber(data, config.key)) : pickNumber(data, config.key)
  const growth = config.growthKey != null ? pickNested(data, config.growthKey) : undefined
  return {
    title: config.title,
    icon: config.icon,
    statistic: num,
    ...(config.prefix != null && { prefix: config.prefix }),
    ...(config.suffix != null && { suffix: config.suffix }),
    ...(growth != null && !Number.isNaN(growth) && { growth }),
    ...(config.to != null && { to: config.to }),
  }
}

/** Admin overview cards: API overview (API.md). Seller links require superuser. */
const adminOverviewCardConfig = computed(() => {
  const sellerTo = canManageSellers.value ? { name: 'admin.sellers' as const } : undefined
  return [
  { key: 'total_users', title: 'Total Users', icon: 'solar:users-group-two-rounded-bold-duotone', to: { name: 'admin.users' } },
  { key: 'active_users_30d', title: 'Active Users (30d)', icon: 'solar:user-check-bold-duotone', to: { name: 'admin.users' } },
  { key: 'total_sellers', title: 'Total Sellers', icon: 'solar:user-id-bold-duotone', ...(sellerTo && { to: sellerTo }) },
  { key: 'verified_sellers', title: 'Verified Sellers', icon: 'solar:verified-check-bold-duotone', ...(sellerTo && { to: sellerTo }) },
  { key: 'total_products', title: 'Total Products', icon: 'solar:box-bold-duotone', to: { name: 'admin.catalog.products' } },
  { key: 'active_products', title: 'Active Products', icon: 'solar:box-minimalistic-bold-duotone', to: { name: 'admin.catalog.products' } },
  { key: 'total_orders', title: 'Total Orders', icon: 'solar:cart-large-2-bold-duotone', to: { name: 'admin.orders' } },
  { key: 'total_revenue', title: 'Total Revenue', icon: 'solar:wallet-money-bold-duotone', prefix: 'TZS ', to: { name: 'admin.analytics' } },
  { key: 'drivers_total', title: 'Drivers', icon: 'solar:delivery-bold-duotone', to: { name: 'admin.logistics' } },
  { key: 'earnings_total_platform_fee', title: 'Platform fee', icon: 'solar:wallet-money-bold-duotone', prefix: 'TZS ', to: { name: 'admin.analytics' } },
  { key: 'average_order_value', title: 'Avg Order Value', icon: 'solar:wallet-bold-duotone', prefix: 'TZS ', to: { name: 'admin.analytics' } },
  { key: 'return_rate', title: 'Return Rate', icon: 'solar:refresh-bold-duotone', suffix: '%', to: { name: 'admin.returns' } },
  { key: 'refund_amount', title: 'Refund Amount', icon: 'solar:money-bag-bold-duotone', prefix: 'TZS ', to: { name: 'admin.returns' } },
  { key: 'user_growth', nested: 'user_growth.monthly', growthKey: 'user_growth.growth_percentage', title: 'User Growth (monthly)', icon: 'solar:chart-2-bold-duotone', to: { name: 'admin.analytics' } },
  { key: 'revenue_growth', nested: 'revenue_growth.monthly', growthKey: 'revenue_growth.growth_percentage', title: 'Revenue Growth (monthly)', icon: 'solar:chart-bold-duotone', prefix: 'TZS ', to: { name: 'admin.analytics' } },
  { key: 'notifications_total', title: 'Notifications', icon: 'solar:bell-bing-bold-duotone', to: { name: 'account.notifications' } },
  { key: 'notifications_last_24h', title: 'Notifications (24h)', icon: 'solar:bell-bold-duotone', to: { name: 'account.notifications' } },
  { key: 'recent_orders_last_24h', title: 'Orders (24h)', icon: 'solar:cart-large-2-bold-duotone', to: { name: 'admin.orders' } },
  { key: 'recent_new_users_24h', title: 'New users (24h)', icon: 'solar:user-plus-bold-duotone', to: { name: 'admin.users' } },
  ]
})

const adminOverviewRows = computed(() => {
  const data = adminOverviewData.value
  if (!data || typeof data !== 'object') return []
  const cards = adminOverviewCardConfig.value.map((c) => overviewCard(data as Record<string, unknown>, c))
  const rows: StatisticCardType[][] = []
  for (let i = 0; i < cards.length; i += 4) {
    rows.push(cards.slice(i, i + 4))
  }
  return rows
})

/** Row labels for Platform insights (one per row; 5 rows of 4). */
const adminOverviewRowLabels = [
  'Users & sellers',
  'Products, orders & revenue',
  'Riders & logistics',
  'Earnings & returns',
  'Growth',
  'Notifications & recent activity',
]

const primaryColor = '#5C308F'
const secondaryColor = '#F7A829'

/** Admin dashboard: column chart of key metrics (users, sellers, products, orders). */
const adminMetricsChart = computed<ApexChartType | null>(() => {
  const data = adminOverviewData.value as Record<string, unknown> | null
  if (!data) return null
  const users = pickNumber(data, 'total_users')
  const sellers = pickNumber(data, 'total_sellers')
  const products = pickNumber(data, 'total_products')
  const orders = pickNumber(data, 'total_orders')
  return {
    height: 280,
    type: 'bar',
    series: [{ name: 'Count', data: [users, sellers, products, orders] }],
    options: {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      colors: [primaryColor],
      xaxis: { categories: ['Users', 'Sellers', 'Products', 'Orders'] },
      yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
      grid: { strokeDashArray: 3, xaxis: { lines: { show: false } } },
      dataLabels: { enabled: false },
      tooltip: { y: { formatter: (v: number) => String(v) } },
    },
  }
})

/** Admin: verified vs unverified sellers donut. */
const adminSellersDonutChart = computed<ApexChartType | null>(() => {
  const data = adminOverviewData.value as Record<string, unknown> | null
  if (!data) return null
  const total = pickNumber(data, 'total_sellers')
  const verified = pickNumber(data, 'verified_sellers')
  const unverified = Math.max(0, total - verified)
  if (total === 0 && verified === 0) return null
  return {
    height: 280,
    type: 'donut',
    series: [verified, unverified],
    options: {
      chart: { type: 'donut' },
      labels: ['Verified sellers', 'Unverified sellers'],
      colors: [primaryColor, secondaryColor],
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '65%' } } },
      dataLabels: { enabled: true },
    },
  }
})

/** Seller dashboard: donut of performance metrics. */
const sellerMetricsChart = computed<ApexChartType | null>(() => {
  const stats = sellerStats.value
  if (!stats.length) return null
  const labels = stats.map((s) => s.title)
  const series = stats.map((s) => Number(s.statistic) || 0)
  if (series.every((n) => n === 0)) return null
  return {
    height: 280,
    type: 'donut',
    series,
    options: {
      chart: { type: 'donut' },
      labels,
      colors: [primaryColor, secondaryColor, '#10B981', '#7B46B3'],
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '65%' } } },
      dataLabels: { enabled: true },
    },
  }
})

const adminStatsFallback: StatisticCardType[] = [
  { title: 'Total Users', icon: 'solar:users-group-two-rounded-bold-duotone', statistic: 0, to: { name: 'admin.users' } },
  { title: 'Revenue', icon: 'solar:wallet-money-bold-duotone', statistic: 0, prefix: 'TZS ', to: { name: 'admin.analytics' } },
  { title: 'Orders', icon: 'solar:cart-large-2-bold-duotone', statistic: 0, to: { name: 'admin.orders' } },
  { title: 'Products', icon: 'solar:box-bold-duotone', statistic: 0, to: { name: 'admin.catalog.products' } },
]
const sellerStatsFallback: StatisticCardType[] = [
  { title: 'Total Sales', icon: 'solar:wallet-money-bold-duotone', statistic: 0, prefix: 'TZS ', to: { name: 'seller.analytics' } },
  { title: 'Orders', icon: 'solar:cart-large-2-bold-duotone', statistic: 0, to: { name: 'seller.analytics' } },
  { title: 'Products', icon: 'solar:box-bold-duotone', statistic: 0, to: { name: 'seller.products' } },
  { title: 'Customers', icon: 'solar:users-group-two-rounded-bold-duotone', statistic: 0, to: { name: 'seller.analytics' } },
]
const defaultStats: StatisticCardType[] = [
  { title: 'Overview', icon: 'solar:chart-square-bold-duotone', statistic: 0 },
]

/** Upcoming events for dashboard widget: next 5 from calendar seed data, sorted by start. */
const upcomingEvents = computed(() => {
  const now = Date.now()
  const withStart = dashboardEventSeeds
    .map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
    }))
    .filter((e) => e.start >= now)
    .sort((a, b) => a.start - b.start)
    .slice(0, 5)
  return withStart.map((e) => ({
    id: e.id,
    title: e.title,
    dateText: new Date(e.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }))
})

/** Get count from list API response: array or { count, results }. */
function countFromListResponse(data: unknown): number {
  if (Array.isArray(data)) return data.length
  if (data && typeof data === 'object' && 'count' in data) {
    const c = (data as { count?: number }).count
    if (typeof c === 'number' && !Number.isNaN(c)) return c
  }
  if (data && typeof data === 'object' && 'results' in data) {
    const r = (data as { results?: unknown[] }).results
    return Array.isArray(r) ? r.length : 0
  }
  return 0
}

const adminQuickActions = computed<QuickActionItem[]>(() => {
  const items: QuickActionItem[] = [
  { key: 'users', label: 'Users', icon: 'solar:users-group-two-rounded-broken', tone: 'teal', hint: 'Accounts & roles', to: { name: 'admin.users' } },
  ...(canManageSellers.value
    ? [{ key: 'sellers', label: 'Sellers', icon: 'solar:user-id-broken', tone: 'purple' as const, hint: 'Onboarding & verification', to: { name: 'admin.sellers' } }]
    : []),
  { key: 'orders', label: 'Orders', icon: 'solar:cart-large-2-broken', tone: 'pink', hint: 'Live commerce queue', to: { name: 'admin.orders' } },
  { key: 'payouts', label: 'Payouts', icon: 'solar:wallet-money-broken', tone: 'orange', hint: 'Seller settlements', to: { name: 'admin.payouts' } },
  { key: 'disputes', label: 'Disputes', icon: 'solar:shield-warning-broken', tone: 'danger', hint: 'Trust & resolution', to: { name: 'admin.disputes' } },
  { key: 'categories', label: 'Categories', icon: 'solar:widget-2-broken', tone: 'info', hint: 'Catalog structure', to: { name: 'admin.catalog.categories' } },
  { key: 'products', label: 'Products', icon: 'solar:box-broken', tone: 'red', hint: 'Marketplace catalog', to: { name: 'admin.catalog.products' } },
  { key: 'import', label: 'Import catalog', icon: 'solar:upload-minimalistic-broken', tone: 'warning', hint: 'Bulk product upload', to: { name: 'admin.catalog.import' } },
  { key: 'media', label: 'Media library', icon: 'solar:gallery-broken', tone: 'secondary', hint: 'Images & assets', to: { name: 'admin.catalog.media' } },
  { key: 'kyc', label: 'KYC documents', icon: 'solar:document-broken', tone: 'warning', hint: 'Pending reviews', to: { name: 'admin.kyc-documents' } },
  { key: 'returns', label: 'Returns', icon: 'solar:refresh-broken', tone: 'danger', hint: 'Refund pipeline', to: { name: 'admin.returns' } },
  { key: 'promotions', label: 'Promotions', icon: 'solar:ticket-sale-broken', tone: 'pink', hint: 'Campaigns & codes', to: { name: 'admin.promotions' } },
  { key: 'redemptions', label: 'Redemptions', icon: 'solar:gift-broken', tone: 'success', hint: 'Rewards queue', to: { name: 'admin.redemptions' } },
  { key: 'logistics', label: 'Logistics', icon: 'solar:delivery-broken', tone: 'dark', hint: 'Drivers & dispatch', to: { name: 'admin.logistics' } },
  { key: 'zones', label: 'Delivery zones', icon: 'solar:map-point-broken', tone: 'teal', hint: 'Coverage & pricing', to: { name: 'admin.logistics.zones' } },
  { key: 'crm', label: 'CRM', icon: 'solar:chart-2-broken', tone: 'info', hint: 'Business operations', to: { name: 'admin.crm.dashboard' } },
  { key: 'analytics', label: 'Analytics', icon: 'solar:chart-square-broken', tone: 'primary', hint: 'Platform insights', to: { name: 'admin.analytics' } },
  { key: 'account', label: 'My account', icon: 'solar:user-circle-broken', tone: 'secondary', hint: 'Profile & security', to: { name: 'account.home' } },
  { key: 'notifications', label: 'Notifications', icon: 'solar:bell-bing-broken', tone: 'purple', hint: 'Alerts & preferences', to: { name: 'account.notifications' } },
  ]
  return items
})

const adminCountCards = computed<StatisticCardType[]>(() => {
  const cards: StatisticCardType[] = [
  ...(canManageSellers.value
    ? [{ title: 'Pending Sellers', icon: 'solar:user-id-bold-duotone', statistic: 0, to: { name: 'admin.sellers' } }]
    : []),
  { title: 'Pending KYC Documents', icon: 'solar:document-bold-duotone', statistic: 0, to: { name: 'admin.kyc-documents' } },
  { title: 'Pending Returns', icon: 'solar:refresh-bold-duotone', statistic: 0, to: { name: 'admin.returns' } },
  { title: 'Pending Redemptions', icon: 'solar:gift-bold-duotone', statistic: 0, to: { name: 'admin.redemptions' } },
  { title: 'Pending Orders', icon: 'solar:cart-large-2-bold-duotone', statistic: 0, to: { name: 'admin.orders' } },
  ]
  return cards
})

function mapOverviewToStats(
  data: Record<string, unknown>,
  cards: { keys: string[]; title: string; icon: string; prefix?: string; to?: { name: string } }[],
): StatisticCardType[] {
  return cards.map((card) => ({
    title: card.title,
    icon: card.icon,
    statistic: pickNumber(data, ...card.keys),
    ...(card.prefix != null && { prefix: card.prefix }),
    ...(card.to != null && { to: card.to }),
  }))
}

const sellerCards = [
  { keys: ['total_sales', 'sales', 'revenue'], title: 'Total Sales', icon: 'solar:wallet-money-bold-duotone', prefix: 'TZS ', to: { name: 'seller.analytics' } },
  { keys: ['orders_count', 'orders', 'total_orders'], title: 'Orders', icon: 'solar:cart-large-2-bold-duotone', to: { name: 'seller.analytics' } },
  { keys: ['products_count', 'products'], title: 'Products', icon: 'solar:box-bold-duotone', to: { name: 'seller.products' } },
  { keys: ['pending_payout'], title: 'Pending Payout', icon: 'solar:wallet-bold-duotone', prefix: 'TZS ', to: { name: 'seller.analytics' } },
]

onMounted(async () => {
  if (isAdminOrStaff.value) {
    loadingCounts.value = true
    loading.value = true
    adminError.value = ''
    try {
      // Important: do NOT load full lists on dashboard (can be massive and freeze UI).
      // Request only first page and rely on `count` when available.
      const sellersPromise = canManageSellers.value
        ? sellersAdminApi.list({ kyc_status: 'pending', page: 1, page_size: 1 }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] })
      const [sellersRes, kycRes, returnsRes, redemptionsRes, ordersRes] = await Promise.all([
        sellersPromise,
        kycAdminApi.list({ status: 'pending', page: 1, page_size: 1 }).catch(() => ({ data: [] })),
        ordersAdminApi.listReturns({ status: 'pending', page: 1, page_size: 1 }).catch(() => ({ data: [] })),
        redemptionsAdminApi.list({ status: 'pending', page: 1, page_size: 1 }).catch(() => ({ data: [] })),
        ordersAdminApi.list({ status: 'pending', page: 1, page_size: 1 }).catch(() => ({ data: [] })),
      ])
      adminCounts.value = adminCountCards.value.map((card) => {
        const source =
          card.title === 'Pending Sellers'
            ? sellersRes
            : card.title === 'Pending KYC Documents'
              ? kycRes
              : card.title === 'Pending Returns'
                ? returnsRes
                : card.title === 'Pending Redemptions'
                  ? redemptionsRes
                  : ordersRes
        return { ...card, statistic: countFromListResponse(source.data) }
      })
    } catch {
      adminCounts.value = adminCountCards.value.map((c) => ({ ...c, statistic: 0 }))
    } finally {
      loadingCounts.value = false
    }
    try {
      const { data } = await analyticsAdminApi.overview()
      const raw = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
      // API.md: users_count, sellers_count, products_count, orders_count, pending_orders, total_revenue; riders (total, with_deliveries); logistics; earnings
      const d: Record<string, unknown> = { ...raw }
      if (raw.users_count != null) d.total_users = raw.users_count
      if (raw.sellers_count != null) d.total_sellers = raw.sellers_count
      if (raw.products_count != null) d.total_products = raw.products_count
      if (raw.orders_count != null) d.total_orders = raw.orders_count
      if (raw.pending_orders != null) d.pending_orders = raw.pending_orders
      if (raw.total_revenue != null) d.total_revenue = raw.total_revenue
      const riders = raw.riders as Record<string, unknown> | undefined
      if (riders && typeof riders === 'object') {
        d.riders_total = riders.total
        d.riders_with_deliveries = riders.with_deliveries
      }
      const logistics = raw.logistics as Record<string, unknown> | undefined
      if (logistics && typeof logistics === 'object') {
        d.logistics_assignments_delivered = logistics.assignments_delivered
        d.logistics_assignments_in_progress = logistics.assignments_in_progress
        d.logistics_delivery_requests_pending = logistics.delivery_requests_pending
        d.logistics_delivery_jobs_pending = logistics.delivery_jobs_pending
        d.logistics_zones_count = logistics.zones_count
      }
      const earnings = raw.earnings as Record<string, unknown> | undefined
      if (earnings && typeof earnings === 'object') {
        d.earnings_total_platform_fee = earnings.total_platform_fee
        d.earnings_total_rider_earnings = earnings.total_rider_earnings
        d.earnings_total_rider_payouts_done = earnings.total_rider_payouts_done
        d.earnings_pending_rider_payout = earnings.pending_rider_payout
      }
      const notifications = raw.notifications as Record<string, unknown> | undefined
      if (notifications && typeof notifications === 'object') {
        d.notifications_total = notifications.total
        d.notifications_last_24h = notifications.last_24h
        d.notifications_push_tokens = notifications.push_tokens
      }
      const recent = raw.recent_activity as Record<string, unknown> | undefined
      if (recent && typeof recent === 'object') {
        d.recent_orders_last_24h = recent.orders_last_24h
        d.recent_new_users_24h = recent.new_users_24h
      }
      const funnel = raw.order_funnel as Record<string, unknown> | undefined
      if (funnel && typeof funnel === 'object') {
        d.order_funnel_pending = funnel.pending
        d.order_funnel_paid = funnel.paid
        d.order_funnel_delivered = funnel.delivered
      }
      adminOverviewData.value = d
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      adminError.value = err.response?.data?.detail ?? err.message ?? 'Failed to load admin overview'
      adminOverviewData.value = null
    } finally {
      loading.value = false
    }
  } else if (isSeller.value) {
    loading.value = true
    sellerError.value = ''
    try {
      const { data } = await analyticsSellerApi.overview()
      const d = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
      sellerStats.value = mapOverviewToStats(d, sellerCards)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      sellerError.value = err.response?.data?.detail ?? err.message ?? 'Failed to load seller overview'
      sellerStats.value = []
    } finally {
      loading.value = false
    }
  }
})
</script>

<style scoped>
/* KKOO dashboard home — command strip + panel sections */

.dashboard-page-head {
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgba(92, 48, 143, 0.1);
}

[data-bs-theme='dark'] .dashboard-page-head {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.dashboard-home .dashboard-section-label {
  color: var(--bs-headings-color);
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.4;
  letter-spacing: 0.02em;
  padding-left: 0.85rem;
  border-left: 3px solid rgba(92, 48, 143, 0.35);
  margin-bottom: 0.75rem;
}

.dashboard-home .dashboard-section-label--accent {
  border-left-color: var(--bs-warning);
}
.dashboard-home :deep(.dashboard-heading) {
  color: var(--bs-headings-color);
}
.dashboard-home :deep(.dashboard-subtitle) {
  color: var(--bs-secondary-color);
}

/* First stat card = hero (dark purple, like Total Revenue) – overrides global card */
.dashboard-home :deep(.row-cols-xl-5 > *:nth-child(1) .dashboard-stat-card),
.dashboard-home :deep(.row-cols-md-3 > *:nth-child(1) .dashboard-stat-card),
.dashboard-home :deep(.row-cols-sm-2 > *:nth-child(1) .dashboard-stat-card),
.dashboard-home :deep(.mb-4.row .col:first-child .dashboard-stat-card),
.dashboard-home :deep(.mb-4.row .b-col:first-child .dashboard-stat-card) {
  background: #5C308F !important;
  box-shadow: 0 8px 24px rgba(92, 48, 143, 0.35);
}
.dashboard-home :deep(.row-cols-xl-5 > *:nth-child(1) .dashboard-stat-card .stat-card-title),
.dashboard-home :deep(.row-cols-md-3 > *:nth-child(1) .dashboard-stat-card .stat-card-title),
.dashboard-home :deep(.row-cols-sm-2 > *:nth-child(1) .dashboard-stat-card .stat-card-title),
.dashboard-home :deep(.mb-4.row .col:first-child .dashboard-stat-card .stat-card-title),
.dashboard-home :deep(.mb-4.row .b-col:first-child .dashboard-stat-card .stat-card-title) {
  color: rgba(255, 255, 255, 0.85) !important;
}
.dashboard-home :deep(.row-cols-xl-5 > *:nth-child(1) .dashboard-stat-card .stat-card-value),
.dashboard-home :deep(.row-cols-md-3 > *:nth-child(1) .dashboard-stat-card .stat-card-value),
.dashboard-home :deep(.row-cols-sm-2 > *:nth-child(1) .dashboard-stat-card .stat-card-value),
.dashboard-home :deep(.mb-4.row .col:first-child .dashboard-stat-card .stat-card-value),
.dashboard-home :deep(.mb-4.row .b-col:first-child .dashboard-stat-card .stat-card-value) {
  color: #fff !important;
}
.dashboard-home :deep(.row-cols-xl-5 > *:nth-child(1) .dashboard-stat-card .stat-card-icon-wrap),
.dashboard-home :deep(.row-cols-md-3 > *:nth-child(1) .dashboard-stat-card .stat-card-icon-wrap),
.dashboard-home :deep(.row-cols-sm-2 > *:nth-child(1) .dashboard-stat-card .stat-card-icon-wrap),
.dashboard-home :deep(.mb-4.row .col:first-child .dashboard-stat-card .stat-card-icon-wrap),
.dashboard-home :deep(.mb-4.row .b-col:first-child .dashboard-stat-card .stat-card-icon-wrap) {
  background: rgba(255, 255, 255, 0.2) !important;
}
.dashboard-home :deep(.row-cols-xl-5 > *:nth-child(1) .dashboard-stat-card .stat-card-icon),
.dashboard-home :deep(.row-cols-md-3 > *:nth-child(1) .dashboard-stat-card .stat-card-icon),
.dashboard-home :deep(.row-cols-sm-2 > *:nth-child(1) .dashboard-stat-card .stat-card-icon),
.dashboard-home :deep(.mb-4.row .col:first-child .dashboard-stat-card .stat-card-icon),
.dashboard-home :deep(.mb-4.row .b-col:first-child .dashboard-stat-card .stat-card-icon) {
  color: #F7A829 !important;
}
.dashboard-home :deep(.row-cols-xl-5 > *:nth-child(1) .dashboard-stat-card .stat-card-footer),
.dashboard-home :deep(.row-cols-md-3 > *:nth-child(1) .dashboard-stat-card .stat-card-footer),
.dashboard-home :deep(.row-cols-sm-2 > *:nth-child(1) .dashboard-stat-card .stat-card-footer),
.dashboard-home :deep(.mb-4.row .col:first-child .dashboard-stat-card .stat-card-footer),
.dashboard-home :deep(.mb-4.row .b-col:first-child .dashboard-stat-card .stat-card-footer) {
  background: rgba(0, 0, 0, 0.15) !important;
  color: rgba(255, 255, 255, 0.9);
}
.dashboard-home :deep(.row-cols-xl-5 > *:nth-child(1) .dashboard-stat-card .stat-card-link),
.dashboard-home :deep(.row-cols-md-3 > *:nth-child(1) .dashboard-stat-card .stat-card-link),
.dashboard-home :deep(.row-cols-sm-2 > *:nth-child(1) .dashboard-stat-card .stat-card-link),
.dashboard-home :deep(.mb-4.row .col:first-child .dashboard-stat-card .stat-card-link),
.dashboard-home :deep(.mb-4.row .b-col:first-child .dashboard-stat-card .stat-card-link) {
  color: #F7A829 !important;
}
.dashboard-home :deep(.row-cols-xl-5 > *:nth-child(1) .dashboard-stat-card .text-success),
.dashboard-home :deep(.row-cols-md-3 > *:nth-child(1) .dashboard-stat-card .text-success),
.dashboard-home :deep(.row-cols-sm-2 > *:nth-child(1) .dashboard-stat-card .text-success),
.dashboard-home :deep(.mb-4.row .col:first-child .dashboard-stat-card .text-success),
.dashboard-home :deep(.mb-4.row .b-col:first-child .dashboard-stat-card .text-success) {
  color: #F7A829 !important;
}
.dashboard-home :deep(.row-cols-xl-5 > *:nth-child(1) .dashboard-stat-card .text-muted),
.dashboard-home :deep(.row-cols-md-3 > *:nth-child(1) .dashboard-stat-card .text-muted),
.dashboard-home :deep(.row-cols-sm-2 > *:nth-child(1) .dashboard-stat-card .text-muted),
.dashboard-home :deep(.mb-4.row .col:first-child .dashboard-stat-card .text-muted),
.dashboard-home :deep(.mb-4.row .b-col:first-child .dashboard-stat-card .text-muted) {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* Stat + chart cards */
.dashboard-home :deep(.dashboard-stat-card) {
  border-radius: 1rem;
  border: 1px solid rgba(92, 48, 143, 0.1) !important;
  box-shadow: 0 10px 28px rgba(16, 12, 22, 0.06);
}

.dashboard-home :deep(.b-card) {
  border-radius: 1.15rem;
  border: 1px solid rgba(92, 48, 143, 0.1);
  box-shadow: 0 12px 32px rgba(16, 12, 22, 0.06);
}

[data-bs-theme='dark'] .dashboard-home :deep(.dashboard-stat-card),
[data-bs-theme='dark'] .dashboard-home :deep(.b-card) {
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.28);
}

/* Quick links – Skillset-style card */
.dashboard-home :deep(.dashboard-quick-links) {
  border-radius: 24px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
  background: #fff;
  overflow: hidden;
}
[data-bs-theme="dark"] .dashboard-home :deep(.dashboard-quick-links) {
  background: var(--bs-secondary-bg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.dashboard-home :deep(.dashboard-quick-links .card-title) {
  color: var(--bs-headings-color);
}
.dashboard-home :deep(.dashboard-quick-links .list-group-item),
.dashboard-home :deep(.dashboard-quick-links .list-group-item-action) {
  color: var(--bs-body-color);
  padding: 0.75rem 1rem;
  border-color: var(--bs-border-color);
}
.dashboard-home :deep(.dashboard-quick-links .list-group-item-action:hover),
.dashboard-home :deep(.dashboard-quick-links .list-group-item-action:focus) {
  background-color: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.08);
  color: var(--bs-primary);
}
.dashboard-home :deep(.dashboard-quick-links .list-group-item.active) {
  background-color: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.12);
  color: var(--bs-primary);
  border-color: var(--bs-border-color);
}

/* Event list – same clean row style */
.dashboard-home :deep(.b-list-group-item) {
  padding: 0.75rem 1rem;
  border-color: var(--bs-border-color);
}

</style>
