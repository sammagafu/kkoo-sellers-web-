<template>
  <VerticalLayout>
    <b-card v-if="error && !redemption" class="mb-0">
      <p class="text-danger mb-0">{{ error }}</p>
      <b-button variant="outline-secondary" class="mt-2" :to="{ name: 'admin.redemptions' }">Back to Redemptions</b-button>
    </b-card>
    <b-card v-else-if="!loaded" class="mb-0">
      <p class="text-muted mb-0">Loading redemption…</p>
    </b-card>
    <template v-else-if="redemption">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.redemptions' }">Back to Redemptions</b-button>
        <template v-if="redemption.status === 'pending'">
          <b-button variant="success" size="sm" @click="approve">Approve</b-button>
          <b-button variant="danger" size="sm" @click="reject">Reject</b-button>
        </template>
        <template v-else-if="redemption.status === 'approved'">
          <b-button variant="primary" size="sm" @click="complete">Complete</b-button>
        </template>
      </div>
      <b-card :title="`Redemption #${redemption.id}`" class="mb-0">
        <b-list-group>
          <b-list-group-item><strong>Status</strong> {{ redemption.status ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>User</strong> {{ redemption.user ?? redemption.user_id ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Points</strong> {{ redemption.points ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Created</strong> {{ formatDate(redemption.created_at) }}</b-list-group-item>
        </b-list-group>
      </b-card>
    </template>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { redemptionsAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const route = useRoute()
const id = computed(() => Number(route.params.id) || 0)
const loaded = ref(false)
const error = ref('')
const redemption = ref<Record<string, unknown> | null>(null)

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
    const { data } = await redemptionsAdminApi.get(id.value)
    redemption.value = (data ?? {}) as Record<string, unknown>
    loaded.value = true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load redemption')
    redemption.value = null
  }
}

async function approve() {
  try {
    await redemptionsAdminApi.approve(id.value)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to approve')
  }
}

async function reject() {
  try {
    await redemptionsAdminApi.reject(id.value)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to reject')
  }
}

async function complete() {
  try {
    await redemptionsAdminApi.complete(id.value)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to complete')
  }
}

onMounted(load)
watch(id, load)
</script>
