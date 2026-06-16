<template>
  <div class="flash-sales-dashboard">
    <div class="header-section mb-4">
      <h2 class="mb-2">Flash Sales</h2>
      <p class="text-muted mb-0">
        Fiber API: <code>GET/POST/PATCH/DELETE /admin/flash-sales/</code> — buyers see
        <code>GET /flash-sales/</code>
      </p>
    </div>

    <p v-if="error" class="alert alert-danger">{{ error }}</p>
    <p v-if="loading" class="text-muted">Loading flash sales…</p>

    <div v-else class="row mb-4">
      <div class="col-md-4">
        <div class="stat-card card shadow-sm">
          <div class="card-body">
            <small>Live now</small>
            <h3 class="mt-2 text-success">{{ liveSales.length }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card card shadow-sm">
          <div class="card-body">
            <small>Upcoming</small>
            <h3 class="mt-2 text-info">{{ upcomingSales.length }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card card shadow-sm">
          <div class="card-body">
            <small>Ended / inactive</small>
            <h3 class="mt-2 text-secondary">{{ endedSales.length }}</h3>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm mb-4">
      <div class="card-header bg-light">
        <h5 class="mb-0">Create flash sale</h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Name</label>
            <input v-model="form.name" type="text" class="form-control" required />
          </div>
          <div class="col-md-4">
            <label class="form-label">Start (local)</label>
            <input v-model="form.start_at" type="datetime-local" class="form-control" required />
          </div>
          <div class="col-md-4">
            <label class="form-label">End (local)</label>
            <input v-model="form.end_at" type="datetime-local" class="form-control" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">Vertical</label>
            <select v-model="form.vertical" class="form-select">
              <option value="all">all</option>
              <option value="marketplace">marketplace</option>
              <option value="food">food</option>
              <option value="grocery">grocery</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Description</label>
            <input v-model="form.description" type="text" class="form-control" />
          </div>
          <div class="col-12">
            <div class="form-check">
              <input id="fs-active" v-model="form.is_active" class="form-check-input" type="checkbox" />
              <label class="form-check-label" for="fs-active">Active (announces to buyers when in window)</label>
            </div>
          </div>
        </div>
        <button class="btn btn-success mt-3" :disabled="saving" @click="createSale">
          {{ saving ? 'Creating…' : 'Create flash sale' }}
        </button>
        <p class="text-muted small mt-2 mb-0">
          Add products via API: <code>POST /admin/flash-sales/:id/items/</code> (product_id, original_price, sale_price or discount_percent).
        </p>
      </div>
    </div>

    <div class="card shadow-sm">
      <div class="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 class="mb-0">All flash sales</h5>
        <button class="btn btn-sm btn-outline-secondary" :disabled="loading" @click="load">Refresh</button>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Window</th>
              <th>Vertical</th>
              <th>Status</th>
              <th>Items</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in allSales" :key="sale.id">
              <td><strong>{{ sale.name }}</strong></td>
              <td><code>{{ sale.slug }}</code></td>
              <td class="small">
                {{ formatDate(sale.start_at) }} → {{ formatDate(sale.end_at) }}
                <span v-if="secondsLeft(sale) > 0" class="text-success d-block">
                  {{ formatCountdown(secondsLeft(sale)) }} left
                </span>
              </td>
              <td>{{ sale.vertical }}</td>
              <td>
                <span :class="['badge', badgeClass(sale)]">{{ statusLabel(sale) }}</span>
              </td>
              <td>{{ sale.items?.length ?? 0 }}</td>
              <td class="text-end text-nowrap">
                <button
                  v-if="sale.is_active"
                  class="btn btn-sm btn-outline-warning me-1"
                  @click="setActive(sale, false)"
                >
                  Deactivate
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="removeSale(sale)">Delete</button>
              </td>
            </tr>
            <tr v-if="!allSales.length">
              <td colspan="7" class="text-muted text-center py-4">No flash sales yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  adminListFlashSales,
  adminCreateFlashSale,
  adminUpdateFlashSale,
  adminDeleteFlashSale,
} from '@/api/flashSales'
import type { FlashSale, FlashSaleCreatePayload } from '@/types/flashSales'
import { formatApiError } from '@/utils/formatApiError'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'

const allSales = ref<FlashSale[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const form = ref({
  name: '',
  description: '',
  start_at: '',
  end_at: '',
  vertical: 'all',
  is_active: true,
})

const now = () => Date.now()

function parseSaleTime(iso: string): number {
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

function isLive(sale: FlashSale): boolean {
  const n = now()
  return (
    sale.is_active &&
    parseSaleTime(sale.start_at) <= n &&
    parseSaleTime(sale.end_at) > n
  )
}

function isUpcoming(sale: FlashSale): boolean {
  return sale.is_active && parseSaleTime(sale.start_at) > now()
}

function isEnded(sale: FlashSale): boolean {
  return !sale.is_active || parseSaleTime(sale.end_at) <= now()
}

const liveSales = computed(() => allSales.value.filter(isLive))
const upcomingSales = computed(() => allSales.value.filter(isUpcoming))
const endedSales = computed(() => allSales.value.filter(isEnded))

function secondsLeft(sale: FlashSale): number {
  const rem = Math.floor((parseSaleTime(sale.end_at) - now()) / 1000)
  return rem > 0 ? rem : 0
}

function formatCountdown(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h ${m}m`
}

function statusLabel(sale: FlashSale): string {
  if (!sale.is_active) return 'inactive'
  if (isLive(sale)) return 'live'
  if (isUpcoming(sale)) return 'upcoming'
  return 'ended'
}

function badgeClass(sale: FlashSale): string {
  const s = statusLabel(sale)
  if (s === 'live') return 'bg-success'
  if (s === 'upcoming') return 'bg-info'
  return 'bg-secondary'
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function toIso(local: string): string {
  return new Date(local).toISOString()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await adminListFlashSales({ page: 1, page_size: 100 })
    allSales.value = data.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load flash sales')
    allSales.value = []
  } finally {
    loading.value = false
  }
}

async function createSale() {
  if (!form.value.name.trim() || !form.value.start_at || !form.value.end_at) {
    error.value = 'Name, start, and end are required.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload: FlashSaleCreatePayload = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      start_at: toIso(form.value.start_at),
      end_at: toIso(form.value.end_at),
      vertical: form.value.vertical,
      is_active: form.value.is_active,
    }
    await adminCreateFlashSale(payload)
    form.value = {
      name: '',
      description: '',
      start_at: '',
      end_at: '',
      vertical: 'all',
      is_active: true,
    }
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Create failed')
  } finally {
    saving.value = false
  }
}

async function setActive(sale: FlashSale, active: boolean) {
  try {
    await adminUpdateFlashSale(sale.id, { is_active: active })
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Update failed')
  }
}

async function removeSale(sale: FlashSale) {
  const ok = await confirmDestructiveAction({
    title: 'Delete flash sale?',
    text: `"${sale.name}" will be removed.`,
  })
  if (!ok) return
  try {
    await adminDeleteFlashSale(sale.id)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Delete failed')
  }
}

onMounted(load)
</script>

<style scoped>
.flash-sales-dashboard {
  padding: 1.5rem 0;
}

.stat-card {
  border-left: 4px solid #ffc107;
}
</style>
