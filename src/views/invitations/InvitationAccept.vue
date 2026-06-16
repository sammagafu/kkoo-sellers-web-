<template>
  <VerticalLayout>
    <b-card title="Accept invitation">
      <template v-if="!token">
        <p class="text-danger mb-2">Invalid or missing invitation link.</p>
        <p class="text-muted small mb-3">The link may be incomplete or expired. Ask the person who invited you to send a new invitation.</p>
        <router-link :to="{ name: 'dashboards.index' }" class="btn btn-outline-primary">Go to dashboard</router-link>
      </template>

      <template v-else-if="success">
        <p class="text-success mb-2">{{ successMessage }}</p>
        <p class="text-muted small mb-3">You can now access CRM for this business from the seller or admin menu.</p>
        <b-button variant="primary" :to="redirectTo">Continue</b-button>
      </template>

      <template v-else-if="error">
        <p class="text-danger mb-2">{{ error }}</p>
        <p class="text-muted small mb-3">The invitation may have expired, or the link may have already been used. If you believe this is an error, contact support.</p>
        <router-link :to="{ name: 'dashboards.index' }" class="btn btn-outline-secondary me-2">Go to dashboard</router-link>
        <router-link :to="{ name: 'auth.sign-in' }" class="btn btn-outline-primary">Sign in again</router-link>
      </template>

      <template v-else>
        <p class="text-muted mb-3">You have been invited to join a business. Accept to get access to their CRM.</p>
        <b-button variant="primary" :disabled="loading" @click="accept">
          {{ loading ? 'Accepting…' : 'Accept invitation' }}
        </b-button>
      </template>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { crmApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const token = computed(() => {
  const t = route.query.token
  return typeof t === 'string' && t.trim() ? t.trim() : null
})

const loading = ref(false)
const success = ref(false)
const successMessage = ref('')
const error = ref('')

const redirectTo = computed(() => {
  if (auth.isSeller) return { name: 'seller.crm.dashboard' }
  return { name: 'dashboards.index' }
})

async function accept() {
  if (!token.value) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await crmApi.acceptInvitation(token.value)
    const payload = data as { business_name?: string; role?: string; message?: string }
    successMessage.value =
      payload.business_name && payload.role
        ? `You've joined ${payload.business_name} as ${payload.role}. You can now access CRM for this business.`
        : payload.message ?? "You've joined the business. You can now access CRM for this business."
    success.value = true
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { detail?: string; error?: string } }; message?: string }
    const msg = err.response?.data?.detail ?? err.response?.data?.error ?? err.message
    if (err.response?.status === 400 || err.response?.status === 404) {
      error.value = msg ?? 'This invitation is invalid or has expired. Your email may not match the invitation.'
    } else {
      error.value = msg ?? 'Failed to accept invitation. Please try again or contact support.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (token.value && !success.value && !error.value && !loading.value) {
    // Page just loaded with token; user can click Accept (we don't auto-submit)
  }
})
</script>
