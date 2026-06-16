<template>
  <VerticalLayout>
    <b-card title="My Documents (KYC)">
      <p class="text-muted">Upload and manage your KYC documents for seller verification.</p>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <b-alert v-if="compliance && !compliance.is_compliant" show variant="warning" class="mb-3">
        Payouts may be on hold until required documents are approved.
      </b-alert>

      <b-card class="mb-3 bg-light">
        <h6 class="mb-2">Upload document</h6>
        <b-form @submit.prevent="upload">
          <b-form-group label="Document type" label-for="document_type">
            <b-form-select id="document_type" v-model="documentType" :options="documentTypeOptions" required @change="onTypeChange" />
          </b-form-group>
          <b-form-group label="Expiry date (YYYY-MM-DD)" class="mb-3">
            <b-form-input v-model="expiresAt" placeholder="2026-12-31" />
            <small class="text-muted">
              <span v-if="requiresExpiry">This document type requires an expiry date.</span>
              <span v-else>Some document types require expiry date; backend will enforce when required.</span>
            </small>
          </b-form-group>
          <b-form-group label="File" class="mb-3">
            <b-form-file v-model="file" accept=".pdf,.jpg,.jpeg,.png" />
          </b-form-group>
          <b-button type="submit" variant="primary" class="mt-1" :disabled="!file || !documentType">Upload</b-button>
        </b-form>
      </b-card>

      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive />
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else title="No documents uploaded" message="Upload KYC documents to speed up verification." />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted } from 'vue'
import { sellerDocumentsApi, documentRequirementsPublicApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const error = ref('')
const items = ref<Record<string, unknown>[]>([])
const file = ref<File | null>(null)
const documentType = ref('')
const documentTypeOptions = ref<{ value: string; text: string }[]>([{ value: '', text: 'Select type…' }])
const expiresAt = ref('')
const requiresExpiry = ref(false)
const compliance = ref<Record<string, any> | null>(null)

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'document_type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'expires_at', label: 'Expiry' },
  { key: 'created_at', label: 'Uploaded' },
]

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as Record<string, unknown>[]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    // Dynamic requirements (country defaults on backend; use TZ for now)
    const reqRes = await documentRequirementsPublicApi.list({ role: 'seller', country_code: 'TZ' })
    const reqs = normalizeList(reqRes.data)
    documentTypeOptions.value = [{ value: '', text: 'Select type…' }].concat(
      reqs.map((r: any) => ({ value: String(r.code), text: `${r.label ?? r.code}${r.is_required ? ' (required)' : ''}` })),
    )
    const { data } = await sellerDocumentsApi.list()
    items.value = normalizeList(data)
    const statusRes = await documentRequirementsPublicApi.status({ role: 'seller', country_code: 'TZ' })
    compliance.value = statusRes.data as any
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load documents')
    items.value = []
    compliance.value = null
  } finally {
    loading.value = false
  }
}

function onTypeChange() {
  const code = documentType.value
  const row = (compliance.value?.results ?? []).find((r: any) => String(r.code) === String(code))
  requiresExpiry.value = Boolean(row?.requires_expiry)
}

async function upload() {
  if (!file.value || !documentType.value) return
  error.value = ''
  const formData = new FormData()
  formData.append('document_type', documentType.value)
  formData.append('file', file.value)
  if (expiresAt.value) formData.append('expires_at', expiresAt.value)
  try {
    await sellerDocumentsApi.upload(formData)
    file.value = null
    documentType.value = ''
    expiresAt.value = ''
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Upload failed')
  }
}

onMounted(load)
</script>
