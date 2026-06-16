<template>
  <VerticalLayout>
    <b-card v-if="error && !returnReq" class="mb-0">
      <p class="text-danger mb-0">{{ error }}</p>
      <b-button variant="outline-secondary" class="mt-2" :to="{ name: 'admin.returns' }">Back to Returns</b-button>
    </b-card>
    <b-card v-else-if="!loaded" class="mb-0">
      <p class="text-muted mb-0">Loading return…</p>
    </b-card>
    <template v-else-if="returnReq">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.returns' }">Back to Returns</b-button>
        <template v-if="returnReq.status === 'pending'">
          <b-button variant="success" size="sm" @click="approve">Approve</b-button>
          <b-button variant="danger" size="sm" @click="reject">Reject</b-button>
        </template>
        <template v-else-if="returnReq.status === 'approved'">
          <b-button variant="outline-primary" size="sm" @click="markItemReceived">Item received</b-button>
          <b-button variant="primary" size="sm" @click="processRefund">Process refund</b-button>
        </template>
      </div>
      <b-card :title="`Return #${returnReq.id}`" class="mb-0">
        <b-list-group class="mb-3">
          <b-list-group-item><strong>Status</strong> {{ returnReq.status ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Order</strong> {{ returnReq.order_id ?? returnReq.order ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Reason</strong> {{ returnReq.reason ?? '—' }}</b-list-group-item>
          <b-list-group-item v-if="returnReq.detailed_reason"><strong>Details</strong> {{ returnReq.detailed_reason }}</b-list-group-item>
          <b-list-group-item><strong>Created</strong> {{ formatDate(returnReq.created_at) }}</b-list-group-item>
        </b-list-group>
        <b-card-title tag="h6" class="mb-2">Items to return</b-card-title>
        <pre v-if="returnReq.items_to_return" class="bg-light p-3 rounded small">{{ JSON.stringify(returnReq.items_to_return, null, 2) }}</pre>
        <p v-else class="text-muted">No items listed.</p>
      </b-card>
    </template>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ordersAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const route = useRoute()
const id = computed(() => Number(route.params.id) || 0)
const loaded = ref(false)
const error = ref('')
const returnReq = ref<Record<string, unknown> | null>(null)

function formatDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString()
}

async function load() {
  if (!id.value) return
  loaded.value = false
  error.value = ''
  try {
    const { data } = await ordersAdminApi.getReturn(id.value)
    returnReq.value = (data ?? {}) as Record<string, unknown>
    loaded.value = true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load return')
    returnReq.value = null
  }
}

async function approve() {
  try {
    await ordersAdminApi.approveReturn(id.value)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to approve')
  }
}

async function reject() {
  try {
    await ordersAdminApi.rejectReturn(id.value)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to reject')
  }
}

async function markItemReceived() {
  try {
    await ordersAdminApi.itemReceivedReturn(id.value)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to mark item received')
  }
}

async function processRefund() {
  try {
    await ordersAdminApi.processRefundReturn(id.value)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to process refund')
  }
}

onMounted(load)
watch(id, load)
</script>
