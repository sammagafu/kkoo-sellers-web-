<template>
  <VerticalLayout>
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h2 class="mb-1">Investor Analytics</h2>
        <p class="text-muted mb-0 small">GMV, orders, deals, sales by channel, device, and delivery area — Tanzania launch focus.</p>
      </div>
      <b-button-group size="sm">
        <b-button
          v-for="p in periodOptions"
          :key="p.value"
          :variant="period === p.value ? 'primary' : 'outline-primary'"
          @click="setPeriod(p.value)"
        >
          {{ p.label }}
        </b-button>
      </b-button-group>
    </div>

    <b-alert v-if="error" variant="danger" show class="mb-3">{{ error }}</b-alert>
    <div v-if="loading" class="text-muted py-5 text-center">Loading analytics…</div>

    <template v-else-if="data">
      <b-row class="g-3 mb-4">
        <b-col sm="6" lg="3">
          <b-card class="h-100 border-0 shadow-sm">
            <h6 class="text-muted text-uppercase small mb-1">GMV</h6>
            <p class="h4 mb-1">{{ formatMoney(data.summary?.gmv) }}</p>
            <p v-if="growthLabel(data.growth?.gmv_pct)" class="small mb-0" :class="growthClass(data.growth?.gmv_pct)">
              {{ growthLabel(data.growth?.gmv_pct) }} vs prior period
            </p>
          </b-card>
        </b-col>
        <b-col sm="6" lg="3">
          <b-card class="h-100 border-0 shadow-sm">
            <h6 class="text-muted text-uppercase small mb-1">Orders</h6>
            <p class="h4 mb-1">{{ data.summary?.orders ?? 0 }}</p>
            <p v-if="growthLabel(data.growth?.orders_pct)" class="small mb-0" :class="growthClass(data.growth?.orders_pct)">
              {{ growthLabel(data.growth?.orders_pct) }} vs prior period
            </p>
          </b-card>
        </b-col>
        <b-col sm="6" lg="3">
          <b-card class="h-100 border-0 shadow-sm">
            <h6 class="text-muted text-uppercase small mb-1">Avg order value</h6>
            <p class="h4 mb-0">{{ formatMoney(data.summary?.average_order_value) }}</p>
          </b-card>
        </b-col>
        <b-col sm="6" lg="3">
          <b-card class="h-100 border-0 shadow-sm">
            <h6 class="text-muted text-uppercase small mb-1">New users</h6>
            <p class="h4 mb-1">{{ data.summary?.new_users ?? 0 }}</p>
            <p v-if="growthLabel(data.growth?.users_pct)" class="small mb-0" :class="growthClass(data.growth?.users_pct)">
              {{ growthLabel(data.growth?.users_pct) }} vs prior period
            </p>
          </b-card>
        </b-col>
      </b-row>

      <b-card v-if="gmvChart" title="GMV trend" class="mb-4">
        <ApexChart :chart="gmvChart" />
      </b-card>

      <b-row class="g-3 mb-4">
        <b-col lg="6">
          <b-card title="Sales by channel" class="h-100">
            <b-table
              v-if="(data.sales_by_channel?.length ?? 0) > 0"
              :items="data.sales_by_channel"
              :fields="channelFields"
              small
              responsive
              hover
            >
              <template #cell(channel)="{ value }">
                <span class="text-capitalize">{{ value || 'unknown' }}</span>
              </template>
              <template #cell(gmv)="{ value }">{{ formatMoney(value) }}</template>
            </b-table>
            <p v-else class="text-muted mb-0">No paid orders in this period.</p>
          </b-card>
        </b-col>
        <b-col lg="6">
          <b-card title="Sales by device (app / web)" class="h-100">
            <b-table
              v-if="(data.sales_by_device?.length ?? 0) > 0"
              :items="data.sales_by_device"
              :fields="deviceFields"
              small
              responsive
              hover
            >
              <template #cell(device)="{ value }">
                <span class="text-capitalize">{{ value || 'unknown' }}</span>
              </template>
              <template #cell(gmv)="{ value }">{{ formatMoney(value) }}</template>
            </b-table>
            <p v-else class="text-muted mb-0">Device data appears when buyer apps send analytics events.</p>
          </b-card>
        </b-col>
      </b-row>

      <b-row class="g-3 mb-4">
        <b-col lg="7">
          <b-card title="Sales by location">
            <b-table
              v-if="(data.sales_by_location?.length ?? 0) > 0"
              :items="data.sales_by_location"
              :fields="locationFields"
              small
              responsive
              hover
            >
              <template #cell(name)="{ item }">
                {{ item.name || item.delivery_zone || 'Unspecified' }}
              </template>
              <template #cell(gmv)="{ value }">{{ formatMoney(value) }}</template>
            </b-table>
            <p v-else class="text-muted mb-0">No location-tagged orders yet.</p>
          </b-card>
        </b-col>
        <b-col lg="5">
          <b-card title="Deals & discounts" class="h-100">
            <ul class="list-unstyled mb-0">
              <li class="d-flex justify-content-between py-2 border-bottom">
                <span>Active promotions</span>
                <strong>{{ data.deals?.active_promotions ?? 0 }}</strong>
              </li>
              <li class="d-flex justify-content-between py-2 border-bottom">
                <span>Active flash sales</span>
                <strong>{{ data.deals?.active_flash_sales ?? 0 }}</strong>
              </li>
              <li class="d-flex justify-content-between py-2 border-bottom">
                <span>Orders with discount</span>
                <strong>{{ data.deals?.orders_with_discount ?? 0 }}</strong>
              </li>
              <li class="d-flex justify-content-between py-2">
                <span>Total discount given</span>
                <strong>{{ formatMoney(data.deals?.total_discount_amount) }}</strong>
              </li>
            </ul>
          </b-card>
        </b-col>
      </b-row>

      <b-row class="g-3 mb-4">
        <b-col lg="7">
          <b-card title="Promotion performance">
            <b-table
              v-if="(data.promotion_performance?.length ?? 0) > 0"
              :items="data.promotion_performance"
              :fields="promoFields"
              small
              responsive
              hover
            >
              <template #cell(name)="{ item }">
                {{ item.name || 'Promotion' }}
                <b-badge v-if="item.is_active" variant="success" class="ms-1">Active</b-badge>
              </template>
              <template #cell(target_app_key)="{ value }">
                <span class="text-capitalize">{{ value || 'all' }}</span>
              </template>
              <template #cell(total_burn)="{ value }">{{ formatMoney(value) }}</template>
              <template #cell(redemption_rate_pct)="{ value }">
                {{ value != null ? `${Number(value).toFixed(1)}%` : '—' }}
              </template>
            </b-table>
            <p v-else class="text-muted mb-0">No promotions configured yet.</p>
          </b-card>
        </b-col>
        <b-col lg="5">
          <b-card title="Flash sale performance" class="h-100">
            <b-table
              v-if="(data.flash_sale_performance?.length ?? 0) > 0"
              :items="data.flash_sale_performance"
              :fields="flashFields"
              small
              responsive
              hover
            >
              <template #cell(name)="{ item }">
                {{ item.name || 'Flash sale' }}
                <b-badge v-if="item.is_active" variant="warning" class="ms-1">Live</b-badge>
              </template>
              <template #cell(vertical)="{ value }">
                <span class="text-capitalize">{{ value || 'all' }}</span>
              </template>
            </b-table>
            <p v-else class="text-muted mb-0">No flash sales yet.</p>
          </b-card>
        </b-col>
      </b-row>

      <b-card title="Top categories" class="mb-4">
        <b-table
          v-if="(data.top_categories?.length ?? 0) > 0"
          :items="data.top_categories"
          :fields="categoryFields"
          small
          responsive
          hover
        >
          <template #cell(gmv)="{ value }">{{ formatMoney(value) }}</template>
        </b-table>
        <p v-else class="text-muted mb-0">No category sales in this period.</p>
      </b-card>

      <h5 class="mb-3">Navigation &amp; exit pages</h5>
      <p class="text-muted small mb-3">
        Screen views and exits from the buyer app (Firebase + in-house) and buyer web.
      </p>
      <div v-if="navLoading" class="text-muted py-3">Loading navigation analytics…</div>
      <b-row v-else class="g-3 mb-4">
        <b-col lg="6">
          <b-card title="Top screens (views)" class="h-100">
            <b-table
              v-if="navViews.length > 0"
              :items="navViews"
              :fields="navFields"
              small
              responsive
              hover
            />
            <p v-else class="text-muted mb-0">No screen views yet — use the buyer app or web after deploy.</p>
          </b-card>
        </b-col>
        <b-col lg="6">
          <b-card title="Top exit pages" class="h-100">
            <b-table
              v-if="navExits.length > 0"
              :items="navExits"
              :fields="navFields"
              small
              responsive
              hover
            />
            <p v-else class="text-muted mb-0">No exit events yet.</p>
          </b-card>
        </b-col>
      </b-row>
    </template>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import ApexChart from '@/components/ApexChart.vue'
