<template>
  <VerticalLayout>
    <b-card title="Referral Stats (Admin)">
      <p class="text-muted">Platform-wide referral statistics.</p>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <div v-else-if="stats" class="row g-3">
        <b-col md="4">
          <b-card class="bg-light">
            <h6 class="text-muted mb-1">Total referrals</h6>
            <p class="mb-0 fs-4">{{ stats.total_referrals ?? '—' }}</p>
          </b-card>
        </b-col>
        <b-col md="4">
          <b-card class="bg-light">
            <h6 class="text-muted mb-1">Completed referrals</h6>
            <p class="mb-0 fs-4">{{ stats.completed_referrals ?? '—' }}</p>
          </b-card>
        </b-col>
        <b-col md="4">
          <b-card class="bg-light">
            <h6 class="text-muted mb-1">Rewarded referrals</h6>
            <p class="mb-0 fs-4">{{ stats.rewarded_referrals ?? '—' }}</p>
          </b-card>
        </b-col>
      </div>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <b-button variant="outline-primary" size="sm" class="mt-2" @click="load">Refresh</b-button>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, onMounted } from 'vue'
import { rewardsAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const error = ref('')
const stats = ref<Record<string, unknown> | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await rewardsAdminApi.getReferralStats()
    stats.value = (data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load referral stats')
    stats.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
