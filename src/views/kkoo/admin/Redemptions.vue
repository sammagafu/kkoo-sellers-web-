<template>
  <VerticalLayout>
    <b-row>
      <b-col>
        <b-card title="Redemptions">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <p class="text-muted mb-0 me-auto">List and manage reward redemption requests.</p>
            <b-form-input v-model="search" placeholder="Search..." class="w-auto" style="max-width: 180px;" />
            <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" />
            <b-button variant="outline-secondary" size="sm" @click="exportCsv">Export CSV</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadTemplate">CSV template</b-button>
          </div>
          <b-table v-if="displayItems.length" :items="displayItems" :fields="fields" striped responsive>
            <template #cell(actions)="row">
              <b-button size="sm" variant="outline-secondary" class="me-1" :to="{ name: 'admin.redemptions.detail', params: { id: String(row.item.id) } }">View</b-button>
              <template v-if="row.item.status === 'pending'">
                <b-button size="sm" variant="success" class="me-1" @click="approve(row.item)">Approve</b-button>
                <b-button size="sm" variant="danger" @click="reject(row.item)">Reject</b-button>
              </template>
              <template v-else-if="row.item.status === 'approved'">
                <b-button size="sm" variant="primary" @click="complete(row.item)">Complete</b-button>
              </template>
              <span v-else class="text-muted">{{ row.item.status }}</span>
            </template>
          </b-table>
          <p v-else-if="loading" class="text-muted">Loading…</p>
          <p v-else-if="error" class="text-danger">{{ error }}</p>
          <EmptyState v-else />
          <p v-if="displayItems.length" class="text-muted small mt-2">Showing {{ displayItems.length }} redemption(s)</p>
        </b-card>
      </b-col>
    </b-row>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, watch } from 'vue'
import { redemptionsAdminApi } from '@/api'
import { exportToCsv, downloadCsvTemplate } from '@/composables/useCsv'

const statusFilter = ref('pending')
const search = ref('')
const statusOptions = [
  { value: '', text: 'All' },
  { value: 'pending', text: 'Pending' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Rejected' },
  { value: 'completed', text: 'Completed' },
]
const items = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')
const fields = [
  { key: 'id', label: 'ID' },
  { key: 'user', label: 'User' },
  { key: 'points_amount', label: 'Points' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

const csvCols = [
  { key: 'id', label: 'ID' },
  { key: 'user', label: 'User' },
  { key: 'points_amount', label: 'Points' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
]

const displayItems = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter(
    (r) =>
      String(r.user ?? '').toLowerCase().includes(q) ||
      String(r.status ?? '').toLowerCase().includes(q)
  )
})

function exportCsv() {
  exportToCsv(displayItems.value, csvCols, 'redemptions-export.csv')
}

function downloadTemplate() {
  downloadCsvTemplate(csvCols, 'redemptions-template.csv', { user: '1', points_amount: '100', status: 'pending', created_at: '' })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await redemptionsAdminApi.list({ status: statusFilter.value || undefined })
    items.value = (Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? (data as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[]
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to load redemptions'
  } finally {
    loading.value = false
  }
}

async function approve(item: Record<string, unknown>) {
  const id = item.id as number
  if (!id) return
  try {
    await redemptionsAdminApi.approve(id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to approve'
  }
}

async function reject(item: Record<string, unknown>) {
  const id = item.id as number
  if (!id) return
  try {
    await redemptionsAdminApi.reject(id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to reject'
  }
}

async function complete(item: Record<string, unknown>) {
  const id = item.id as number
  if (!id) return
  try {
    await redemptionsAdminApi.complete(id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to complete'
  }
}

watch([statusFilter], load, { immediate: true })
</script>
