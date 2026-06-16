<template>
  <VerticalLayout>
    <b-card v-if="error && !payout" class="mb-0">
      <p class="text-danger mb-0">{{ error }}</p>
      <b-button variant="outline-secondary" class="mt-2" :to="{ name: 'admin.payouts' }">Back to Payouts</b-button>
    </b-card>
    <template v-else-if="payout">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.payouts' }">Back to Payouts</b-button>
      </div>
      <b-card :title="`Payout #${payout.id}`" class="mb-0">
        <b-list-group>
          <b-list-group-item><strong>Seller ID</strong> {{ payout.seller_id ?? payout.seller ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Amount</strong> {{ payout.amount ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Method</strong> {{ payout.method ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Status</strong> {{ payout.status ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Reference</strong> {{ payout.reference ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Created</strong> {{ formatDate(payout.created_at) }}</b-list-group-item>
          <b-list-group-item><strong>Processed</strong> {{ formatDate(payout.processed_at) }}</b-list-group-item>
        </b-list-group>
      </b-card>
    </template>
    <p v-else-if="loading" class="text-muted">Loading…</p>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { payoutsAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const route = useRoute()
const id = computed(() => Number(route.params.id) || 0)
const loading = ref(false)
const error = ref('')
const payout = ref<Record<string, unknown> | null>(null)

function formatDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString()
}

async function load() {
  if (!id.value) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await payoutsAdminApi.get(id.value)
    payout.value = (data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load payout')
    payout.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(id, load)
</script>
