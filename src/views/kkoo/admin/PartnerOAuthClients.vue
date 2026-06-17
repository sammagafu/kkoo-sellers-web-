<template>
  <VerticalLayout>
    <b-card title="Partner OAuth clients (Sign in with KKOO)">
      <p class="text-muted mb-4">
        Issue OAuth credentials for approved partners so their apps can use KKOO Account (Phase 3).
      </p>

      <b-form @submit.prevent="createClient">
        <b-row class="g-3">
          <b-col md="6">
            <b-form-group label="Partner">
              <b-form-select v-model.number="form.partnerId" :options="partnerOptions" required />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="App name">
              <b-form-input v-model="form.name" placeholder="Acme Travel" />
            </b-form-group>
          </b-col>
          <b-col cols="12">
            <b-form-group label="Redirect URIs (one per line)">
              <b-form-textarea
                v-model="form.redirectUris"
                rows="3"
                placeholder="https://partner.example/oauth/callback"
                required
              />
            </b-form-group>
          </b-col>
          <b-col cols="12">
            <b-form-group label="Scopes (comma-separated)">
              <b-form-input
                v-model="form.scopes"
                placeholder="openid, profile, partner:read"
              />
            </b-form-group>
          </b-col>
        </b-row>

        <p v-if="error" class="text-danger mt-3 mb-0">{{ error }}</p>

        <div v-if="issued" class="alert alert-success mt-3 mb-0">
          <p class="mb-2"><strong>Client created</strong> — copy these values now; the secret is shown once.</p>
          <p class="mb-1"><code>client_id:</code> {{ issued.client_id }}</p>
          <p class="mb-0"><code>client_secret:</code> {{ issued.client_secret }}</p>
        </div>

        <b-button type="submit" variant="primary" class="mt-3" :disabled="loading || !form.partnerId">
          {{ loading ? 'Creating…' : 'Create OAuth client' }}
        </b-button>
      </b-form>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { partnersAdminApi, type PartnerOAuthClientResponse, type PartnerRecord } from '@/api/partners'
import { formatApiError } from '@/utils/formatApiError'

const partners = ref<PartnerRecord[]>([])
const loading = ref(false)
const error = ref('')
const issued = ref<PartnerOAuthClientResponse | null>(null)

const form = ref({
  partnerId: 0,
  name: '',
  redirectUris: '',
  scopes: 'openid, profile, partner:read',
})

const partnerOptions = computed(() => [
  { value: 0, text: 'Select partner…', disabled: true },
  ...partners.value.map((p) => ({
    value: p.id,
    text: p.company_name || `Partner #${p.id}`,
  })),
])

async function loadPartners() {
  try {
    const { data } = await partnersAdminApi.listPartners()
    partners.value = data.results ?? []
    if (!form.value.partnerId && partners.value.length > 0) {
      form.value.partnerId = partners.value[0].id
    }
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load partners')
  }
}

async function createClient() {
  loading.value = true
  error.value = ''
  issued.value = null
  try {
    const redirect_uris = form.value.redirectUris
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
    const scopes = form.value.scopes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const { data } = await partnersAdminApi.createOAuthClient({
      partner_id: form.value.partnerId,
      name: form.value.name.trim() || undefined,
      redirect_uris,
      scopes,
    })
    issued.value = data
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to create OAuth client')
  } finally {
    loading.value = false
  }
}

onMounted(loadPartners)
</script>
