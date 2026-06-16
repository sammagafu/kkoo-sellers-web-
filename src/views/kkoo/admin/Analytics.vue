<template>
  <VerticalLayout>
    <b-row>
      <b-col>
        <b-card title="Analytics">
          <p class="text-muted">Admin overview, users, revenue, products, orders, promotions, riders, logistics, earnings.</p>
          <b-tabs content-class="mt-3">
            <b-tab title="Overview" active>
              <pre v-if="overview" class="bg-light p-3">{{ JSON.stringify(overview, null, 2) }}</pre>
              <p v-else-if="loadingOverview">Loading…</p>
              <p v-else-if="errorOverview" class="text-danger">{{ errorOverview }}</p>
            </b-tab>
            <b-tab title="Riders">
              <pre v-if="ridersData !== undefined" class="bg-light p-3">{{ JSON.stringify(ridersData, null, 2) }}</pre>
              <p v-else-if="loadingRiders">Loading…</p>
              <p v-else-if="errorRiders" class="text-danger">{{ errorRiders }}</p>
            </b-tab>
            <b-tab title="Logistics">
              <pre v-if="logisticsData !== undefined" class="bg-light p-3">{{ JSON.stringify(logisticsData, null, 2) }}</pre>
              <p v-else-if="loadingLogistics">Loading…</p>
              <p v-else-if="errorLogistics" class="text-danger">{{ errorLogistics }}</p>
            </b-tab>
            <b-tab title="Earnings">
              <pre v-if="earningsData !== undefined" class="bg-light p-3">{{ JSON.stringify(earningsData, null, 2) }}</pre>
              <p v-else-if="loadingEarnings">Loading…</p>
              <p v-else-if="errorEarnings" class="text-danger">{{ errorEarnings }}</p>
            </b-tab>
          </b-tabs>
        </b-card>
      </b-col>
    </b-row>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, onMounted } from 'vue'
import { analyticsAdminApi } from '@/api'

const overview = ref<unknown>(null)
const loadingOverview = ref(false)
const errorOverview = ref('')

const ridersData = ref<unknown>(undefined)
const loadingRiders = ref(false)
const errorRiders = ref('')

const logisticsData = ref<unknown>(undefined)
const loadingLogistics = ref(false)
const errorLogistics = ref('')

const earningsData = ref<unknown>(undefined)
const loadingEarnings = ref(false)
const errorEarnings = ref('')

async function loadOverview() {
  loadingOverview.value = true
  errorOverview.value = ''
  try {
    const { data } = await analyticsAdminApi.overview()
    overview.value = data
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    errorOverview.value = err.response?.data?.detail ?? 'Failed to load overview'
  } finally {
    loadingOverview.value = false
  }
}

async function loadRiders() {
  loadingRiders.value = true
  errorRiders.value = ''
  try {
    const { data } = await analyticsAdminApi.riders()
    ridersData.value = data
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    errorRiders.value = err.response?.data?.detail ?? 'Failed to load riders analytics'
  } finally {
    loadingRiders.value = false
  }
}

async function loadLogistics() {
  loadingLogistics.value = true
  errorLogistics.value = ''
  try {
    const { data } = await analyticsAdminApi.logistics()
    logisticsData.value = data
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    errorLogistics.value = err.response?.data?.detail ?? 'Failed to load logistics analytics'
  } finally {
    loadingLogistics.value = false
  }
}

async function loadEarnings() {
  loadingEarnings.value = true
  errorEarnings.value = ''
  try {
    const { data } = await analyticsAdminApi.earnings()
    earningsData.value = data
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    errorEarnings.value = err.response?.data?.detail ?? 'Failed to load earnings analytics'
  } finally {
    loadingEarnings.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadOverview(), loadRiders(), loadLogistics(), loadEarnings()])
})
</script>
