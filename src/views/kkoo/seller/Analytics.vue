<template>
  <VerticalLayout>
    <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
      <h2 class="mb-0">Analytics</h2>
      <b-button-group size="sm">
        <b-button :variant="period === undefined ? 'primary' : 'outline-primary'" @click="setPeriod(undefined)">Overview</b-button>
        <b-button :variant="period === '7d' ? 'primary' : 'outline-primary'" @click="setPeriod('7d')">7 days</b-button>
        <b-button :variant="period === '30d' ? 'primary' : 'outline-primary'" @click="setPeriod('30d')">30 days</b-button>
      </b-button-group>
    </div>

    <b-card title="Sales" class="mb-4">
      <b-row>
        <b-col md="3" class="mb-3">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Total sales</h6>
            <p class="h5 mb-0">{{ formatMoney(analytics.total_sales) }}</p>
          </div>
        </b-col>
        <b-col md="3" class="mb-3">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Total orders</h6>
            <p class="h5 mb-0">{{ analytics.total_orders ?? 0 }}</p>
          </div>
        </b-col>
        <b-col md="3" class="mb-3">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Average order value</h6>
            <p class="h5 mb-0">{{ formatMoney(analytics.average_order_value) }}</p>
          </div>
        </b-col>
        <b-col md="3" class="mb-3">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Sales today</h6>
            <p class="h5 mb-0">{{ formatMoney(analytics.sales_today) }}</p>
          </div>
        </b-col>
      </b-row>
      <div class="d-flex flex-wrap gap-3 mt-2 text-muted small">
        <span>This week: <strong class="text-dark">{{ formatMoney(analytics.sales_this_week) }}</strong> ({{ analytics.orders_this_week ?? 0 }} orders)</span>
        <span>This month: <strong class="text-dark">{{ formatMoney(analytics.sales_this_month) }}</strong> ({{ analytics.orders_this_month ?? 0 }} orders)</span>
      </div>
    </b-card>

    <b-card title="Catalog & engagement" class="mb-4">
      <b-row>
        <b-col md="3" class="mb-3">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Active products</h6>
            <p class="h5 mb-0">{{ analytics.products_count ?? 0 }}</p>
          </div>
        </b-col>
        <b-col md="3" class="mb-3">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Low stock (≤5 units)</h6>
            <p class="h5 mb-0">{{ analytics.products_low_stock_count ?? 0 }}</p>
          </div>
        </b-col>
        <b-col md="3" class="mb-3">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Product views</h6>
            <p class="h5 mb-0">{{ analytics.total_views ?? 0 }}</p>
          </div>
        </b-col>
        <b-col md="3" class="mb-3">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Reviews (avg)</h6>
            <p class="h5 mb-0">{{ ratingLabel(analytics.average_rating, analytics.total_reviews) }}</p>
          </div>
        </b-col>
      </b-row>
    </b-card>

    <b-card title="Orders by status" class="mb-4">
      <div v-if="ordersByStatusKeys.length" class="d-flex flex-wrap gap-2">
        <b-badge
          v-for="status in ordersByStatusKeys"
          :key="status"
          variant="light"
          class="text-dark border px-3 py-2"
        >
          {{ status }}: {{ analytics.orders_by_status?.[status] ?? 0 }}
        </b-badge>
      </div>
      <p v-else class="text-muted mb-0">No orders yet.</p>
    </b-card>

    <b-card title="Operations" class="mb-4">
      <b-row>
        <b-col md="6">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Return requests</h6>
            <p class="h5 mb-0">{{ analytics.returns_count ?? 0 }}</p>
          </div>
        </b-col>
        <b-col md="6">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Last order</h6>
            <p class="h5 mb-0">{{ lastOrderLabel(analytics.last_order_at) }}</p>
          </div>
        </b-col>
      </b-row>
    </b-card>

    <b-card title="Payout" class="mb-4">
      <b-row>
        <b-col md="6">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Paid out</h6>
            <p class="h5 mb-0">{{ formatMoney(analytics.paid_out) }}</p>
          </div>
        </b-col>
        <b-col md="6">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Pending payout</h6>
            <p class="h5 mb-0">{{ formatMoney(analytics.pending_payout) }}</p>
          </div>
        </b-col>
      </b-row>
    </b-card>

    <b-card title="Conversion (view → order)" class="mb-4">
      <b-row>
        <b-col md="4">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Unique viewers</h6>
            <p class="h5 mb-0">{{ analytics.total_viewers ?? 0 }}</p>
          </div>
        </b-col>
        <b-col md="4">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Orders from viewers</h6>
            <p class="h5 mb-0">{{ analytics.orders_from_viewers ?? 0 }}</p>
          </div>
        </b-col>
        <b-col md="4">
          <div class="stat-card">
            <h6 class="text-muted text-uppercase small mb-1">Conversion rate</h6>
            <p class="h5 mb-0">{{ conversionLabel(analytics.conversion_rate) }}</p>
          </div>
        </b-col>
      </b-row>
    </b-card>

    <b-card v-if="(analytics.top_products?.length ?? 0) > 0" title="Top products by revenue" class="mb-4">
      <b-table :items="topProductsWithFormattedRevenue" :fields="topProductFields" striped small />
    </b-card>

    <b-card v-if="salesChartOptions" title="Sales over time" class="mb-4">
      <ApexChart :chart="salesChartOptions" />
    </b-card>

    <p v-if="loading" class="text-muted">Loading…</p>
    <p v-else-if="error" class="text-danger">{{ error }}</p>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import ApexChart from '@/components/ApexChart.vue'
