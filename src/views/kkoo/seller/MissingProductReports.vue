<template>
  <VerticalLayout class="insights-page">
    <b-row class="page-header-row mb-4">
      <b-col>
        <h4 class="page-heading mb-0">Missing product reports</h4>
        <p class="page-subtitle text-muted mb-0">
          Buyers asked for products you have not listed yet. Review their photos and add items to your catalog.
        </p>
      </b-col>
    </b-row>

    <b-row class="mb-4">
      <b-col md="6" lg="4" class="mb-3">
        <b-card no-body class="insights-stat-card insights-stat-card--hero h-100">
          <b-card-body class="d-flex align-items-center gap-3">
            <div class="insights-stat-icon-wrap insights-stat-icon--primary rounded">
              <Icon icon="solar:box-bold-duotone" class="insights-stat-icon" />
            </div>
            <div class="min-w-0">
              <p class="insights-stat-label mb-0">Open reports</p>
              <p class="insights-stat-value mb-0">{{ pendingCount }}</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <b-card>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="load" />
        <b-button variant="primary" @click="load">Refresh</b-button>
        <router-link :to="createProductRoute()" class="btn btn-outline-primary">
          Add product
        </router-link>
      </div>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(product_name)="row">
          <span class="fw-medium">{{ row.item.product_name }}</span>
        </template>
        <template #cell(photos)="row">
          {{ photoCount(row.item) }}
        </template>
        <template #cell(status)="row">
          <b-badge :variant="statusVariant(String(row.item.status ?? ''))">
            {{ row.item.status || 'pending' }}
          </b-badge>
        </template>
        <template #cell(created_at)="row">
          {{ formatDate(row.item.created_at) }}
        </template>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-primary" @click="openDetail(row.item)">View</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted mb-0">Loading…</p>
      <p v-else-if="error" class="text-danger mb-0">{{ error }}</p>
      <EmptyState v-else />
    </b-card>

    <b-modal v-model="showDetail" title="Report detail" size="lg" @hidden="selected = null">
      <template v-if="selected">
        <dl class="row mb-3">
          <dt class="col-sm-3">Product</dt>
          <dd class="col-sm-9">{{ selected.product_name }}</dd>
          <dt class="col-sm-3">Details</dt>
          <dd class="col-sm-9">{{ selected.description || '—' }}</dd>
          <dt class="col-sm-3">Submitted</dt>
          <dd class="col-sm-9">{{ formatDate(selected.created_at) }}</dd>
        </dl>
        <div v-if="reportPhotos.length" class="d-flex flex-wrap gap-2">
          <a
            v-for="(url, i) in reportPhotos"
            :key="i"
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img :src="url" :alt="`Report photo ${i + 1}`" class="report-photo-thumb" />
          </a>
        </div>
        <p v-else class="text-muted">No photos attached.</p>
      </template>
      <template #footer>
        <b-button variant="secondary" @click="showDetail = false">Close</b-button>
        <router-link :to="createProductRoute(selected)" class="btn btn-primary">
          Add this product
        </router-link>
      </template>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { catalogSellerApi, type MissingProductReportRow } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { resolveAssetUrl } from '@/utils/assetUrl'

const loading = ref(false)
const error = ref('')
const items = ref<MissingProductReportRow[]>([])
const statusFilter = ref('')
const showDetail = ref(false)
const selected = ref<MissingProductReportRow | null>(null)

const statusOptions = [
  { value: '', text: 'All statuses' },
  { value: 'pending', text: 'Pending' },
  { value: 'reviewed', text: 'Reviewed' },
  { value: 'added', text: 'Added' },
  { value: 'dismissed', text: 'Dismissed' },
]

const fields = [
  { key: 'product_name', label: 'Product' },
  { key: 'photos', label: 'Photos' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Submitted' },
  { key: 'actions', label: '' },
]

const pendingCount = computed(
  () => items.value.filter((r) => (r.status ?? 'pending') === 'pending').length,
)

const reportPhotos = computed(() => {
  const media = selected.value?.media ?? []
  return media
    .map((m: { file_url?: string }) => resolveAssetUrl(m.file_url ?? ''))
    .filter((u: string | null): u is string => !!u)
})

function photoCount(row: MissingProductReportRow): number {
  return row.media?.length ?? 0
}

function statusVariant(status: string): string {
  switch (status) {
    case 'added':
      return 'success'
    case 'reviewed':
      return 'info'
    case 'dismissed':
      return 'secondary'
    default:
      return 'warning'
  }
}

function formatDate(value: unknown): string {
  if (!value) return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString()
}

function openDetail(row: MissingProductReportRow) {
  selected.value = row
  showDetail.value = true
}

function createProductRoute(report?: MissingProductReportRow | null) {
  const query: Record<string, string> = {}
  const title = String(report?.product_name ?? '').trim()
  if (title) query.title = title
  const desc = String(report?.description ?? '').trim()
  if (desc) query.description = desc
  return {
    name: 'seller.products.create',
    ...(Object.keys(query).length ? { query } : {}),
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await catalogSellerApi.listMissingProductReports({
      limit: 100,
      ...(statusFilter.value && { status: statusFilter.value }),
    })
    items.value = data.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load reports')
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.insights-page .page-heading { font-size: 1.25rem; font-weight: 600; color: var(--bs-headings-color); }
.insights-page .page-subtitle { font-size: 0.875rem; line-height: 1.5; color: var(--bs-secondary-color); }
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
.insights-stat-card--hero {
  background: #5C308F !important;
  box-shadow: 0 8px 24px rgba(92, 48, 143, 0.35);
}
.insights-stat-card--hero .insights-stat-label { color: rgba(255, 255, 255, 0.85); }
.insights-stat-card--hero .insights-stat-value { color: #fff; }
.insights-stat-card--hero .insights-stat-icon-wrap { background: rgba(255, 255, 255, 0.2) !important; }
.insights-stat-card--hero .insights-stat-icon { color: #F7A829 !important; }
.report-photo-thumb {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--bs-border-color);
}
</style>
