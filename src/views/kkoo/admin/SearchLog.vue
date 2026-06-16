<template>
  <VerticalLayout>
    <b-card title="Search log &amp; missing keywords">
      <p class="text-muted">
        Recent search queries (zero-result or all) and missing keywords for catalog improvements.
        Buyers can also
        <router-link :to="{ name: 'admin.catalog.missing-product-reports' }">submit missing-product reports with photos</router-link>.
      </p>
      <b-tabs v-model="activeTab" content-class="pt-3">
        <b-tab title="Search log">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-form-checkbox v-model="zeroResultOnly">Zero-result only</b-form-checkbox>
            <b-form-input v-model="limit" type="number" min="1" max="500" placeholder="Limit" class="w-auto" style="max-width: 100px;" />
            <b-button variant="primary" @click="loadSearchLog">Refresh</b-button>
          </div>
          <b-table v-if="searchLogItems.length" :items="searchLogItems" :fields="searchLogFields" striped responsive />
          <p v-else-if="searchLogLoading" class="text-muted">Loading…</p>
          <p v-else-if="searchLogError" class="text-danger">{{ searchLogError }}</p>
          <EmptyState v-else />
        </b-tab>
        <b-tab title="Missing keywords">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-form-input v-model="minCount" type="number" min="0" placeholder="Min count" class="w-auto" style="max-width: 100px;" />
            <b-form-input v-model="since" type="date" class="w-auto" />
            <b-button variant="primary" @click="loadMissing">Refresh</b-button>
          </div>
          <b-table v-if="missingItems.length" :items="missingItems" :fields="missingFields" striped responsive />
          <p v-else-if="missingLoading" class="text-muted">Loading…</p>
          <p v-else-if="missingError" class="text-danger">{{ missingError }}</p>
          <EmptyState v-else />
        </b-tab>
      </b-tabs>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted } from 'vue'
import { catalogAdminApi, catalogSearchApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const activeTab = ref(0)
const zeroResultOnly = ref(true)
const limit = ref('100')
const searchLogItems = ref<Record<string, unknown>[]>([])
const searchLogLoading = ref(false)
const searchLogError = ref('')
const searchLogFields = [
  { key: 'id', label: 'ID' },
  { key: 'query', label: 'Query' },
  { key: 'result_count', label: 'Results' },
  { key: 'created_at', label: 'Searched at' },
]

const minCount = ref('0')
const since = ref('')
const missingItems = ref<Record<string, unknown>[]>([])
const missingLoading = ref(false)
const missingError = ref('')
const missingFields = [
  { key: 'keyword', label: 'Keyword' },
  { key: 'times_searched', label: 'Times' },
  { key: 'last_searched', label: 'Last searched' },
]

function normalizeResults(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as Record<string, unknown>[]
}

async function loadSearchLog() {
  searchLogLoading.value = true
  searchLogError.value = ''
  try {
    const { data } = await catalogAdminApi.getSearchLog({
      result_count: zeroResultOnly.value ? 0 : undefined,
      limit: limit.value ? parseInt(limit.value, 10) : 100,
    })
    searchLogItems.value = normalizeResults(data)
  } catch (e: unknown) {
    searchLogError.value = formatApiError(e, 'Failed to load search log')
    searchLogItems.value = []
  } finally {
    searchLogLoading.value = false
  }
}

async function loadMissing() {
  missingLoading.value = true
  missingError.value = ''
  try {
    const { data } = await catalogSearchApi.missingKeywords({
      limit: 100,
      min_count: minCount.value ? parseInt(minCount.value, 10) : 0,
      ...(since.value && { since: since.value }),
    })
    const raw = (data as { missing_keywords?: unknown[] })?.missing_keywords ?? []
    missingItems.value = raw as Record<string, unknown>[]
  } catch (e: unknown) {
    missingError.value = formatApiError(e, 'Failed to load')
    missingItems.value = []
  } finally {
    missingLoading.value = false
  }
}

onMounted(() => {
  loadSearchLog()
  loadMissing()
})
</script>
