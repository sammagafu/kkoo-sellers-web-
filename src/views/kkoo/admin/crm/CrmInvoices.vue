<template>
  <VerticalLayout>
    <b-card title="CRM Invoices">
      <p class="text-muted mb-3">SME invoices (per business). Create invoice with customer, items, totals; link to debt when payment is credit.</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-form-select v-model="paymentFilter" :options="paymentOptions" class="w-auto" @change="applyFilter" />
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="primary" size="sm" :to="{ name: 'admin.crm.invoices.create' }">Create invoice</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(total_amount)="data">
          {{ formatCurrency(data.item.total_amount) }}
        </template>
        <template #cell(payment_status)="data">
          <b-badge :variant="paymentStatusVariant(data.item.payment_status)">{{ data.item.payment_status || 'pending' }}</b-badge>
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" :to="{ name: 'admin.crm.invoices.detail', params: { id: String(data.item.id) } }">View</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No invoices" message="CRM invoices will appear here when the API is configured and data exists. CRM is configured by your platform administrator or in the backend." />
      <b-pagination
        v-if="hasPagination"
        :model-value="page"
        :total-rows="total"
        :per-page="pageSize"
        size="sm"
        class="mt-3"
        @update:model-value="(v: unknown) => setPage(Number(v))"
      />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted, watch } from 'vue'
import { crmApi } from '@/api'
import { useCrmList } from '@/composables/useCrmList'

const paymentFilter = ref('')

const {
  items,
  total,
  page,
  pageSize,
  loading,
  error,
  hasPagination,
  setPage,
  load,
} = useCrmList(
  (params) => crmApi.getInvoices({ ...params, payment_status: paymentFilter.value || undefined }),
  {}
)

const paymentOptions = [
  { value: '', text: 'All statuses' },
  { value: 'pending', text: 'Pending' },
  { value: 'partial', text: 'Partial' },
  { value: 'paid', text: 'Paid' },
]

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'invoice_number', label: 'Invoice #' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'total_amount', label: 'Total' },
  { key: 'payment_status', label: 'Status' },
  { key: 'payment_method', label: 'Method' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function paymentStatusVariant(s: unknown): string {
  const status = String(s ?? '').toLowerCase()
  if (status === 'paid') return 'success'
  if (status === 'partial') return 'warning'
  return 'secondary'
}

function applyFilter() {
  setPage(1)
}

watch(paymentFilter, () => setPage(1))

onMounted(load)
</script>
