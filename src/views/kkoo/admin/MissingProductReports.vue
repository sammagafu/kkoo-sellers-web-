<template>
  <VerticalLayout>
    <b-card title="Missing product reports">
      <p class="text-muted mb-3">
        Buyers submit these when they cannot find a product. Review photos, update status, and add items to the catalog.
      </p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="load" />
        <b-button variant="primary" @click="load">Refresh</b-button>
      </div>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(product_name)="row">
          <span class="fw-medium">{{ row.item.product_name }}</span>
        </template>
        <template #cell(photos)="row">
          <span>{{ photoCount(row.item) }}</span>
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
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <p v-else-if="error" class="text-danger">{{ error }}</p>
      <EmptyState v-else />
      <p v-if="total > 0" class="text-muted small mt-2">Showing {{ items.length }} of {{ total }} report(s)</p>

      <b-modal v-model="showDetail" title="Report detail" size="lg" @hidden="selected = null">
        <template v-if="selected">
          <dl class="row mb-3">
            <dt class="col-sm-3">Product</dt>
            <dd class="col-sm-9">{{ selected.product_name }}</dd>
            <dt class="col-sm-3">Description</dt>
            <dd class="col-sm-9">{{ selected.description || '—' }}</dd>
            <dt class="col-sm-3">Buyer</dt>
            <dd class="col-sm-9">
              <router-link
                v-if="selected.user_id"
                :to="{ name: 'admin.users.detail', params: { id: String(selected.user_id) } }"
              >
                User #{{ selected.user_id }}
              </router-link>
              <span v-else>—</span>
            </dd>
            <dt class="col-sm-3">Seller</dt>
            <dd class="col-sm-9">
              <router-link
                v-if="selected.seller_id"
                :to="{ name: 'admin.users.detail', params: { id: String(selected.seller_id) } }"
              >
                Seller user #{{ selected.seller_id }}
              </router-link>
              <span v-else>—</span>
            </dd>
            <dt class="col-sm-3">Submitted</dt>
            <dd class="col-sm-9">{{ formatDate(selected.created_at) }}</dd>
          </dl>

          <div v-if="reportPhotos.length" class="mb-3">
            <p class="fw-medium mb-2">Photos</p>
            <div class="d-flex flex-wrap gap-2">
              <a
                v-for="(url, i) in reportPhotos"
                :key="i"
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="report-photo-link"
              >
                <img :src="url" :alt="`Report photo ${i + 1}`" class="report-photo-thumb" />
              </a>
            </div>
          </div>

          <b-form-group label="Status">
            <b-form-select v-model="editStatus" :options="statusEditOptions" />
          </b-form-group>
          <p v-if="updateError" class="text-danger small">{{ updateError }}</p>
        </template>
        <template #footer>
          <b-button variant="secondary" @click="showDetail = false">Close</b-button>
          <router-link
            v-if="selected"
            :to="createProductRoute(selected)"
            class="btn btn-outline-primary"
          >
            Add product
          </router-link>
          <b-button variant="primary" :disabled="updating || !selected" @click="saveStatus">
            {{ updating ? 'Saving…' : 'Update status' }}
          </b-button>
        </template>
      </b-modal>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { catalogAdminApi, type MissingProductReportRow, type MissingProductReportStatus } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { resolveAssetUrl } from '@/utils/assetUrl'

const loading = ref(false)
const error = ref('')
const items = ref<MissingProductReportRow[]>([])
const total = ref(0)
const statusFilter = ref('')
const showDetail = ref(false)
const selected = ref<MissingProductReportRow | null>(null)
const editStatus = ref<MissingProductReportStatus>('pending')
const updating = ref(false)
const updateError = ref('')

const statusOptions = [
  { value: '', text: 'All statuses' },
  { value: 'pending', text: 'Pending' },
  { value: 'reviewed', text: 'Reviewed' },
  { value: 'added', text: 'Added' },
  { value: 'dismissed', text: 'Dismissed' },
]

const statusEditOptions = [
  { value: 'pending', text: 'Pending' },
  { value: 'reviewed', text: 'Reviewed' },
  { value: 'added', text: 'Added' },
  { value: 'dismissed', text: 'Dismissed' },
]

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'product_name', label: 'Product' },
  { key: 'user_id', label: 'Buyer' },
  { key: 'seller_id', label: 'Seller' },
  { key: 'photos', label: 'Photos' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Submitted' },
  { key: 'actions', label: '' },
]

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
  editStatus.value = (row.status as MissingProductReportStatus) || 'pending'
  updateError.value = ''
  showDetail.value = true
}

function createProductRoute(report: MissingProductReportRow) {
  const query: Record<string, string> = {}
  const title = String(report.product_name ?? '').trim()
  if (title) query.title = title
  const desc = String(report.description ?? '').trim()
  if (desc) query.description = desc
  return {
    name: 'admin.catalog.products.create',
    ...(Object.keys(query).length ? { query } : {}),
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await catalogAdminApi.listMissingProductReports({
      limit: 100,
      ...(statusFilter.value && { status: statusFilter.value }),
    })
    items.value = data.results ?? []
    total.value = data.total ?? items.value.length
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load reports')
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function saveStatus() {
  if (!selected.value?.id) return
  updating.value = true
  updateError.value = ''
  try {
    const { data } = await catalogAdminApi.updateMissingProductReport(selected.value.id, {
      status: editStatus.value,
    })
    const idx = items.value.findIndex((r) => r.id === data.id)
    if (idx >= 0) items.value[idx] = { ...items.value[idx], ...data }
    selected.value = { ...selected.value, ...data }
    showDetail.value = false
  } catch (e: unknown) {
    updateError.value = formatApiError(e, 'Failed to update status')
  } finally {
    updating.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.report-photo-thumb {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--bs-border-color);
}
.report-photo-link:hover .report-photo-thumb {
  opacity: 0.9;
}
</style>
