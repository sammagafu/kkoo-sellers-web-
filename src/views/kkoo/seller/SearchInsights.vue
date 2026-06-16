<template>
  <VerticalLayout class="insights-page">
    <b-row class="page-header-row mb-4">
      <b-col>
        <h4 class="page-heading mb-0">Search insights</h4>
        <p class="page-subtitle text-muted mb-0">Keywords that had zero or few results. Use these to add products or improve titles.</p>
      </b-col>
    </b-row>

    <!-- Key metric (Skillset-style) -->
    <h6 class="section-label mb-2 mt-4">Overview</h6>
    <p class="text-muted small mb-3">Keywords with low or zero results.</p>
    <b-row class="mb-4">
      <b-col md="6" lg="4" class="mb-3">
        <b-card no-body class="insights-stat-card insights-stat-card--hero h-100">
          <b-card-body class="d-flex align-items-center gap-3">
            <div class="insights-stat-icon-wrap insights-stat-icon--primary rounded">
              <Icon icon="solar:magnifer-bold-duotone" class="insights-stat-icon" />
            </div>
            <div class="min-w-0">
              <p class="insights-stat-label mb-0">Keywords (low results)</p>
              <p class="insights-stat-value mb-0">{{ items.length }}</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <h6 class="section-label mb-2 mt-4">Keywords</h6>
    <p class="text-muted small mb-3">Filter and refresh to see missing or low-result keywords.</p>
    <b-card>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-input v-model="minCount" type="number" min="0" placeholder="Min count (0 = zero results)" class="w-auto" style="max-width: 140px;" />
        <b-form-input v-model="since" type="date" class="w-auto" />
        <b-button variant="primary" @click="load">Refresh</b-button>
      </div>
      <b-table
        v-if="items.length"
        :items="items"
        :fields="fields"
        striped
        responsive
      />
      <p v-else-if="loading" class="text-muted mb-0">Loading…</p>
      <p v-else-if="error" class="text-danger mb-0">{{ error }}</p>
      <EmptyState v-else />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { catalogSearchApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const error = ref('')
const minCount = ref('0')
const since = ref('')
const items = ref<Record<string, unknown>[]>([])
const fields = [
  { key: 'keyword', label: 'Keyword' },
  { key: 'times_searched', label: 'Times searched' },
  { key: 'last_searched', label: 'Last searched' },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await catalogSearchApi.missingKeywords({
      limit: 100,
      min_count: minCount.value ? parseInt(minCount.value, 10) : 0,
      ...(since && { since: since.value }),
    })
    const raw = (data as { missing_keywords?: unknown[] })?.missing_keywords ?? []
    items.value = raw as Record<string, unknown>[]
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load')
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.insights-page .page-heading { font-size: 1.25rem; font-weight: 600; color: var(--bs-headings-color); }
.insights-page .page-subtitle { font-size: 0.875rem; line-height: 1.5; color: var(--bs-secondary-color); }
.insights-page .section-label {
  color: var(--bs-headings-color);
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: 0.01em;
}
.insights-stat-card .insights-stat-icon-wrap {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
}
.insights-stat-icon { width: 1.618rem; height: 1.618rem; color: inherit; }
.insights-stat-card .insights-stat-label { font-size: 0.875rem; line-height: 1.5; color: var(--bs-secondary-color); margin: 0; }
.insights-stat-card .insights-stat-value { font-size: 2rem; line-height: 1.2; font-weight: 600; letter-spacing: -0.02em; color: var(--bs-body-color); margin: 0; }
.insights-stat-icon--primary { background: linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.22), rgba(var(--bs-primary-rgb), 0.06)); color: var(--bs-primary); }
.insights-stat-card--hero {
  background: #5C308F !important;
  box-shadow: 0 8px 24px rgba(92, 48, 143, 0.35);
}
.insights-stat-card--hero .insights-stat-label { color: rgba(255, 255, 255, 0.85); }
.insights-stat-card--hero .insights-stat-value { color: #fff; }
.insights-stat-card--hero .insights-stat-icon-wrap { background: rgba(255, 255, 255, 0.2) !important; }
.insights-stat-card--hero .insights-stat-icon { color: #F7A829 !important; }
</style>
