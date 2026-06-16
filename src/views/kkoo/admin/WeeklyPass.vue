<template>
  <VerticalLayout>
    <b-card title="Weekly Pass (Admin)">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <p class="text-muted mb-0 me-auto">Create weekly passes that increase user engagement.</p>
        <b-button variant="primary" @click="openCreate">Create weekly pass</b-button>
        <b-button variant="outline-secondary" :disabled="loading" @click="load">Refresh</b-button>
      </div>

      <b-alert v-if="error" variant="danger" dismissible show class="mb-0">{{ error }}</b-alert>

      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(active)="row">
          <b-badge :variant="row.item.is_active ? 'success' : 'secondary'">{{ row.item.is_active ? 'Yes' : 'No' }}</b-badge>
        </template>
        <template #cell(window)="row">
          <span class="small text-muted">{{ row.item.start_at }} → {{ row.item.end_at }}</span>
        </template>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-primary" class="me-1" @click="openEdit(row.item)">Edit</b-button>
          <b-button size="sm" variant="outline-secondary" class="me-1" @click="openTasks(row.item)">Tasks</b-button>
          <b-button size="sm" variant="outline-danger" @click="deactivate(row.item)">Deactivate</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else />
    </b-card>

    <b-modal v-model="showPassModal" :title="editingId ? 'Edit weekly pass' : 'Create weekly pass'" @ok="savePass" @hidden="resetPassForm">
      <b-form>
        <b-form-group label="Title" class="mb-2">
          <b-form-input v-model="passForm.title" required />
        </b-form-group>
        <b-form-group label="Description" class="mb-2">
          <b-form-textarea v-model="passForm.description" rows="2" />
        </b-form-group>
        <b-row>
          <b-col md="6">
            <b-form-group label="Start (RFC3339)" class="mb-2">
              <b-form-input v-model="passForm.start_at" placeholder="2026-05-08T00:00:00Z" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="End (RFC3339)" class="mb-2">
              <b-form-input v-model="passForm.end_at" placeholder="2026-05-15T00:00:00Z" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col md="6">
            <b-form-group label="Reward type" class="mb-2">
              <b-form-select v-model="passForm.reward_type" :options="rewardTypeOptions" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Reward value" class="mb-2">
              <b-form-input v-model.number="passForm.reward_value" type="number" step="1" min="0" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-checkbox v-model="passForm.is_active">Active</b-form-checkbox>
      </b-form>
    </b-modal>

    <b-modal v-model="showTasksModal" title="Weekly pass tasks" size="lg" @hidden="resetTaskForm">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <p class="text-muted mb-0 me-auto">Add tasks for this weekly pass.</p>
        <b-button variant="primary" size="sm" @click="openCreateTask">Add task</b-button>
        <b-button variant="outline-secondary" size="sm" @click="loadTasks" :disabled="!selectedPassId">Refresh</b-button>
      </div>

      <b-table v-if="tasks.length" :items="tasks" :fields="taskFields" striped responsive>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-primary" class="me-1" @click="openEditTask(row.item)">Edit</b-button>
          <b-button size="sm" variant="outline-danger" @click="deleteTask(row.item)">Delete</b-button>
        </template>
      </b-table>
      <p v-else class="text-muted mb-0">No tasks yet.</p>

      <hr />

      <h6 class="mb-2">{{ editingTaskId ? 'Edit task' : 'Create task' }}</h6>
      <b-form>
        <b-row>
          <b-col md="6">
            <b-form-group label="Title" class="mb-2">
              <b-form-input v-model="taskForm.title" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Task type" class="mb-2">
              <b-form-select v-model="taskForm.task_type" :options="taskTypeOptions" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col md="4">
            <b-form-group label="Target count" class="mb-2">
              <b-form-input v-model.number="taskForm.target_count" type="number" min="1" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Sort order" class="mb-2">
              <b-form-input v-model.number="taskForm.sort_order" type="number" />
            </b-form-group>
          </b-col>
          <b-col md="4" class="d-flex align-items-end">
            <b-form-checkbox v-model="taskForm.is_required">Required</b-form-checkbox>
          </b-col>
        </b-row>
        <b-form-group label="Description" class="mb-2">
          <b-form-textarea v-model="taskForm.description" rows="2" />
        </b-form-group>
        <div class="d-flex gap-2">
          <b-button variant="primary" size="sm" @click.prevent="saveTask" :disabled="!selectedPassId">Save task</b-button>
          <b-button variant="outline-secondary" size="sm" @click.prevent="resetTaskForm">Clear</b-button>
        </div>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { weeklyPassApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { toastError, toastSuccess } from '@/utils/toast'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'

type WeeklyPassRow = Record<string, any>
type WeeklyPassTaskRow = Record<string, any>

const items = ref<WeeklyPassRow[]>([])
const loading = ref(false)
const error = ref('')

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'reward_type', label: 'Reward type' },
  { key: 'reward_value', label: 'Reward value' },
  { key: 'active', label: 'Active' },
  { key: 'window', label: 'Window' },
  { key: 'actions', label: 'Actions' },
]

const rewardTypeOptions = [
  { value: 'wallet_credit', text: 'Wallet credit' },
  { value: 'xp', text: 'XP' },
]

const showPassModal = ref(false)
const editingId = ref<number | null>(null)
const passForm = ref({
  title: '',
  description: '',
  start_at: '',
  end_at: '',
  is_active: true,
  reward_type: 'xp',
  reward_value: 0,
})

