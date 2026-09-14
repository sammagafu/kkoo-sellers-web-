<template>
  <VerticalLayout>
    <b-card>
      <div class="d-flex flex-wrap align-items-start gap-3 mb-3">
        <div class="me-auto">
          <h1 class="h4 mb-1">Verify documents</h1>
          <p class="text-muted mb-0">
            Open a file, check it looks right, then approve or ask the seller to send again.
          </p>
        </div>
        <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="load" />
        <b-button variant="outline-primary" size="sm" @click="load">Refresh</b-button>
      </div>

      <div v-if="pendingCount > 0 && statusFilter === 'pending'" class="doc-review__banner mb-3">
        {{ pendingCount }} waiting for review
      </div>

      <p v-if="error" class="text-danger">{{ error }}</p>

      <div v-if="items.length" class="doc-review">
        <div class="doc-review__list">
          <button
            v-for="item in items"
            :key="String(item.id)"
            type="button"
            class="doc-review__row"
            :class="{ 'doc-review__row--active': selected?.id === item.id }"
            @click="selected = item"
          >
            <div class="doc-review__row-main">
              <strong>{{ docTypeLabel(item.document_type) }}</strong>
              <span class="doc-review__shop">{{ sellerLabel(item) }}</span>
            </div>
            <div class="doc-review__row-meta">
              <b-badge :variant="statusVariant(item.status)">{{ statusLabel(item.status) }}</b-badge>
              <span class="text-muted small">{{ formatDate(item.submitted_at || item.created_at) }}</span>
            </div>
          </button>
        </div>

        <aside v-if="selected" class="doc-review__panel">
          <div class="doc-review__panel-head">
            <div>
              <h2 class="h5 mb-1">{{ docTypeLabel(selected.document_type) }}</h2>
              <p class="mb-0">
                <router-link
                  v-if="sellerId(selected)"
                  :to="{ name: 'admin.sellers.detail', params: { id: String(sellerId(selected)) } }"
                >
                  {{ sellerLabel(selected) }}
                </router-link>
                <span v-else>{{ sellerLabel(selected) }}</span>
              </p>
              <p v-if="selected.seller_phone" class="text-muted small mb-0">{{ selected.seller_phone }}</p>
            </div>
            <b-badge :variant="statusVariant(selected.status)">{{ statusLabel(selected.status) }}</b-badge>
          </div>

          <div class="doc-review__preview mb-3">
            <template v-if="previewUrl(selected)">
              <img
                v-if="isImage(selected)"
                :src="previewUrl(selected)!"
                alt="Document preview"
                class="doc-review__img"
              />
              <iframe
                v-else-if="isPdf(selected)"
                :src="previewUrl(selected)!"
                title="Document preview"
                class="doc-review__iframe"
              />
              <div v-else class="doc-review__file-fallback">
                <p class="mb-2">Preview not available for this file type.</p>
                <a :href="previewUrl(selected)!" target="_blank" rel="noopener">Open file</a>
              </div>
            </template>
            <p v-else class="text-muted mb-0">No file attached.</p>
          </div>

          <p v-if="selected.rejection_reason" class="small text-danger mb-3">
            Last note to seller: {{ selected.rejection_reason }}
          </p>

          <div v-if="selected.status === 'pending'" class="d-flex flex-wrap gap-2">
            <b-button variant="success" :disabled="busy" @click="approve(selected)">
              {{ busy ? 'Working…' : 'Looks good — approve' }}
            </b-button>
            <b-button variant="outline-danger" :disabled="busy" @click="openReject(selected)">
              Send again
            </b-button>
            <a
              v-if="previewUrl(selected)"
              class="btn btn-outline-secondary btn-sm align-self-center"
              :href="previewUrl(selected)!"
              target="_blank"
              rel="noopener"
            >
              Open full size
            </a>
          </div>
          <p v-else class="text-muted small mb-0">Already reviewed. Filter to “Waiting” to see new uploads.</p>
        </aside>

        <p v-else class="doc-review__empty text-muted">Select a document on the left to review.</p>
      </div>

      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState
        v-else
        title="Nothing to review"
        message="When sellers upload documents, they will show up here."
      />
    </b-card>

    <b-modal
      v-model="rejectShow"
      title="Ask seller to send again"
      ok-title="Send note"
      ok-variant="danger"
      :ok-disabled="!rejectReason.trim() || busy"
      @ok.prevent="confirmReject"
      @hidden="clearReject"
    >
      <p class="text-muted small">Pick a reason or write your own. The seller will see this.</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-button
          v-for="chip in rejectChips"
          :key="chip"
          size="sm"
          :variant="rejectReason === chip ? 'danger' : 'outline-secondary'"
          @click="rejectReason = chip"
        >
          {{ chip }}
        </b-button>
      </div>
      <b-form-textarea v-model="rejectReason" rows="3" placeholder="What should they fix?" />
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { kycAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { toastError, toastSuccess } from '@/utils/toast'

type DocRow = Record<string, unknown>

const statusFilter = ref('pending')
const statusOptions = [
  { value: 'pending', text: 'Waiting' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Send again' },
  { value: '', text: 'All' },
]

const rejectChips = [
  'Photo is blurry — please retake',
  'Wrong document type',
  'Document expired',
  'Name does not match the business',
  'File could not be opened',
]

const loading = ref(false)
const busy = ref(false)
const error = ref('')
const items = ref<DocRow[]>([])
const selected = ref<DocRow | null>(null)

const rejectShow = ref(false)
const rejectTarget = ref<DocRow | null>(null)
const rejectReason = ref('')

const pendingCount = computed(() =>
  items.value.filter((d) => String(d.status ?? '').toLowerCase() === 'pending').length,
)

const DOC_TYPE_LABELS: Record<string, string> = {
  business_license: 'Business license',
  tax_certificate: 'Tax certificate',
  financial_reports: 'Financial reports',
  national_id: 'National ID',
  passport: 'Passport',
  tin_certificate: 'TIN certificate',
}

function docTypeLabel(raw: unknown): string {
  const key = String(raw ?? '').trim()
  if (!key) return 'Document'
  return DOC_TYPE_LABELS[key] ?? key.replace(/_/g, ' ')
}

function statusLabel(s: unknown): string {
  const v = String(s ?? '').toLowerCase()
  if (v === 'approved') return 'OK'
  if (v === 'rejected') return 'Send again'
  if (v === 'pending') return 'Waiting'
  return String(s ?? '—')
}

function statusVariant(s: unknown): string {
  const v = String(s ?? '').toLowerCase()
  if (v === 'approved') return 'success'
  if (v === 'rejected') return 'danger'
  return 'warning'
}

function sellerId(d: DocRow): number | null {
  const s = d.seller_profile_id ?? d.seller_id ?? (d.seller as DocRow | undefined)?.id
  return s != null ? Number(s) : null
}

function sellerLabel(d: DocRow): string {
  const name = String(d.business_name || d.seller_name || '').trim()
  if (name) return name
  const nested = d.seller as DocRow | undefined
  const fromNested = String(nested?.business_name ?? '').trim()
  if (fromNested) return fromNested
  const id = sellerId(d)
  return id ? `Seller #${id}` : 'Unknown seller'
}

function previewUrl(d: DocRow): string | null {
  return resolveAssetUrl(String(d.file_url || d.file || ''))
}

function filePath(d: DocRow): string {
  return String(d.file_url || d.file || '').toLowerCase()
}

function isImage(d: DocRow): boolean {
  return /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(filePath(d))
}

function isPdf(d: DocRow): boolean {
  return /\.pdf(\?|$)/i.test(filePath(d))
}

function formatDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function normalizeList(data: unknown): DocRow[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as DocRow[]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await kycAdminApi.list({ status: statusFilter.value || undefined })
    items.value = normalizeList(data)
    const selId = selected.value?.id
    selected.value = selId != null
      ? items.value.find((i) => i.id === selId) ?? items.value[0] ?? null
      : items.value[0] ?? null
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Could not load documents')
    items.value = []
    selected.value = null
    toastError(error.value)
  } finally {
    loading.value = false
  }
}

async function approve(item: DocRow) {
  const id = Number(item.id)
  if (!id || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await kycAdminApi.approve(id)
    toastSuccess('Document approved')
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Approve failed')
    toastError(error.value)
  } finally {
    busy.value = false
  }
}

function openReject(item: DocRow) {
  rejectTarget.value = item
  rejectReason.value = ''
  rejectShow.value = true
}

function clearReject() {
  rejectTarget.value = null
  rejectReason.value = ''
}

async function confirmReject() {
  const item = rejectTarget.value
  const id = Number(item?.id)
  const reason = rejectReason.value.trim()
  if (!id || !reason || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await kycAdminApi.reject(id, { reason, rejection_reason: reason })
    rejectShow.value = false
    clearReject()
    toastSuccess('Seller asked to send again')
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Could not reject')
    toastError(error.value)
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.doc-review__banner {
  background: #fff8e6;
  border: 1px solid #f0d78c;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  font-weight: 600;
  color: #6b5200;
}
.doc-review {
  display: grid;
  grid-template-columns: minmax(240px, 340px) 1fr;
  gap: 1rem;
  min-height: 420px;
}
.doc-review__list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 70vh;
  overflow: auto;
  padding-right: 0.25rem;
}
.doc-review__row {
  text-align: left;
  border: 1px solid #e6e8ec;
  background: #fff;
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.doc-review__row:hover {
  border-color: #b8c0cc;
}
.doc-review__row--active {
  border-color: #2f6fed;
  background: #f3f7ff;
}
.doc-review__row-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-bottom: 0.35rem;
}
.doc-review__shop {
  color: #5c6570;
  font-size: 0.9rem;
}
.doc-review__row-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.doc-review__panel {
  border: 1px solid #e6e8ec;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  background: #fafbfc;
}
.doc-review__panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}
.doc-review__preview {
  background: #fff;
  border: 1px solid #e6e8ec;
  border-radius: 10px;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0.5rem;
}
.doc-review__img {
  max-width: 100%;
  max-height: 420px;
  object-fit: contain;
}
.doc-review__iframe {
  width: 100%;
  height: 420px;
  border: 0;
}
.doc-review__file-fallback,
.doc-review__empty {
  padding: 2rem 1rem;
  text-align: center;
}
@media (max-width: 900px) {
  .doc-review {
    grid-template-columns: 1fr;
  }
  .doc-review__list {
    max-height: 240px;
  }
}
</style>
