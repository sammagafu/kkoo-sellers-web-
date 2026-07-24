<template>
  <VerticalLayout>
    <b-card title="Deletion requests">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <p class="text-muted mb-0 me-auto">Approve archives the account; reject leaves the user active.</p>
        <b-form-select v-model="filterStatus" :options="statusOptions" class="w-auto" @change="load" />
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="outline-primary" size="sm" :to="{ name: 'admin.users' }">Back to users</b-button>
      </div>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(user)="data">
          <span>{{ userLabel(data.item) }}</span>
        </template>
        <template #cell(actions)="data">
          <template v-if="data.item.status === 'pending'">
            <b-button size="sm" variant="outline-success" class="me-1" @click="approve(data.item)">Approve</b-button>
            <b-button size="sm" variant="outline-danger" @click="reject(data.item)">Reject</b-button>
          </template>
          <span v-else class="text-muted small">{{ data.item.status }}</span>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else />
    </b-card>

    <b-modal v-model="notesModalShow" :title="notesModalTitle" @ok="onNotesOk">
      <b-form-textarea v-model="adminNotes" placeholder="Admin notes (optional)..." rows="3" />
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { usersAdminApi } from '@/api/users'
import { formatApiError } from '@/utils/formatApiError'
import { toastError, toastSuccess } from '@/utils/toast'

type Row = {
  id: number
  user_id?: number
  reason?: string
  status?: string
  created_at?: string
  user?: { phone_number?: string; first_name?: string; last_name?: string; email?: string }
}

const items = ref<Row[]>([])
const loading = ref(false)
const error = ref('')
const filterStatus = ref('pending')
const notesModalShow = ref(false)
const adminNotes = ref('')
const pendingAction = ref<{ id: number; kind: 'approve' | 'reject' } | null>(null)

const statusOptions = [
  { value: 'pending', text: 'Pending' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Rejected' },
  { value: '', text: 'All' },
]

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'user', label: 'User' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

const notesModalTitle = ref('Admin notes')

function userLabel(row: Row): string {
  const u = row.user
  if (!u) return `User #${row.user_id ?? '—'}`
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  return name || u.phone_number || u.email || `User #${row.user_id}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await usersAdminApi.listDeletionRequests({
      status: filterStatus.value || undefined,
    })
    const data = res.data as { results?: Row[] }
    items.value = Array.isArray(data?.results) ? data.results : []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load deletion requests')
    items.value = []
  } finally {
    loading.value = false
  }
}

function approve(row: Row) {
  pendingAction.value = { id: row.id, kind: 'approve' }
  notesModalTitle.value = `Approve request #${row.id}`
  adminNotes.value = ''
  notesModalShow.value = true
}

function reject(row: Row) {
  pendingAction.value = { id: row.id, kind: 'reject' }
  notesModalTitle.value = `Reject request #${row.id}`
  adminNotes.value = ''
  notesModalShow.value = true
}

async function onNotesOk(ev: Event) {
  ev.preventDefault()
  const act = pendingAction.value
  if (!act) return
  try {
    const body = adminNotes.value.trim() ? { admin_notes: adminNotes.value.trim() } : undefined
    if (act.kind === 'approve') {
      await usersAdminApi.approveDeletionRequest(act.id, body)
      toastSuccess('Request approved — account archived')
    } else {
      await usersAdminApi.rejectDeletionRequest(act.id, body)
      toastSuccess('Request rejected')
    }
    notesModalShow.value = false
    pendingAction.value = null
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Action failed')
    toastError(error.value)
  }
}

onMounted(load)
</script>
