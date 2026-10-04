<template>
  <VerticalLayout>
    <GrowthGuide
      title="Temp jobs"
      what="Short jobs people can apply for — cleaning, helpers, a few hours of work. They see the post on Careers."
      :steps="[
        'Tap Post a job. Title, pay, and place are enough.',
        'Publish. It shows on Careers.',
        'Edit, or tap Close when the work is done.',
      ]"
      actions="Post creates the job. Edit updates it. Change the status to close applications."
    />
    <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
    <b-alert v-if="success" variant="success" dismissible show @dismissed="success = ''">{{ success }}</b-alert>

    <b-card title="Jobs" class="mb-4">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="primary" @click="openCreate">Post a job</b-button>
        <b-form-select v-model="statusFilter" :options="statusFilterOptions" style="max-width: 12rem" @change="load" />
        <b-button variant="outline-secondary" :disabled="loading" @click="load">Refresh</b-button>
      </div>
      <p v-if="loading" class="text-muted">Loading…</p>
      <b-table v-else :items="postings" :fields="fields" small responsive hover>
        <template #cell(employment_type)="data">
          {{ formatRateCell(data.item) }}
        </template>
        <template #cell(status)="data">
          <b-badge :variant="statusVariant(data.item.status)">{{ data.item.status }}</b-badge>
        </template>
        <template #cell(seller_id)="data">
          {{ data.item.seller_id ? `#${data.item.seller_id}` : 'Platform' }}
        </template>
        <template #cell(actions)="data">
          <div class="d-flex flex-wrap gap-1">
            <b-button size="sm" variant="outline-primary" @click="startEdit(data.item)">Edit</b-button>
            <b-button
              v-if="data.item.status !== 'published'"
              size="sm"
              variant="outline-success"
              @click="setStatus(data.item, 'published')"
            >
              Publish
            </b-button>
            <b-button
              v-if="data.item.status === 'published'"
              size="sm"
              variant="outline-warning"
              @click="setStatus(data.item, 'closed')"
            >
              Close
            </b-button>
            <b-button size="sm" variant="outline-danger" @click="remove(data.item)">Delete</b-button>
          </div>
        </template>
      </b-table>
      <p v-if="!loading && !postings.length" class="text-muted mb-0">No jobs yet. Tap Post a job.</p>
    </b-card>

    <b-modal
      v-model="showJobForm"
      :title="editingUuid ? 'Edit job' : 'Post a job'"
      size="lg"
      hide-footer
    >
      <p class="text-muted small">People see this on Careers. Title, pay, and place are enough to publish.</p>
      <b-form-group label="Job title">
        <b-form-input v-model="form.title" placeholder="Home cleaning — half day" />
      </b-form-group>
      <b-row class="g-2">
        <b-col md="5">
          <b-form-group label="Pay (TZS)">
            <b-form-input v-model.number="form.rate_amount" type="number" min="0" step="500" placeholder="25000" />
          </b-form-group>
        </b-col>
        <b-col md="7">
          <b-form-group label="Paid">
            <b-form-select v-model="form.employment_type" :options="simpleRateOptions" />
          </b-form-group>
        </b-col>
      </b-row>
      <b-form-group label="Where">
        <b-form-input v-model="form.location" placeholder="Kinondoni, Dar es Salaam" />
      </b-form-group>
      <b-form-group label="What they will do">
        <b-form-textarea v-model="form.description" rows="3" placeholder="Half day. Bring your own supplies." />
      </b-form-group>

      <button type="button" class="btn btn-link btn-sm px-0 mb-2" @click="showJobMore = !showJobMore">
        {{ showJobMore ? 'Hide extra details' : 'Add deadline, map pin, or requirements' }}
      </button>
      <div v-if="showJobMore">
        <b-row class="g-2">
          <b-col md="6">
            <b-form-group label="Type of work">
              <b-form-input v-model="form.department" placeholder="Cleaning" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Show as">
              <b-form-select v-model="form.status" :options="statusOptions" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Apply by">
              <b-form-input v-model="form.deadline_local" type="datetime-local" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Typical earnings shown as">
              <b-form-select v-model="form.earning_period" :options="periodOptions" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="From (TZS)">
              <b-form-input v-model.number="form.earning_potential_min" type="number" min="0" step="1000" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Up to (TZS)">
              <b-form-input v-model.number="form.earning_potential_max" type="number" min="0" step="1000" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Map latitude">
              <b-form-input v-model.number="form.latitude" type="number" step="0.0001" placeholder="Optional" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Map longitude">
              <b-form-input v-model.number="form.longitude" type="number" step="0.0001" placeholder="Optional" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="Requirements (one per line)">
          <b-form-textarea v-model="form.requirements" rows="2" />
        </b-form-group>
      </div>

      <div class="d-flex flex-wrap gap-2 mt-2">
        <b-button variant="primary" :disabled="saving || !form.title.trim()" @click="save">
          {{ saving ? 'Saving…' : editingUuid ? 'Save changes' : 'Publish job' }}
        </b-button>
        <b-button variant="outline-secondary" @click="showJobForm = false">Cancel</b-button>
      </div>
    </b-modal>

    <b-card title="Applications">
      <b-button size="sm" variant="outline-secondary" class="mb-3" :disabled="appsLoading" @click="loadApps">Refresh applications</b-button>
      <p v-if="appsLoading" class="text-muted">Loading…</p>
      <b-table v-else :items="applications" :fields="appFields" small responsive hover>
        <template #cell(status)="data">
          <b-form-select
            v-model="data.item.status"
            size="sm"
            :options="appStatusOptions"
            @update:model-value="(v: string) => updateAppStatus(data.item, v)"
          />
        </template>
      </b-table>
      <p v-if="!appsLoading && !applications.length" class="text-muted mb-0">No applications yet.</p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import GrowthGuide from '@/components/kkoo/GrowthGuide.vue'
