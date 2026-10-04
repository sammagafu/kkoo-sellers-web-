<template>
  <VerticalLayout>
    <b-card>
      <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
        <div class="me-auto">
          <h1 class="h4 mb-1">Repeat billing</h1>
          <p class="text-muted mb-0">
            Bill the same client every week, month, or quarter. Start one from a new invoice, or pick a saved template here.
          </p>
        </div>
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.crm.invoices' }">All invoices</b-button>
        <b-button variant="outline-primary" size="sm" :to="{ name: 'admin.crm.invoices.create' }">New invoice</b-button>
        <b-button variant="primary" size="sm" @click="openCreate">New schedule</b-button>
      </div>

      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-alert v-if="note" variant="info" show>{{ note }}</b-alert>

      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(customer)="data">{{ customerLabel(data.item) }}</template>
        <template #cell(template)="data">{{ templateLabel(data.item) }}</template>
        <template #cell(frequency)="data">{{ frequencyLabel(data.item.frequency) }}</template>
        <template #cell(is_active)="data">
          <b-badge :variant="data.item.is_active ? 'success' : 'secondary'">
            {{ data.item.is_active ? 'On' : 'Paused' }}
          </b-badge>
        </template>
        <template #cell(next_run_at)="data">{{ formatDate(data.item.next_run_at) }}</template>
        <template #cell(actions)="data">
          <div class="d-flex flex-wrap gap-1">
            <b-button size="sm" variant="outline-primary" :disabled="busyId === data.item.id" @click="generateNow(data.item)">
              Bill now
            </b-button>
            <b-button size="sm" variant="outline-secondary" :disabled="busyId === data.item.id" @click="toggleActive(data.item)">
              {{ data.item.is_active ? 'Pause' : 'Resume' }}
            </b-button>
          </div>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState
        v-else
        title="No repeat bills yet"
        message="Open a new invoice, add the client and services, then choose Start repeat billing."
      />
    </b-card>

    <b-modal v-model="showCreate" title="New repeat bill" hide-footer @hidden="formError = ''">
      <b-alert v-if="formError" variant="danger" show>{{ formError }}</b-alert>
      <p class="text-muted small mb-3">Uses a saved template so each bill has the same services and prices.</p>
      <b-form>
        <b-form-group label="Name this schedule" class="mb-2">
          <b-form-input v-model="form.label" placeholder="e.g. Office rent, Retainer" />
        </b-form-group>
        <b-form-group label="Client" class="mb-2">
          <CrmCustomerPicker v-model="form.customer_id" placeholder="Search client…" />
          <b-button size="sm" variant="link" class="px-0 mt-1" @click="showNewClient = !showNewClient">
            {{ showNewClient ? 'Cancel' : '+ New client' }}
          </b-button>
          <div v-if="showNewClient" class="border rounded p-2 mt-2 bg-light">
            <b-form-input v-model="newClientName" placeholder="Client name" size="sm" class="mb-2" />
            <b-form-input v-model="newClientPhone" placeholder="Phone" size="sm" class="mb-2" />
            <b-button size="sm" variant="primary" :disabled="savingClient" @click="createClient">Save client</b-button>
          </div>
        </b-form-group>
        <b-form-group label="Saved bill" class="mb-2">
          <b-form-select v-model="form.template_id" :options="templateOptions" value-field="id" text-field="name" />
          <small class="text-muted">Templates are created when you start repeat billing from a new invoice.</small>
        </b-form-group>
        <b-form-group label="How often?" class="mb-0">
          <div class="d-flex flex-wrap gap-2">
            <b-button
              v-for="opt in frequencyOptions"
              :key="opt.value"
              size="sm"
              :variant="form.frequency === opt.value ? 'primary' : 'outline-secondary'"
              @click="form.frequency = opt.value"
            >
              {{ opt.text }}
            </b-button>
          </div>
        </b-form-group>
      </b-form>
      <div class="d-flex flex-wrap gap-2 mt-4">
        <b-button variant="primary" :disabled="creating" @click="createSchedule">
          {{ creating ? 'Saving…' : 'Start schedule' }}
        </b-button>
        <b-button variant="outline-secondary" @click="showCreate = false">Cancel</b-button>
      </div>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import CrmCustomerPicker from '@/components/crm/CrmCustomerPicker.vue'
import { onMounted, ref } from 'vue'
import { crmApi } from '@/api'
import { useCrmWorkspace } from '@/composables/useCrmWorkspace'
import { formatApiError } from '@/utils/formatApiError'

const { activeBusinessId } = useCrmWorkspace()
const items = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')
const note = ref('')
const busyId = ref<number | null>(null)
const showCreate = ref(false)
const creating = ref(false)
const formError = ref('')
const form = ref({
  label: '',
  customer_id: null as number | null,
  template_id: null as number | null,
  frequency: 'monthly',
})
const showNewClient = ref(false)
const savingClient = ref(false)
const newClientName = ref('')
const newClientPhone = ref('')
const templateOptions = ref<{ id: number | null; name: string }[]>([{ id: null, name: '— Select —' }])