import { analyticsSellerApi, type SellerAnalyticsResponse } from '@/api'
import type { ApexChartType } from '@/types'

const period = ref<'7d' | '30d' | undefined>(undefined)
const analytics = ref<SellerAnalyticsResponse>({
  total_orders: 0,
  total_sales: 0,
  orders_this_week: 0,
  orders_this_month: 0,
  sales_this_week: 0,
  sales_this_month: 0,
  sales_today: 0,
  orders_by_status: {},
  average_order_value: 0,
  products_count: 0,
  products_low_stock_count: 0,
  total_views: 0,
  returns_count: 0,
  average_rating: 0,
  total_reviews: 0,
  last_order_at: null,
})
const loading = ref(true)
const error = ref('')

const ordersByStatusKeys = computed(() => Object.keys(analytics.value.orders_by_status || {}))

const topProductsWithFormattedRevenue = computed(() => {
  const list = analytics.value.top_products ?? []
  return list.map((p) => ({
    ...p,
    revenue: p.revenue != null ? formatMoney(p.revenue) : '—',
  }))
})

const topProductFields = [
  { key: 'title', label: 'Product' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'units_sold', label: 'Units sold' },
]

const salesChartOptions = computed<ApexChartType | null>(() => {
  const series = analytics.value.sales_series
  if (!series?.length) return null
  const categories = series.map((p) => p.date ?? '')
  const salesData = series.map((p) => p.sales ?? 0)
  return {
    height: 280,
    type: 'bar',
    series: [{ name: 'Sales', data: salesData }],
    options: {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
      xaxis: { categories },
      yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
      grid: { strokeDashArray: 3, xaxis: { lines: { show: false } } },
      dataLabels: { enabled: false },
    },
  }
})

function setPeriod(p: '7d' | '30d' | undefined) {
  period.value = p
  load()
}

function formatMoney(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '0'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

function ratingLabel(avg: number | undefined, count: number | undefined): string {
  if (avg == null || count == null || count === 0) return '—'
  return `${Number(avg).toFixed(1)} (${count})`
}

function lastOrderLabel(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

function conversionLabel(rate: number | undefined): string {
  if (rate == null || Number.isNaN(rate)) return '—'
  return `${Number(rate).toFixed(1)}%`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await analyticsSellerApi.overview({ period: period.value })
    if (data) analytics.value = data
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to load analytics'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.stat-card {
  padding: 0.25rem 0;
}
</style>
