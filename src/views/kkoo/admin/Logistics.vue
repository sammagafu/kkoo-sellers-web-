<template>
  <VerticalLayout>
    <b-card title="Logistics" class="mb-4">
      <p class="text-muted mb-3">Admin-only driver management.</p>

      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-input
          v-model="q"
          size="sm"
          class="w-auto"
          placeholder="Search name or phone…"
        />
        <b-form-select v-model="status" :options="statusOptions" size="sm" class="w-auto" />
        <b-form-select v-model="zone" :options="zoneOptions" size="sm" class="w-auto" />
        <b-button variant="outline-primary" size="sm" :disabled="loading" @click="load">Refresh</b-button>
      </div>

      <p v-if="error" class="text-danger mb-3">{{ error }}</p>

      <b-table v-if="filteredDrivers.length" :items="filteredDrivers" :fields="driverFields" striped responsive>
        <template #cell(user)="row">
          <div class="small">
            <div class="fw-semibold">
              {{ displayName(row.item.user) }}
            </div>
            <div class="text-muted">{{ displayPhone(row.item.user) }}</div>
          </div>
        </template>

        <template #cell(actions)="row">
          <b-button
            size="sm"
            variant="outline-primary"
            :to="{ name: 'admin.drivers.detail', params: { id: row.item.id } }"
          >
            View
          </b-button>
        </template>
      </b-table>

      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { computed, onMounted, ref } from 'vue'
import { logisticsAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { toastError, toastSuccess } from '@/utils/toast'

type DriverRow = Record<string, unknown> & { id?: number; status?: string; verification_status?: string; user?: Record<string, unknown> }

const loading = ref(false)
const error = ref('')
const drivers = ref<DriverRow[]>([])
const status = ref<string>('all')
const zone = ref<string>('all')
const zones = ref<Array<{ id?: number; name?: string; code?: string }>>([])
const q = ref('')

const statusOptions = [
  { value: 'all', text: 'All statuses' },
  { value: 'pending', text: 'Pending' },
  { value: 'active', text: 'Active' },
  { value: 'inactive', text: 'Inactive' },
  { value: 'rejected', text: 'Rejected' },
]

const zoneOptions = computed(() => {
  const opts: Array<{ value: string; text: string }> = [{ value: 'all', text: 'All zones' }]
  for (const z of zones.value) {
    const label = (z.name || z.code || z.id) ? `${z.name ?? z.code ?? z.id}` : 'Zone'
    const value = String(z.code ?? z.id ?? '')
    if (value) opts.push({ value, text: label })
  }
  return opts
})

const driverFields = [
  { key: 'id', label: 'ID' },
  { key: 'user', label: 'Driver' },
  { key: 'status', label: 'Status' },
  { key: 'verification_status', label: 'Verification' },
  { key: 'actions', label: 'Actions' },
]

function normalizeList(data: unknown): DriverRow[] {
  if (Array.isArray(data)) return data as DriverRow[]
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as DriverRow[]
}

function displayName(u: unknown): string {
  const user = (u ?? {}) as Record<string, unknown>
  const full = String(user.full_name ?? '').trim()
  if (full) return full
  const first = String(user.first_name ?? '').trim()
  const last = String(user.last_name ?? '').trim()
  const joined = [first, last].filter(Boolean).join(' ').trim()
  return joined || String(user.username ?? user.phone_number ?? '—')
}

function displayPhone(u: unknown): string {
  const user = (u ?? {}) as Record<string, unknown>
  const phone = String(user.phone_number ?? '').trim()
  return phone || '—'
}

function matchesQuery(driver: DriverRow, query: string): boolean {
  const qq = query.trim().toLowerCase()
  if (!qq) return true
  const u = (driver.user ?? {}) as Record<string, unknown>
  const name = displayName(u).toLowerCase()
  const phone = displayPhone(u).toLowerCase()
  return name.includes(qq) || phone.includes(qq)
}

const filteredDrivers = computed(() => {
  const query = q.value
  return drivers.value.filter((d) => matchesQuery(d, query))
})

async function loadZones() {
  try {
    const { data } = await logisticsAdminApi.listZones()
    const list = normalizeList(data) as Array<Record<string, unknown>>
    zones.value = list.map((z) => ({
      id: typeof z.id === 'number' ? z.id : Number(z.id),
      name: typeof z.name === 'string' ? z.name : undefined,
      code: typeof z.code === 'string' ? z.code : undefined,
    }))
  } catch {
    zones.value = []
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params: { status?: string; zone?: string } = {}
    if (status.value !== 'all') params.status = status.value
    if (zone.value !== 'all') params.zone = zone.value
    const { data } = await logisticsAdminApi.listDrivers(params)
    drivers.value = normalizeList(data)
    toastSuccess('Drivers loaded')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load drivers')
    drivers.value = []
    toastError(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadZones()
  await load()
})
</script>