const frequencyOptions = [
  { value: 'weekly', text: 'Weekly' },
  { value: 'monthly', text: 'Monthly' },
  { value: 'quarterly', text: 'Every 3 months' },
]

const fields = [
  { key: 'label', label: 'Name' },
  { key: 'customer', label: 'Client' },
  { key: 'template', label: 'Template' },
  { key: 'frequency', label: 'How often' },
  { key: 'next_run_at', label: 'Next bill' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: '' },
]

function formatDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString()
}

function customerLabel(item: Record<string, unknown>): string {
  const c = item.customer as { name?: string } | undefined
  return c?.name || String(item.customer_id ?? '—')
}

function templateLabel(item: Record<string, unknown>): string {
  const t = item.template as { name?: string } | undefined
  return t?.name || (item.template_id ? `#${item.template_id}` : '—')
}

function frequencyLabel(raw: unknown): string {
  const f = String(raw ?? '').toLowerCase()
  if (f === 'weekly') return 'Weekly'
  if (f === 'quarterly') return 'Quarterly'
  return 'Monthly'
}

async function loadOptions() {
  const bid = activeBusinessId.value ?? undefined
  try {
    const tplRes = await crmApi.getInvoiceTemplates({ business_id: bid })
    const tplData = tplRes.data as { results?: Record<string, unknown>[] } | Record<string, unknown>[]
    const tplList = Array.isArray(tplData)
      ? tplData
      : Array.isArray((tplData as { results?: unknown[] })?.results)
        ? (tplData as { results: Record<string, unknown>[] }).results
        : []
    templateOptions.value = [
      { id: null, name: '— Select —' },
      ...tplList.map((t) => ({ id: t.id as number, name: String(t.name ?? t.id) })),
    ]
  } catch {
    /* keep defaults */
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await crmApi.getRecurringInvoices({ business_id: activeBusinessId.value ?? undefined })
    const payload = data as { results?: Record<string, unknown>[] } | Record<string, unknown>[]
    items.value = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load schedules')
    items.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = { label: '', customer_id: null, template_id: null, frequency: 'monthly' }
  formError.value = ''
  showNewClient.value = false
  showCreate.value = true
  void loadOptions()
}

async function createClient() {
  const name = newClientName.value.trim()
  if (!name) {
    formError.value = 'Enter a client name.'
    return
  }
  savingClient.value = true
  formError.value = ''
  try {
    const payload: Record<string, unknown> = { name, phone: newClientPhone.value.trim() || undefined }
    if (activeBusinessId.value != null) payload.business_id = activeBusinessId.value
    const { data } = await crmApi.createCustomer(payload)
    const id = Number((data as { id?: number }).id)
    if (id) {
      form.value.customer_id = id
      showNewClient.value = false
      newClientName.value = ''
      newClientPhone.value = ''
    }
  } catch (e: unknown) {
    formError.value = formatApiError(e, 'Could not save client')
  } finally {
    savingClient.value = false
  }
}

async function createSchedule() {
  formError.value = ''
  if (!form.value.customer_id || !form.value.template_id) {
    formError.value = 'Pick a client and a saved bill.'
    return
  }
  creating.value = true
  try {
    await crmApi.createRecurringInvoice({
      business_id: activeBusinessId.value ?? undefined,
      customer_id: form.value.customer_id,
      template_id: form.value.template_id,
      frequency: form.value.frequency,
      label: form.value.label.trim() || undefined,
    })
    showCreate.value = false
    note.value = 'Schedule started.'
    await load()
  } catch (e: unknown) {
    formError.value = formatApiError(e, 'Failed to create schedule')
  } finally {
    creating.value = false
  }
}

async function generateNow(item: Record<string, unknown>) {
  const id = Number(item.id)
  if (!id) return
  busyId.value = id
  note.value = ''
  error.value = ''
  try {
    const { data } = await crmApi.generateRecurringInvoice(id)
    const inv = (data as { invoice?: { id?: number } })?.invoice
    note.value = inv?.id ? `Invoice #${inv.id} created.` : 'Invoice created.'
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Could not bill now')
  } finally {
    busyId.value = null
  }
}

async function toggleActive(item: Record<string, unknown>) {
  const id = Number(item.id)
  if (!id) return
  busyId.value = id
  error.value = ''
  try {
    await crmApi.updateRecurringInvoice(id, { is_active: !item.is_active })
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Update failed')
  } finally {
    busyId.value = null
  }
}

onMounted(() => {
  void load()
  void loadOptions()
})
</script>
