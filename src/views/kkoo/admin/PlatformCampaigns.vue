<template>
  <VerticalLayout>
    <b-card title="Platform campaigns (buyers app)">
      <p class="text-muted small">
        Internal ads — <code>GET /campaigns/active/</code> in buyers app. Not merchant
        <code>/promotions/</code>.
      </p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-button variant="primary" @click="openCreate">Create campaign</b-button>
        <b-button variant="outline-secondary" :disabled="loading" @click="load">Refresh</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show dismissible>{{ error }}</b-alert>

      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(placement)="row">
          <code>{{ row.item.placement }}</code>
        </template>
        <template #cell(window)="row">
          <span class="small">{{ row.item.start_at }} → {{ row.item.end_at }}</span>
        </template>
        <template #cell(active)="row">
          <b-badge :variant="row.item.is_active ? 'success' : 'secondary'">
            {{ row.item.is_active ? 'Yes' : 'No' }}
          </b-badge>
        </template>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-primary" class="me-1" @click="openEdit(row.item)">
            Edit
          </b-button>
          <b-button size="sm" variant="outline-danger" @click="remove(row.item)">Delete</b-button>
        </template>
      </b-table>
      <p v-else-if="!loading" class="text-muted mb-0">No campaigns yet.</p>
    </b-card>

    <b-modal v-model="showModal" :title="editingId ? 'Edit campaign' : 'Create campaign'" size="lg" @ok="save">
      <b-form>
        <b-form-group label="Title" class="mb-2">
          <b-form-input v-model="form.title" required />
        </b-form-group>
        <b-form-group label="Subtitle" class="mb-2">
          <b-form-input v-model="form.subtitle" />
        </b-form-group>
        <b-form-group label="Placement" class="mb-2">
          <b-form-select v-model="form.placement" :options="placementOptions" />
        </b-form-group>
        <b-row>
          <b-col md="6">
            <b-form-group label="Start (RFC3339)" class="mb-2">
              <b-form-input v-model="form.start_at" placeholder="2026-05-20T00:00:00Z" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="End (RFC3339)" class="mb-2">
              <b-form-input v-model="form.end_at" placeholder="2026-06-20T00:00:00Z" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="CTA label" class="mb-2">
          <b-form-input v-model="form.cta_label" />
        </b-form-group>
        <b-form-group label="CTA route (buyers app)" class="mb-2">
          <b-form-input v-model="form.cta_route" placeholder="/weekly-pass" />
        </b-form-group>
        <b-form-group label="CTA external URL (optional)" class="mb-2">
          <b-form-input v-model="form.cta_external_url" />
        </b-form-group>
        <b-form-group label="Image URL" class="mb-2">
          <b-form-input v-model="form.image_url" />
        </b-form-group>
        <b-row>
          <b-col md="4">
            <b-form-group label="Priority (lower first)" class="mb-2">
              <b-form-input v-model.number="form.priority" type="number" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Max impressions / user" class="mb-2">
              <b-form-input v-model.number="form.max_impressions_per_user" type="number" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Cooldown (hours)" class="mb-2">
              <b-form-input v-model.number="form.cooldown_hours" type="number" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="Target app" class="mb-2">
          <b-form-select v-model="form.target_app_key" :options="appKeyOptions" />
        </b-form-group>
        <b-form-checkbox v-model="form.is_active">Active</b-form-checkbox>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { campaignsAdminApi, type AppCampaignPayload } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'

type CampaignRow = AppCampaignPayload & { id: number }

const items = ref<CampaignRow[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const editingId = ref<number | null>(null)

const placementOptions = [
  { value: 'home_hero', text: 'home_hero' },
  { value: 'rewards_top', text: 'rewards_top' },
]
const appKeyOptions = [
  { value: 'all', text: 'all' },
  { value: 'marketplace', text: 'marketplace' },
]

const fields = [
  { key: 'title', label: 'Title' },
  { key: 'placement', label: 'Placement' },
  { key: 'window', label: 'Window' },
  { key: 'cta_route', label: 'CTA route' },
  { key: 'priority', label: 'Priority' },
  { key: 'active', label: 'Active' },
  { key: 'actions', label: '' },
]

const form = reactive<AppCampaignPayload & { is_active?: boolean }>({
  title: '',
  subtitle: '',
  placement: 'home_hero',
  start_at: '',
  end_at: '',
  cta_label: '',
  cta_route: '/weekly-pass',
  cta_external_url: '',
  image_url: '',
  priority: 10,
  max_impressions_per_user: 5,
  cooldown_hours: 24,
  target_app_key: 'all',
  is_active: true,
})

function resetForm() {
  editingId.value = null
  Object.assign(form, {
    title: '',
    subtitle: '',
    placement: 'home_hero',
    start_at: '',
    end_at: '',
    cta_label: 'View',
    cta_route: '/weekly-pass',
    cta_external_url: '',
    image_url: '',
    priority: 10,
    max_impressions_per_user: 5,
    cooldown_hours: 24,
    target_app_key: 'all',
    is_active: true,
  })
}

function openCreate() {
  resetForm()
  showModal.value = true
}

function openEdit(row: CampaignRow) {
  editingId.value = row.id
  Object.assign(form, {
    title: row.title ?? '',
    subtitle: row.subtitle ?? '',
    placement: row.placement ?? 'home_hero',
    start_at: String(row.start_at ?? ''),
    end_at: String(row.end_at ?? ''),
    cta_label: row.cta_label ?? '',
    cta_route: row.cta_route ?? '',
    cta_external_url: row.cta_external_url ?? '',
    image_url: row.image_url ?? '',
    priority: row.priority ?? 10,
    max_impressions_per_user: row.max_impressions_per_user ?? 5,
    cooldown_hours: row.cooldown_hours ?? 24,
    target_app_key: row.target_app_key ?? 'all',
    is_active: row.is_active !== false,
  })
  showModal.value = true
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await campaignsAdminApi.list()
    const results = (data as { results?: CampaignRow[] }).results ?? []
    items.value = results
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load campaigns')
    items.value = []
  } finally {
    loading.value = false
  }
}

async function save(ev: Event) {
  ev.preventDefault()
  if (!form.title?.trim() || !form.start_at || !form.end_at) {
    error.value = 'Title, start_at, and end_at are required (RFC3339).'
    return
  }
  try {
    const payload = { ...form }
    if (editingId.value != null) {
      await campaignsAdminApi.patch(editingId.value, payload)
    } else {
      await campaignsAdminApi.create(payload)
    }
    showModal.value = false
    resetForm()
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Save failed')
  }
}

async function remove(row: CampaignRow) {
  const ok = await confirmDestructiveAction({
    title: 'Delete campaign?',
    text: row.title,
  })
  if (!ok) return
  try {
    await campaignsAdminApi.delete(row.id)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Delete failed')
  }
}

onMounted(load)
</script>
