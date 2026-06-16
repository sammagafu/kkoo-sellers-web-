<template>
  <VerticalLayout>
    <b-card title="Disputes">
      <p class="text-muted">Dispute list from API. Resolve with refund, complete, or reject.</p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-select v-model="subjectType" :options="subjectTypeOptions" class="w-auto" @change="load" />
        <b-form-select v-model="statusFilter" :options="statusFilterOptions" class="w-auto" @change="load" />
        <b-form-input v-model="search" placeholder="Search dispute or order ID..." class="w-auto" style="max-width: 200px;" @keyup.enter="load" />
        <b-button variant="primary" @click="load">Refresh</b-button>
      </div>
      <b-table v-if="displayItems.length" :items="displayItems" :fields="fields" striped responsive>
        <template #cell(subject_type)="row">
          <b-badge :variant="row.item.subject_type === 'rider_payment' ? 'info' : 'secondary'">
            {{ row.item.subject_type === 'rider_payment' ? 'Rider payment' : 'Order' }}
          </b-badge>
        </template>
        <template #cell(order_id)="row">
          <template v-if="row.item.subject_type === 'rider_payment'">
            <span v-if="row.item.assignment_id">Assignment #{{ row.item.assignment_id }}</span>
            <span v-else>—</span>
          </template>
          <template v-else>
            <router-link v-if="row.item.order_id" :to="{ name: 'admin.orders.detail', params: { id: String(row.item.order_id) } }">
              {{ row.item.order_id }}
            </router-link>
            <span v-else>—</span>
          </template>
        </template>
        <template #cell(actions)="row">
          <b-button v-if="!resolved(row.item)" size="sm" variant="outline-primary" @click="openResolve(row.item)">Resolve</b-button>
          <router-link v-else :to="{ name: 'admin.orders.detail', params: { id: String(row.item.order_id) } }">
            <b-button size="sm" variant="outline-secondary">View order</b-button>
          </router-link>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <p v-else-if="error" class="text-danger">{{ error }}</p>
      <EmptyState v-else />
      <p v-if="displayItems.length" class="text-muted small mt-2">Showing {{ displayItems.length }} dispute(s)</p>

      <b-modal v-model="showModal" title="Resolve dispute" @ok="submitResolve" @hidden="resolveTarget = null">
        <p v-if="resolveTarget">Dispute #{{ resolveTarget.id }}{{ resolveTarget.order_id ? ` (Order #${resolveTarget.order_id})` : '' }}</p>
        <b-form-group label="Resolution">
          <b-form-select v-model="resolution" :options="resolutionOptions" />
        </b-form-group>
        <b-form-group label="Admin notes (optional)">
          <b-form-textarea v-model="adminNotes" rows="2" />
        </b-form-group>
      </b-modal>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { disputesAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const search = ref('')
const loading = ref(false)
const error = ref('')
const items = ref<Record<string, unknown>[]>([])
const showModal = ref(false)
const resolveTarget = ref<Record<string, unknown> | null>(null)
const resolution = ref('refund')
const adminNotes = ref('')
const resolutionOptions = [
  { value: 'refund', text: 'Refund' },
  { value: 'complete', text: 'Complete' },
  { value: 'reject', text: 'Reject' },
]

const subjectType = ref<'order' | 'rider_payment' | ''>('')
const subjectTypeOptions = [
  { value: '', text: 'All types' },
  { value: 'order', text: 'Order disputes' },
  { value: 'rider_payment', text: 'Rider payment disputes' },
]
const statusFilter = ref('')
const statusFilterOptions = [
  { value: '', text: 'All statuses' },
  { value: 'open', text: 'Open' },
  { value: 'resolved', text: 'Resolved' },
]

const fields = [
  { key: 'id', label: 'Dispute ID' },
  { key: 'subject_type', label: 'Type' },
  { key: 'order_id', label: 'Order / Assignment' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

function resolved(d: Record<string, unknown>): boolean {
  const s = String(d.status ?? '').toLowerCase()
  return s === 'resolved' || s === 'closed' || s === 'completed'
}

const displayItems = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter(
    (d) =>
      String(d.id ?? '').toLowerCase().includes(q) ||
      String((d as Record<string, unknown>).order_id ?? '').toLowerCase().includes(q)
  )
})

function openResolve(item: Record<string, unknown>) {
  resolveTarget.value = item
  resolution.value = 'refund'
  adminNotes.value = ''
  showModal.value = true
}

async function submitResolve() {
  if (!resolveTarget.value || resolveTarget.value.id == null) return
  try {
    await disputesAdminApi.resolve(Number(resolveTarget.value.id), {
      resolution: resolution.value,
      admin_notes: adminNotes.value || undefined,
    })
    showModal.value = false
    resolveTarget.value = null
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to resolve')
  }
}

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as Record<string, unknown>[]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await disputesAdminApi.list({
      page_size: 200,
      ...(subjectType.value && { subject_type: subjectType.value }),
      ...(statusFilter.value && { status: statusFilter.value }),
    })
    items.value = normalizeList(data)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load disputes')
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