import { analyticsAdminApi, type AdminDashboardResponse } from '@/api'
import type { ApexChartType } from '@/types'

type Period = '7d' | '30d' | '90d' | 'all'

const periodOptions: { value: Period; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
]

const period = ref<Period>('30d')
const data = ref<AdminDashboardResponse | null>(null)
const loading = ref(true)
const error = ref('')
const navLoading = ref(true)
const navViews = ref<{ surface?: string; vertical?: string; count?: number }[]>([])
const navExits = ref<{ surface?: string; vertical?: string; count?: number }[]>([])

const navFields = [
  { key: 'surface', label: 'Screen' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'count', label: 'Events' },
]

const channelFields = [
  { key: 'channel', label: 'Channel' },
  { key: 'orders', label: 'Orders' },
  { key: 'gmv', label: 'GMV (TZS)' },
]
const deviceFields = [
  { key: 'device', label: 'Device' },
  { key: 'orders', label: 'Orders' },
  { key: 'gmv', label: 'GMV (TZS)' },
]
const locationFields = [
  { key: 'name', label: 'Area / zone' },
  { key: 'orders', label: 'Orders' },
  { key: 'gmv', label: 'GMV (TZS)' },
]
const categoryFields = [
  { key: 'category_name', label: 'Category' },
  { key: 'units', label: 'Units' },
  { key: 'gmv', label: 'GMV (TZS)' },
]
const promoFields = [
  { key: 'name', label: 'Promotion' },
  { key: 'target_app_key', label: 'App' },
  { key: 'uses_count', label: 'Uses' },
  { key: 'total_burn', label: 'Burn (TZS)' },
  { key: 'redemption_rate_pct', label: 'Cap %' },
]
const flashFields = [
  { key: 'name', label: 'Flash sale' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'units_sold', label: 'Units sold' },
  { key: 'item_count', label: 'SKUs' },
]

