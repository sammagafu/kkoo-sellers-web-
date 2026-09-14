<template>
  <VerticalLayout>
    <b-card>
      <div class="mb-3">
        <h1 class="h4 mb-1">Shop documents</h1>
        <p class="text-muted mb-0">
          Upload clear photos or PDFs so we can verify your shop. Required items are marked below.
        </p>
      </div>

      <b-alert v-if="compliance && !compliance.is_compliant" show variant="warning" class="mb-3">
        Finish the checklist so payouts and selling stay unlocked.
      </b-alert>
      <b-alert v-else-if="compliance?.is_compliant" show variant="success" class="mb-3">
        You’re all set — required documents look good.
      </b-alert>

      <p v-if="error" class="text-danger">{{ error }}</p>

      <div v-if="checklist.length" class="doc-check mb-4">
        <h2 class="h6 mb-2">What we need</h2>
        <ul class="doc-check__list list-unstyled mb-0">
          <li
            v-for="row in checklist"
            :key="row.code"
            class="doc-check__item"
            :class="`doc-check__item--${row.state}`"
          >
            <span class="doc-check__mark" aria-hidden="true">{{ row.mark }}</span>
            <div class="doc-check__body">
              <strong>{{ row.label }}</strong>
              <span class="doc-check__hint">{{ row.hint }}</span>
            </div>
            <b-button
              v-if="row.state !== 'ok'"
              size="sm"
              variant="outline-primary"
              @click="startUpload(row.code)"
            >
              {{ row.state === 'fix' ? 'Upload again' : 'Upload' }}
            </b-button>
          </li>
        </ul>
      </div>

      <b-card v-if="uploadOpen" class="mb-3 border-primary">
        <h2 class="h6 mb-2">Upload {{ selectedTypeLabel }}</h2>
        <b-form @submit.prevent="upload">
          <b-form-group label="Document type" label-for="document_type" class="mb-2">
            <b-form-select
              id="document_type"
              v-model="documentType"
              :options="documentTypeOptions"
              required
              @change="onTypeChange"
            />
          </b-form-group>
          <b-form-group v-if="requiresExpiry" label="Expiry date" class="mb-2">
            <b-form-input v-model="expiresAt" type="date" required />
            <small class="text-muted">This document needs an expiry date.</small>
          </b-form-group>
          <b-form-group label="Photo or PDF" class="mb-3">
            <b-form-file v-model="file" accept=".pdf,.jpg,.jpeg,.png" />
            <small class="text-muted d-block mt-1">Use a clear photo — avoid glare and cut-off edges.</small>
          </b-form-group>
          <div class="d-flex flex-wrap gap-2">
            <b-button type="submit" variant="primary" :disabled="!pickFile(file) || !documentType || uploading">
              {{ uploading ? 'Uploading…' : 'Send document' }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="uploadOpen = false">Cancel</b-button>
          </div>
        </b-form>
      </b-card>

      <div v-else class="mb-3">
        <b-button variant="primary" @click="uploadOpen = true">Upload a document</b-button>
      </div>

      <h2 class="h6 mb-2">Your uploads</h2>
      <div v-if="items.length" class="doc-uploads">
        <div v-for="item in items" :key="String(item.id)" class="doc-uploads__row">
          <div>
            <strong>{{ typeLabel(item.document_type) }}</strong>
            <div class="text-muted small">{{ formatDate(item.created_at || item.submitted_at) }}</div>
            <div v-if="item.rejection_reason" class="text-danger small mt-1">{{ item.rejection_reason }}</div>
          </div>
          <b-badge :variant="statusVariant(item.status)">{{ statusLabel(item.status) }}</b-badge>
        </div>
      </div>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState
        v-else
        title="No documents yet"
        message="Upload your first document using the checklist above."
      />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { sellerDocumentsApi, documentRequirementsPublicApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

type DocRow = Record<string, any>

const loading = ref(false)
const uploading = ref(false)
const error = ref('')
const items = ref<DocRow[]>([])
const file = ref<File | File[] | null>(null)
const uploadOpen = ref(false)

function pickFile(v: File | File[] | null | undefined): File | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

const documentType = ref('')
const documentTypeOptions = ref<{ value: string; text: string }[]>([{ value: '', text: 'Choose…' }])
const expiresAt = ref('')
const requiresExpiry = ref(false)
const compliance = ref<DocRow | null>(null)
const requirements = ref<DocRow[]>([])

const selectedTypeLabel = computed(() => {
  const opt = documentTypeOptions.value.find((o) => o.value === documentType.value)
  return opt?.text?.replace(/\s*\(required\)\s*$/i, '') || 'document'
})

function normalizeList(data: unknown): DocRow[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as DocRow[]
}

function typeLabel(code: unknown): string {
  const c = String(code ?? '')
  const req = requirements.value.find((r) => String(r.code) === c)
  if (req?.label) return String(req.label)
  return c.replace(/_/g, ' ') || 'Document'
}

function statusLabel(s: unknown): string {
  const v = String(s ?? '').toLowerCase()
  if (v === 'approved') return 'Approved'
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

function formatDate(v: unknown): string {
  if (!v) return ''
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function latestForCode(code: string): DocRow | undefined {
  return items.value.find((i) => String(i.document_type) === code)
}

const checklist = computed(() => {
  const source =
    (Array.isArray(compliance.value?.results) && compliance.value?.results.length
      ? compliance.value.results
      : requirements.value) as DocRow[]

  return source.map((r) => {
    const code = String(r.code ?? '')
    const uploaded = latestForCode(code)
    const status = String(uploaded?.status ?? '').toLowerCase()
    let state: 'ok' | 'waiting' | 'fix' | 'missing' = 'missing'
    let mark = '○'
    let hint = r.is_required ? 'Required' : 'Optional'
    if (status === 'approved' || r.status === 'approved' || r.is_satisfied) {
      state = 'ok'
      mark = '✓'
      hint = 'Approved'
    } else if (status === 'pending' || r.status === 'pending') {
      state = 'waiting'
      mark = '…'
      hint = 'Waiting for review'
    } else if (status === 'rejected' || r.status === 'rejected') {
      state = 'fix'
      mark = '!'
      hint = uploaded?.rejection_reason || r.rejection_reason || 'Needs a clearer upload'
    } else if (!r.is_required) {
      hint = 'Optional — upload if you have it'
    }
    return {
      code,
      label: String(r.label ?? code.replace(/_/g, ' ')),
      state,
      mark,
      hint,
    }
  })
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const reqRes = await documentRequirementsPublicApi.list({ role: 'seller', country_code: 'TZ' })
    requirements.value = normalizeList(reqRes.data)
    documentTypeOptions.value = [{ value: '', text: 'Choose…' }].concat(
      requirements.value.map((r) => ({
        value: String(r.code),
        text: `${r.label ?? r.code}${r.is_required ? ' (required)' : ''}`,
      })),
    )
    const { data } = await sellerDocumentsApi.list()
    items.value = normalizeList(data)
    const statusRes = await documentRequirementsPublicApi.status({ role: 'seller', country_code: 'TZ' })
    compliance.value = statusRes.data as DocRow
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Could not load documents')
    items.value = []
    compliance.value = null
  } finally {
    loading.value = false
  }
}

function onTypeChange() {
  const code = documentType.value
  const row =
    requirements.value.find((r) => String(r.code) === code) ||
    (compliance.value?.results ?? []).find((r: DocRow) => String(r.code) === code)
  requiresExpiry.value = Boolean(row?.requires_expiry)
}

function startUpload(code: string) {
  uploadOpen.value = true
  documentType.value = code
  onTypeChange()
}

async function upload() {
  const picked = pickFile(file.value)
  if (!picked || !documentType.value || uploading.value) return
  error.value = ''
  uploading.value = true
  const formData = new FormData()
  formData.append('document_type', documentType.value)
  formData.append('file', picked)
  if (expiresAt.value) formData.append('expires_at', expiresAt.value)
  try {
    await sellerDocumentsApi.upload(formData)
    file.value = null
    documentType.value = ''
    expiresAt.value = ''
    uploadOpen.value = false
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Upload failed')
  } finally {
    uploading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.doc-check__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.doc-check__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid #e6e8ec;
  border-radius: 10px;
  background: #fff;
}
.doc-check__item--ok {
  border-color: #b7e0c2;
  background: #f3fbf5;
}
.doc-check__item--waiting {
  border-color: #f0d78c;
  background: #fffaf0;
}
.doc-check__item--fix {
  border-color: #f0b4b4;
  background: #fff5f5;
}
.doc-check__mark {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  background: #eef0f3;
  flex-shrink: 0;
}
.doc-check__item--ok .doc-check__mark {
  background: #d8f3e0;
  color: #1a7a3a;
}
.doc-check__item--fix .doc-check__mark {
  background: #fde0e0;
  color: #b42318;
}
.doc-check__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}
.doc-check__hint {
  font-size: 0.85rem;
  color: #5c6570;
}
.doc-uploads {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.doc-uploads__row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eef0f3;
}
.doc-uploads__row:last-child {
  border-bottom: 0;
}
</style>
