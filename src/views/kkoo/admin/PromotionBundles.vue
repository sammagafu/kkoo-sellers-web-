<template>
  <VerticalLayout>
    <b-card title="Promotion Bundles">
      <p class="text-muted">Bundle promotions (product sets). API: GET /promotions/admin/bundles/ — placeholder until backend supports full CRUD.</p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-primary" size="sm" @click="load">Refresh</b-button>
      </div>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <b-table v-else-if="items.length" :items="items" :fields="fields" striped responsive />
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted } from 'vue'
import { promotionsAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const error = ref('')
const items = ref<Record<string, unknown>[]>([])

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'is_active', label: 'Active' },
  { key: 'created_at', label: 'Created' },
]

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as Record<string, unknown>[]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await promotionsAdminApi.listBundles()
    items.value = normalizeList(data)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load bundles')
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