import {
  careersAdminApi,
  type CareerApplicationRow,
  type CareerPostingRow,
} from '@/api/careers'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const appsLoading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const postings = ref<CareerPostingRow[]>([])
const applications = ref<CareerApplicationRow[]>([])
const statusFilter = ref('')
const editingUuid = ref('')
const showJobForm = ref(false)
const showJobMore = ref(false)

const rateOptions = [
  { value: 'per-task', text: 'Per task' },
  { value: 'per-job', text: 'Per job' },
  { value: 'per-hour', text: 'Per hour' },
  { value: 'full-time', text: 'Full-time (legacy)' },
  { value: 'part-time', text: 'Part-time (legacy)' },
  { value: 'contract', text: 'Contract (legacy)' },
  { value: 'internship', text: 'Internship (legacy)' },
]

const periodOptions = [
  { value: 'day', text: 'Per day' },
  { value: 'week', text: 'Per week' },
  { value: 'month', text: 'Per month' },
]

const statusOptions = [
  { value: 'draft', text: 'Draft' },
  { value: 'published', text: 'Published' },
  { value: 'closed', text: 'Closed' },
]

const statusFilterOptions = [
  { value: '', text: 'All statuses' },
  ...statusOptions,
]

const appStatusOptions = [
  { value: 'pending', text: 'Pending' },
  { value: 'reviewed', text: 'Reviewed' },
  { value: 'shortlisted', text: 'Shortlisted' },
  { value: 'rejected', text: 'Rejected' },
]

const fields = [
  { key: 'title', label: 'Title' },
  { key: 'department', label: 'Dept' },
  { key: 'employment_type', label: 'Rate' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status' },
  { key: 'seller_id', label: 'Owner' },
  { key: 'actions', label: '' },
]

const appFields = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'career_posting_id', label: 'Job #' },
  { key: 'status', label: 'Status' },
]

const form = reactive({
  title: '',
  description: '',
  department: 'Cleaning',
  location: 'Dar es Salaam',
  latitude: null as number | null,
  longitude: null as number | null,
  employment_type: 'per-task',
  rate_amount: null as number | null,
  earning_potential_min: null as number | null,
  earning_potential_max: null as number | null,
  earning_period: 'week',
  requirements: '',
  deadline_local: '',
  status: 'published',
})

const simpleRateOptions = computed(() => {
  const main = rateOptions.filter((o) => ['per-task', 'per-job', 'per-hour'].includes(o.value))
  if (main.some((o) => o.value === form.employment_type)) return main
  return rateOptions
})

function openCreate() {
  resetForm()
  showJobMore.value = false
  showJobForm.value = true
}