const showTasksModal = ref(false)
const selectedPassId = ref<number | null>(null)
const tasks = ref<WeeklyPassTaskRow[]>([])
const taskFields = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'task_type', label: 'Type' },
  { key: 'target_count', label: 'Target' },
  { key: 'is_required', label: 'Required' },
  { key: 'sort_order', label: 'Sort' },
  { key: 'actions', label: 'Actions' },
]
const taskTypeOptions = [
  { value: 'orders_placed', text: 'Orders placed' },
  { value: 'orders_delivered', text: 'Orders delivered' },
  { value: 'reviews_submitted', text: 'Reviews submitted' },
  { value: 'invite_first_order', text: 'Invites (first order)' },
]
const editingTaskId = ref<number | null>(null)
const taskForm = ref({
  title: '',
  description: '',
  task_type: 'orders_placed',
  target_count: 1,
  is_required: true,
  sort_order: 0,
})

function resetPassForm() {
  editingId.value = null
  passForm.value = { title: '', description: '', start_at: '', end_at: '', is_active: true, reward_type: 'xp', reward_value: 0 }
}

function openCreate() {
  resetPassForm()
  showPassModal.value = true
}

function openEdit(item: WeeklyPassRow) {
  editingId.value = Number(item.id)
  passForm.value = {
    title: String(item.title ?? ''),
    description: String(item.description ?? ''),
    start_at: String(item.start_at ?? ''),
    end_at: String(item.end_at ?? ''),
    is_active: item.is_active !== false,
    reward_type: String(item.reward_type ?? 'wallet_credit'),
    reward_value: Number(item.reward_value ?? 0),
  }
  showPassModal.value = true
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await weeklyPassApi.adminList()
    items.value = (data?.results ?? data) as WeeklyPassRow[]
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load weekly passes')
    toastError(error.value)
    items.value = []
  } finally {
    loading.value = false
  }
}

async function savePass() {
  if (!passForm.value.title.trim()) return
  try {
    if (editingId.value) {
      await weeklyPassApi.adminPatch(editingId.value, { ...passForm.value })
      toastSuccess('Weekly pass updated')
    } else {
      await weeklyPassApi.adminCreate({ ...passForm.value })
      toastSuccess('Weekly pass created')
    }
    await load()
  } catch (e: unknown) {
    const msg = formatApiError(e, 'Save failed')
    error.value = msg
    toastError(msg)
  }
}

async function deactivate(item: WeeklyPassRow) {
  const id = Number(item.id)
  if (!id) return
  const ok = await confirmDestructiveAction({ title: 'Deactivate weekly pass?', text: `Deactivate "${item.title ?? id}"?` })
  if (!ok) return
  try {
    await weeklyPassApi.adminDelete(id)
    toastSuccess('Weekly pass deactivated')
    await load()
  } catch (e: unknown) {
    const msg = formatApiError(e, 'Deactivate failed')
    error.value = msg
    toastError(msg)
  }
}

function resetTaskForm() {
  editingTaskId.value = null
  taskForm.value = { title: '', description: '', task_type: 'orders_placed', target_count: 1, is_required: true, sort_order: 0 }
}

function openTasks(item: WeeklyPassRow) {
  selectedPassId.value = Number(item.id)
  showTasksModal.value = true
  void loadTasks()
}

async function loadTasks() {
  if (!selectedPassId.value) return
  try {
    const { data } = await weeklyPassApi.adminGet(selectedPassId.value)
    tasks.value = (data?.tasks ?? []) as WeeklyPassTaskRow[]
  } catch (e: unknown) {
    toastError(formatApiError(e, 'Failed to load tasks'))
    tasks.value = []
  }
}

function openCreateTask() {
  resetTaskForm()
}

function openEditTask(item: WeeklyPassTaskRow) {
  editingTaskId.value = Number(item.id)
  taskForm.value = {
    title: String(item.title ?? ''),
    description: String(item.description ?? ''),
    task_type: String(item.task_type ?? 'orders_placed'),
    target_count: Number(item.target_count ?? 1),
    is_required: item.is_required !== false,
    sort_order: Number(item.sort_order ?? 0),
  }
}

async function saveTask() {
  if (!selectedPassId.value) return
  if (!taskForm.value.title.trim()) return
  try {
    if (editingTaskId.value) {
      await weeklyPassApi.adminPatchTask(selectedPassId.value, editingTaskId.value, { ...taskForm.value })
      toastSuccess('Task updated')
    } else {
      await weeklyPassApi.adminAddTask(selectedPassId.value, { ...taskForm.value })
      toastSuccess('Task created')
    }
    await loadTasks()
    resetTaskForm()
  } catch (e: unknown) {
    toastError(formatApiError(e, 'Save task failed'))
  }
}

async function deleteTask(item: WeeklyPassTaskRow) {
  if (!selectedPassId.value) return
  const id = Number(item.id)
  if (!id) return
  const ok = await confirmDestructiveAction({ title: 'Delete task?', text: `Delete "${item.title ?? id}"?` })
  if (!ok) return
  try {
    await weeklyPassApi.adminDeleteTask(selectedPassId.value, id)
    toastSuccess('Task deleted')
    await loadTasks()
  } catch (e: unknown) {
    toastError(formatApiError(e, 'Delete task failed'))
  }
}

onMounted(load)
</script>

