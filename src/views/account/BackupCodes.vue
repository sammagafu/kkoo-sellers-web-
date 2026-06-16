<template>
  <VerticalLayout>
    <b-card title="Backup codes">
      <p class="text-muted">
        One-time codes you can use at sign-in if you cannot receive SMS OTP. Each code works once. Store them in a password
        manager or print them—KKOO cannot show the same codes again from the server after you leave this page.
      </p>

      <b-alert v-if="error" variant="danger" show class="mb-3">{{ error }}</b-alert>
      <p v-if="statusNote && !allCodes.length" class="text-muted small mb-3">{{ statusNote }}</p>

      <div v-if="loading" class="text-muted py-3">Loading…</div>
      <template v-else>
        <b-row class="g-3 mb-4">
          <b-col cols="12" sm="6">
            <div class="border rounded p-3 h-100">
              <div class="text-muted small">Unused codes</div>
              <div class="fs-4 fw-semibold">{{ unusedCount }}</div>
            </div>
          </b-col>
          <b-col cols="12" sm="6">
            <div class="border rounded p-3 h-100">
              <div class="text-muted small">Already used</div>
              <div class="fs-4 fw-semibold">{{ consumedCount }}</div>
            </div>
          </b-col>
        </b-row>

        <div v-if="allCodes.length" class="mb-4">
          <h6 class="mb-1">All your codes</h6>
          <p class="text-muted small mb-3">
            Saved on this browser. Copy or print them—regenerating replaces unused codes on the server.
          </p>
          <div class="backup-codes-grid mb-3">
            <div
              v-for="(code, index) in allCodes"
              :key="`${index}-${code}`"
              class="backup-code-tile border rounded d-flex align-items-center gap-2 px-3 py-2"
            >
              <span class="backup-code-index rounded-circle flex-shrink-0">{{ index + 1 }}</span>
              <code class="backup-code-value flex-grow-1 mb-0">{{ code }}</code>
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <b-button variant="outline-primary" size="sm" @click="copyCodes">Copy all</b-button>
          </div>
        </div>

        <b-alert v-else-if="unusedCount > 0" show variant="warning" class="mb-4">
          You have {{ unusedCount }} unused code(s) on the server, but this browser does not have them saved. Regenerate to
          see all codes here (old unused codes will stop working).
        </b-alert>

        <div v-if="newCodesBanner" class="mb-3">
          <p class="text-warning small mb-0">{{ newCodesBanner }}</p>
        </div>

        <div class="d-flex flex-wrap gap-2 align-items-center">
          <b-button variant="primary" :disabled="regenerating || !codesAvailable" @click="confirmRegenerate">
            {{ unusedCount > 0 || allCodes.length ? 'Regenerate backup codes' : 'Generate backup codes' }}
          </b-button>
          <span v-if="!codesAvailable" class="text-muted small">Backup codes are not available in this environment.</span>
        </div>
      </template>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { toastSuccess, toastError } from '@/utils/toast'
import { loadStoredBackupCodes, saveStoredBackupCodes } from '@/utils/backupCodesStorage'

const auth = useAuthStore()

const loading = ref(true)
const regenerating = ref(false)
const error = ref('')
const unusedCount = ref(0)
const consumedCount = ref(0)
const codesAvailable = ref(true)
const statusNote = ref('')
const allCodes = ref<string[]>([])
const newCodesBanner = ref('')

const userId = computed(() => auth.user?.id)

async function loadStatus(showSpinner = true) {
  if (showSpinner) {
    loading.value = true
  }
  error.value = ''
  try {
    const { data } = await userApi.getBackupCodesStatus()
    const d = data as {
      unused_count?: number
      consumed_count?: number
      available?: boolean
      note?: string
    }
    unusedCount.value = typeof d.unused_count === 'number' ? d.unused_count : 0
    consumedCount.value = typeof d.consumed_count === 'number' ? d.consumed_count : 0
    codesAvailable.value = d.available !== false
    statusNote.value = typeof d.note === 'string' ? d.note : ''
    allCodes.value = loadStoredBackupCodes(userId.value)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load backup code status')
  } finally {
    if (showSpinner) {
      loading.value = false
    }
  }
}

async function confirmRegenerate() {
  const ok =
    typeof window !== 'undefined'
      ? window.confirm(
          unusedCount.value > 0
            ? 'This will invalidate your current unused backup codes and create a new set. Continue?'
            : 'Generate a new set of backup codes? All codes will appear below.',
        )
      : true
  if (!ok) return
  await doRegenerate()
}

async function doRegenerate() {
  regenerating.value = true
  error.value = ''
  newCodesBanner.value = ''
  try {
    const { data } = await userApi.regenerateBackupCodes()
    const d = data as { backup_codes?: string[]; backup_codes_message?: string }
    const list = Array.isArray(d.backup_codes) ? d.backup_codes.map(String).filter((s) => s.trim()) : []
    if (!list.length) {
      toastError('No codes returned')
      return
    }
    saveStoredBackupCodes(userId.value, list)
    allCodes.value = list
    if (d.backup_codes_message) {
      newCodesBanner.value = d.backup_codes_message
    }
    await loadStatus(false)
    toastSuccess('All backup codes are shown below—copy and store them safely.')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Regenerate failed')
    toastError(error.value)
  } finally {
    regenerating.value = false
  }
}

async function copyCodes() {
  const text = allCodes.value.join('\n').trim()
  if (!text || typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(text)
    toastSuccess('Copied to clipboard')
  } catch {
    toastError('Could not copy')
  }
}

onMounted(loadStatus)
</script>

<style scoped>
.backup-codes-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.backup-code-index {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--bs-primary-bg-subtle, #f0e8f5);
  color: var(--bs-primary, #6b2d8a);
}

.backup-code-value {
  font-size: 1.1rem;
  letter-spacing: 0.08em;
}
</style>
