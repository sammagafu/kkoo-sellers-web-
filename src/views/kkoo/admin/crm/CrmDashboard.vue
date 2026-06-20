<template>
  <VerticalLayout>
    <b-card title="CRM Dashboard">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span class="text-muted">Period:</span>
        <b-form-select v-model="period" :options="periodOptions" value-field="value" text-field="text" size="sm" class="w-auto" @change="load" />
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <template v-if="loading">
        <p class="text-muted">Loading…</p>
      </template>
      <template v-else-if="dashboard">
        <b-row>
          <b-col md="3">
            <b-card class="bg-primary text-white mb-3">
              <h6 class="text-white-50">Cash in</h6>
              <h4>{{ formatCurrency(dashboard.cash_in ?? dashboard.todays_sales ?? dashboard.today_invoices_total) }}</h4>
            </b-card>
          </b-col>
          <b-col md="3">
            <b-card class="bg-secondary text-white mb-3">
              <h6 class="text-white-50">Cash out</h6>
              <h4>{{ formatCurrency(dashboard.cash_out) }}</h4>
            </b-card>
          </b-col>
          <b-col md="3">
            <b-card class="bg-info text-white mb-3">
              <h6 class="text-white-50">Cash balance</h6>
              <h4>{{ formatCurrency(dashboard.cash_balance) }}</h4>
            </b-card>
          </b-col>
          <b-col md="3">
            <b-card class="bg-danger text-white mb-3">
              <h6 class="text-white-50">Total debt (Deni)</h6>
              <h4>{{ formatCurrency(dashboard.total_debt ?? dashboard.outstanding_debt) }}</h4>
            </b-card>
          </b-col>
        </b-row>
        <b-row>
          <b-col md="3">
            <b-card class="bg-warning text-dark mb-3">
              <h6>Low stock count</h6>
              <h4>{{ dashboard.low_stock_count ?? 0 }}</h4>
            </b-card>
          </b-col>
          <b-col md="3">
            <b-card class="bg-dark text-white mb-3">
              <h6 class="text-white-50">Debts overdue</h6>
              <h4>{{ dashboard.debts_overdue_count ?? 0 }}</h4>
            </b-card>
          </b-col>
          <b-col md="3">
            <b-card class="mb-3">
              <h6 class="text-muted">Petty cash in</h6>
              <h4>{{ formatCurrency(dashboard.petty_cash_in) }}</h4>
            </b-card>
          </b-col>
          <b-col md="3">
            <b-card class="mb-3">
              <h6 class="text-muted">Petty cash out</h6>
              <h4>{{ formatCurrency(dashboard.petty_cash_out) }}</h4>
            </b-card>
          </b-col>
        </b-row>
        <p v-if="apiUnavailable" class="text-muted small">CRM not connected.</p>
      </template>
      <div v-else-if="!loading && !error" class="text-center py-4">
        <p class="text-muted">No dashboard data</p>
        <b-button variant="outline-primary" @click="load">Retry</b-button>
      </div>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, onMounted } from 'vue'
import { crmApi } from '@/api'

const periodOptions = [
  { value: 'today', text: 'Today' },
  { value: 'this_week', text: 'This week' },
  { value: 'this_month', text: 'This month' },
]
const period = ref<'today' | 'this_week' | 'this_month'>('today')
const loading = ref(false)
const error = ref('')
const dashboard = ref<Record<string, unknown> | null>(null)
const apiUnavailable = ref(false)

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

async function load() {
  loading.value = true
  error.value = ''
  dashboard.value = null
  apiUnavailable.value = false
  try {
    const { data } = await crmApi.getDashboard({ period: period.value })
    dashboard.value = (data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 404 || err.response?.status === 501) {
      apiUnavailable.value = true
      dashboard.value = {
        cash_in: 0,
        cash_out: 0,
        cash_balance: 0,
        total_debt: 0,
        low_stock_count: 0,
        debts_overdue_count: 0,
      }
    } else {
      error.value = (err as { message?: string }).message ?? 'Failed to load dashboard'
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
