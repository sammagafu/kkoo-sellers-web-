<template>
  <VerticalLayout>
    <b-card title="Notification preferences">
      <p class="text-muted mb-3">Subscribe to notification types: search matches, new items in a category, trending, or promotions. You’ll receive alerts when relevant updates occur.</p>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-alert v-if="successMessage" variant="success" dismissible show>{{ successMessage }}</b-alert>

      <h6 class="mb-2">Add subscription</h6>
      <b-form @submit.prevent="addSubscription" class="mb-4">
        <b-row class="align-items-end">
          <b-col md="3">
            <b-form-group label="Type" label-for="add-type">
              <b-form-select id="add-type" v-model="addForm.type" :options="typeOptions" />
            </b-form-group>
          </b-col>
          <b-col v-if="addForm.type === 'category_new'" md="3">
            <b-form-group label="Category ID" label-for="add-category_id">
              <b-form-input id="add-category_id" v-model.number="addForm.category_id" type="number" placeholder="e.g. 1" />
            </b-form-group>
          </b-col>
          <b-col v-if="addForm.type === 'search_match'" md="3">
            <b-form-group label="Search phrase" label-for="add-search_phrase">
              <b-form-input id="add-search_phrase" v-model="addForm.search_phrase" placeholder="Max 255 chars" maxlength="255" />
            </b-form-group>
          </b-col>
          <b-col md="auto">
            <b-button type="submit" variant="primary" size="sm" :disabled="addSaving">Subscribe</b-button>
          </b-col>
        </b-row>
      </b-form>

      <h6 class="mb-2">My subscriptions</h6>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive size="sm">
        <template #cell(type)="data">{{ data.item.type || '—' }}</template>
        <template #cell(category_id)="data">{{ data.item.category_id ?? '—' }}</template>
        <template #cell(search_phrase)="data">{{ data.item.search_phrase ?? '—' }}</template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-danger" :disabled="deletingId === data.item.id" @click="remove(data.item.id)">Unsubscribe</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted mb-0">Loading…</p>
      <p v-else class="text-muted mb-0">No subscriptions yet. Add one above.</p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, onMounted } from 'vue'
import { notificationsApi } from '@/api'

const items = ref<{ id: number; type?: string; category_id?: number; search_phrase?: string }[]>([])
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const addSaving = ref(false)
const deletingId = ref<number | null>(null)

const addForm = ref({
  type: 'trending',
  category_id: undefined as number | undefined,
  search_phrase: '',
})

const typeOptions = [
  { value: 'trending', text: 'Trending' },
  { value: 'promotion', text: 'Promotion' },
  { value: 'category_new', text: 'New in category' },
  { value: 'search_match', text: 'Search match' },
]

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
  { key: 'category_id', label: 'Category ID' },
  { key: 'search_phrase', label: 'Search phrase' },
  { key: 'actions', label: 'Actions' },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await notificationsApi.getPreferences()
    const raw = data as { results?: typeof items.value } | typeof items.value
    items.value = Array.isArray(raw) ? raw : (raw?.results ?? [])
  } catch (e: unknown) {
    const err = e as { response?: { status: number } }
    if (err.response?.status !== 404) {
      error.value = (e as { message?: string }).message ?? 'Failed to load preferences'
    }
    items.value = []
  } finally {
    loading.value = false
  }
}

async function addSubscription() {
  addSaving.value = true
  error.value = ''
  successMessage.value = ''
  const payload: { type: string; category_id?: number; search_phrase?: string } = {
    type: addForm.value.type,
  }
  if (addForm.value.type === 'category_new' && addForm.value.category_id != null) {
    payload.category_id = addForm.value.category_id
  }
  if (addForm.value.type === 'search_match' && addForm.value.search_phrase?.trim()) {
    payload.search_phrase = addForm.value.search_phrase.trim().slice(0, 255)
  }
  try {
    await notificationsApi.createPreference(payload)
    successMessage.value = 'Subscription added.'
    addForm.value = { type: 'trending', category_id: undefined, search_phrase: '' }
    await load()
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { errors?: Record<string, string> } } }).response?.data?.errors?.type
      ?? (e as { message?: string }).message ?? 'Failed to add subscription'
  } finally {
    addSaving.value = false
  }
}

async function remove(id: number) {
  deletingId.value = id
  error.value = ''
  try {
    await notificationsApi.deletePreference(id)
    await load()
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to remove subscription'
  } finally {
    deletingId.value = null
  }
}

onMounted(load)
</script>
