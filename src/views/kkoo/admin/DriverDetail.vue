<template>
  <VerticalLayout>
    <b-card v-if="error && !driver" class="mb-0">
      <p class="text-danger mb-0">{{ error }}</p>
      <b-button variant="outline-secondary" class="mt-2" :to="{ name: 'admin.logistics' }">Back to Logistics</b-button>
    </b-card>

    <template v-else-if="driver">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.logistics' }">Back to Logistics</b-button>
      </div>

      <b-card :title="driverName" class="mb-4">
        <b-list-group>
          <b-list-group-item><strong>Driver ID</strong> {{ driver.id ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>User</strong> {{ driverName }}</b-list-group-item>
          <b-list-group-item><strong>Phone</strong> {{ driverPhone }}</b-list-group-item>
          <b-list-group-item><strong>Status</strong> {{ driver.status ?? '—' }}</b-list-group-item>
          <b-list-group-item>
            <strong>Verification</strong>
            <b-badge :variant="verificationVariant">{{ driver.verification_status ?? 'pending' }}</b-badge>
          </b-list-group-item>
          <b-list-group-item v-if="driver.rejection_reason"><strong>Rejection reason</strong> {{ driver.rejection_reason }}</b-list-group-item>
        </b-list-group>

        <div class="mt-3">
          <b-button size="sm" variant="outline-success" class="me-2" :disabled="saving" @click="verify('approve')">Approve driver</b-button>
          <b-button size="sm" variant="outline-danger" :disabled="saving" @click="showRejectModal = true">Reject driver</b-button>
        </div>

        <b-alert v-if="verifyError" variant="danger" show class="mt-3 mb-0">{{ verifyError }}</b-alert>

        <b-modal v-model="showRejectModal" title="Reject driver" @ok="onRejectOk" @hidden="rejectReason = ''; verifyError = ''">
          <b-form-group label="Rejection reason (required)">
            <b-form-textarea v-model="rejectReason" rows="3" placeholder="Why is this driver application declined?" />
          </b-form-group>
        </b-modal>
      </b-card>

      <b-card no-body>
        <b-tabs card>
          <b-tab title="Documents">
            <div class="p-3">
              <p v-if="docsError" class="text-danger mb-2">{{ docsError }}</p>
              <b-table
                v-if="documents.length"
                :items="documents"
                :fields="docFields"
                striped
                responsive
              >
                <template #cell(file_url)="row">
                  <a v-if="row.item.file_url" :href="String(row.item.file_url)" target="_blank" rel="noopener">View</a>
                  <span v-else>—</span>
                </template>
              </b-table>
              <p v-else-if="docsLoading" class="text-muted mb-0">Loading…</p>
              <p v-else class="text-muted mb-0">No documents.</p>
            </div>
          </b-tab>

          <b-tab title="Payouts">
            <div class="p-3">
              <p v-if="payoutError" class="text-danger mb-2">{{ payoutError }}</p>
              <b-table
                v-if="payouts.length"
                :items="payouts"
                :fields="payoutFields"
                striped
                responsive
              >
                <template #cell(amount)="row">
                  <span>{{ Number(row.item.amount ?? 0).toLocaleString() }}</span>
                </template>
              </b-table>
              <p v-else-if="payoutLoading" class="text-muted mb-0">Loading…</p>
              <p v-else class="text-muted mb-0">No payouts.</p>
            </div>
          </b-tab>
        </b-tabs>
      </b-card>
    </template>

    <p v-else-if="loading" class="text-muted">Loading…</p>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { logisticsAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const verifyError = ref('')

const driver = ref<Record<string, unknown> | null>(null)
const showRejectModal = ref(false)
const rejectReason = ref('')

const docsLoading = ref(false)
const docsError = ref('')
const documents = ref<Record<string, unknown>[]>([])

const payoutLoading = ref(false)
const payoutError = ref('')
const payouts = ref<Record<string, unknown>[]>([])

const docFields = [
  { key: 'id', label: 'ID' },
  { key: 'document_type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'file_url', label: 'File' },
]

const payoutFields = [
  { key: 'id', label: 'ID' },
  { key: 'amount', label: 'Amount' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
]

const driverName = computed(() => {
  const u = (driver.value?.user ?? {}) as Record<string, unknown>
  const full = String(u.full_name ?? '').trim()
  if (full) return full
  const first = String(u.first_name ?? '').trim()
  const last = String(u.last_name ?? '').trim()
  const joined = [first, last].filter(Boolean).join(' ').trim()
  return joined || String(u.username ?? u.phone_number ?? 'Driver')
})

const driverPhone = computed(() => {
  const u = (driver.value?.user ?? {}) as Record<string, unknown>
  return String(u.phone_number ?? '').trim() || '—'
})

const verificationVariant = computed(() => {
  const s = String(driver.value?.verification_status ?? '').toLowerCase()
  if (s === 'approved' || s === 'verified') return 'success'
  if (s === 'rejected' || s === 'declined') return 'danger'
  return 'warning'
})

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as Record<string, unknown>[]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = Number(route.params.id)
    const { data } = await logisticsAdminApi.getDriver(id)
    driver.value = (data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load driver')
    driver.value = null
  } finally {
    loading.value = false
  }
}

async function loadDocuments() {
  docsLoading.value = true
  docsError.value = ''
  try {
    const id = Number(route.params.id)
    const { data } = await logisticsAdminApi.listDriverDocuments(id)
    documents.value = normalizeList(data)
  } catch (e: unknown) {
    docsError.value = formatApiError(e, 'Failed to load documents')
    documents.value = []
  } finally {
    docsLoading.value = false
  }
}

async function loadPayouts() {
  payoutLoading.value = true
  payoutError.value = ''
  try {
    const id = Number(route.params.id)
    const { data } = await logisticsAdminApi.listDriverPayouts(id)
    payouts.value = normalizeList(data)
  } catch (e: unknown) {
    payoutError.value = formatApiError(e, 'Failed to load payouts')
    payouts.value = []
  } finally {
    payoutLoading.value = false
  }
}

async function verify(action: 'approve' | 'reject', rejection_reason?: string) {
  verifyError.value = ''
  saving.value = true
  try {
    const id = Number(route.params.id)
    await logisticsAdminApi.verifyDriver(id, { action, ...(rejection_reason ? { rejection_reason } : {}) })
    await load()
    await Promise.all([loadDocuments(), loadPayouts()])
  } catch (e: unknown) {
    verifyError.value = formatApiError(e, 'Failed to verify driver')
  } finally {
    saving.value = false
  }
}

function onRejectOk() {
  const reason = rejectReason.value.trim()
  if (!reason) {
    verifyError.value = 'Rejection reason is required.'
    showRejectModal.value = true
    return
  }
  void verify('reject', reason)
}

onMounted(async () => {
  await load()
  await Promise.all([loadDocuments(), loadPayouts()])
})
</script>