const gmvChart = computed<ApexChartType | null>(() => {
  const series = data.value?.gmv_series
  if (!series?.length) return null
  return {
    height: 300,
    type: 'area',
    series: [{ name: 'GMV', data: series.map((p) => p.gmv ?? 0) }],
    options: {
      chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
      xaxis: { categories: series.map((p) => p.date ?? '') },
      yaxis: { labels: { formatter: (v: number) => formatMoney(v) } },
      dataLabels: { enabled: false },
      grid: { strokeDashArray: 3 },
    },
  }
})

function formatMoney(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return 'TZS 0'
  return `TZS ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
}

function growthLabel(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return ''
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function growthClass(pct: number | null | undefined): string {
  if (pct == null) return 'text-muted'
  return pct >= 0 ? 'text-success' : 'text-danger'
}

function setPeriod(p: Period) {
  period.value = p
  load()
}

async function loadNavigation() {
  navLoading.value = true
  try {
    const hours = period.value === '7d' ? 168 : period.value === '90d' ? 2160 : period.value === 'all' ? 8760 : 720
    const [viewsRes, exitsRes] = await Promise.all([
      analyticsAdminApi.eventAggregates({ event_name: 'screen_view', hours, limit: 20 }),
      analyticsAdminApi.eventAggregates({ event_name: 'screen_exit', hours, limit: 20 }),
    ])
    navViews.value = (viewsRes.data.results ?? []).map((r) => ({
      surface: r.surface,
      vertical: r.vertical,
      count: r.count,
    }))
    navExits.value = (exitsRes.data.results ?? []).map((r) => ({
      surface: r.surface,
      vertical: r.vertical,
      count: r.count,
    }))
  } catch {
    navViews.value = []
    navExits.value = []
  } finally {
    navLoading.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data: res } = await analyticsAdminApi.dashboard({ period: period.value })
    data.value = res
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string; error?: string } } }
    error.value = err.response?.data?.detail ?? err.response?.data?.error ?? 'Failed to load analytics'
    data.value = null
  } finally {
    loading.value = false
  }
  void loadNavigation()
}

onMounted(load)
</script>