function rateLabel(value?: string) {
  return rateOptions.find((o) => o.value === value)?.text ?? value ?? '—'
}

function formatRateCell(row: CareerPostingRow) {
  const type = rateLabel(row.employment_type)
  if (row.rate_amount == null) return type
  const cur = row.rate_currency || 'TZS'
  return `${cur} ${Number(row.rate_amount).toLocaleString()} · ${type}`
}

function optionalAmount(v: number | null) {
  return v == null || Number.isNaN(v) ? null : Number(v)
}

function statusVariant(status?: string) {
  if (status === 'published') return 'success'
  if (status === 'closed') return 'warning'
  return 'secondary'
}

function toRfc3339(local: string) {
  if (!local) return null
  return new Date(local).toISOString()
}

function resetForm() {
  editingUuid.value = ''
  form.title = ''
  form.description = ''
  form.department = 'Cleaning'
  form.location = 'Dar es Salaam'
  form.latitude = null
  form.longitude = null
  form.employment_type = 'per-task'
  form.rate_amount = null
  form.earning_potential_min = null
  form.earning_potential_max = null
  form.earning_period = 'week'
  form.requirements = ''
  form.deadline_local = ''
  form.status = 'published'
}

function startEdit(row: CareerPostingRow) {
  showJobMore.value = true
  showJobForm.value = true
  editingUuid.value = row.uuid || row.slug || String(row.id)
  form.title = row.title
  form.description = row.description || ''
  form.department = row.department || ''
  form.location = row.location || ''
  form.latitude = row.latitude ?? null
  form.longitude = row.longitude ?? null
  form.employment_type = row.employment_type || 'per-task'
  form.rate_amount = row.rate_amount ?? null
  form.earning_potential_min = row.earning_potential_min ?? null
  form.earning_potential_max = row.earning_potential_max ?? null
  form.earning_period = row.earning_period || 'week'
  form.requirements = row.requirements || ''
  form.status = row.status || 'draft'
  form.deadline_local = ''
  if (row.application_deadline) {
    const d = new Date(row.application_deadline)
    const pad = (n: number) => String(n).padStart(2, '0')
    form.deadline_local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await careersAdminApi.list({
      status: statusFilter.value || undefined,
    })
    postings.value = data?.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load jobs')
  } finally {
    loading.value = false
  }
}

async function loadApps() {
  appsLoading.value = true
  try {
    const { data } = await careersAdminApi.listApplications()
    applications.value = data?.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load applications')
  } finally {
    appsLoading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  success.value = ''
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    department: form.department.trim(),
    location: form.location.trim(),
    latitude: optionalAmount(form.latitude),
    longitude: optionalAmount(form.longitude),
    employment_type: form.employment_type,
    rate_amount: optionalAmount(form.rate_amount),
    rate_currency: 'TZS',
    earning_potential_min: optionalAmount(form.earning_potential_min),
    earning_potential_max: optionalAmount(form.earning_potential_max),
    earning_period: form.earning_period,
    requirements: form.requirements,
    application_deadline: toRfc3339(form.deadline_local),
    status: form.status,
  }
  try {
    if (editingUuid.value) {
      await careersAdminApi.update(editingUuid.value, payload)
      success.value = 'Job updated.'
    } else {
      await careersAdminApi.create(payload)
      success.value = 'Job created.'
    }
    resetForm()
    showJobForm.value = false
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to save job')
  } finally {
    saving.value = false
  }
}

async function setStatus(row: CareerPostingRow, status: string) {
  const ref = row.uuid || row.slug || String(row.id)
  try {
    await careersAdminApi.update(ref, { status })
    success.value = `Job marked ${status}.`
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to update status')
  }
}

async function remove(row: CareerPostingRow) {
  if (!confirm(`Delete “${row.title}”?`)) return
  const ref = row.uuid || row.slug || String(row.id)
  try {
    await careersAdminApi.remove(ref)
    success.value = 'Job deleted.'
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to delete job')
  }
}

async function updateAppStatus(row: CareerApplicationRow, status: string) {
  const ref = row.uuid || String(row.id)
  try {
    await careersAdminApi.updateApplication(ref, { status })
    row.status = status
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to update application')
  }
}

onMounted(() => {
  load()
  loadApps()
})
</script>
