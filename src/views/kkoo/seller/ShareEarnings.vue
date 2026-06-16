<template>
  <VerticalLayout class="insights-page">
    <b-row class="page-header-row mb-4">
      <b-col>
        <h4 class="page-heading mb-0">Share earnings</h4>
        <p class="page-subtitle text-muted mb-0">Create share links for products and view your earnings from shares.</p>
      </b-col>
    </b-row>
    <p v-if="error" class="text-danger mb-3">{{ error }}</p>
    <p v-if="success" class="text-success mb-3">{{ success }}</p>

    <!-- Key metrics (Skillset-style) -->
    <h6 class="section-label mb-2 mt-4">Earnings overview</h6>
    <p class="text-muted small mb-3">Units sold and commission at a glance.</p>
    <b-row class="mb-4">
      <b-col md="6" lg="4" class="mb-3">
        <b-card no-body class="insights-stat-card insights-stat-card--hero h-100">
          <b-card-body class="d-flex align-items-center gap-3">
            <div class="insights-stat-icon-wrap insights-stat-icon--primary rounded">
              <Icon icon="solar:cart-large-2-bold-duotone" class="insights-stat-icon" />
            </div>
            <div class="min-w-0">
              <p class="insights-stat-label mb-0">Units sold (via shares)</p>
              <p class="insights-stat-value mb-0">{{ earnings?.units_sold ?? '—' }}</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col md="6" lg="4" class="mb-3">
        <b-card no-body class="insights-stat-card h-100">
          <b-card-body class="d-flex align-items-center gap-3">
            <div class="insights-stat-icon-wrap insights-stat-icon--warning rounded">
              <Icon icon="solar:clock-circle-bold-duotone" class="insights-stat-icon" />
            </div>
            <div class="min-w-0">
              <p class="insights-stat-label mb-0">Commission pending</p>
              <p class="insights-stat-value mb-0">{{ earnings?.commission_pending ?? '—' }}</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col md="6" lg="4" class="mb-3">
        <b-card no-body class="insights-stat-card h-100">
          <b-card-body class="d-flex align-items-center gap-3">
            <div class="insights-stat-icon-wrap insights-stat-icon--success rounded">
              <Icon icon="solar:wallet-money-bold-duotone" class="insights-stat-icon" />
            </div>
            <div class="min-w-0">
              <p class="insights-stat-label mb-0">Commission paid</p>
              <p class="insights-stat-value mb-0">{{ earnings?.commission_paid ?? '—' }}</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <h6 class="section-label mb-2 mt-4">Create share link</h6>
    <b-card class="mb-4">
      <b-form @submit.prevent="createShare">
        <b-form-group label="Product slug" description="Enter the product slug to create a share link.">
          <b-form-input v-model="shareProductSlug" placeholder="e.g. my-product-slug" />
        </b-form-group>
        <b-button type="submit" variant="primary" :disabled="creating">Create share</b-button>
      </b-form>
      <div v-if="lastShare" class="mt-3 p-3 bg-light rounded">
        <p class="mb-1"><strong>Share link created</strong></p>
        <p class="mb-0 small text-break">{{ lastShare.land_url ?? lastShare.code }}</p>
      </div>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { sharesApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const error = ref('')
const success = ref('')
const shareProductSlug = ref('')
const creating = ref(false)
const lastShare = ref<Record<string, unknown> | null>(null)
const earnings = ref<Record<string, unknown> | null>(null)
const earningsLoaded = ref(false)

async function createShare() {
  const slug = shareProductSlug.value?.trim()
  if (!slug) {
    error.value = 'Enter a product slug.'
    return
  }
  creating.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await sharesApi.create({ product_slug: slug })
    lastShare.value = (data ?? {}) as Record<string, unknown>
    success.value = 'Share link created.'
    loadEarnings()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to create share')
  } finally {
    creating.value = false
  }
}

async function loadEarnings() {
  earningsLoaded.value = false
  try {
    const { data } = await sharesApi.getEarnings()
    earnings.value = (data ?? {}) as Record<string, unknown>
  } catch {
    earnings.value = null
  } finally {
    earningsLoaded.value = true
  }
}

onMounted(loadEarnings)
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
.insights-stat-icon--success { background: linear-gradient(135deg, rgba(var(--bs-success-rgb), 0.22), rgba(var(--bs-success-rgb), 0.06)); color: var(--bs-success); }
.insights-stat-icon--warning { background: linear-gradient(135deg, rgba(var(--bs-warning-rgb), 0.22), rgba(var(--bs-warning-rgb), 0.06)); color: var(--bs-warning); }
.insights-stat-card--hero {
  background: #5C308F !important;
  box-shadow: 0 8px 24px rgba(92, 48, 143, 0.35);
}
.insights-stat-card--hero .insights-stat-label { color: rgba(255, 255, 255, 0.85); }
.insights-stat-card--hero .insights-stat-value { color: #fff; }
.insights-stat-card--hero .insights-stat-icon-wrap { background: rgba(255, 255, 255, 0.2) !important; }
.insights-stat-card--hero .insights-stat-icon { color: #F7A829 !important; }
</style>
