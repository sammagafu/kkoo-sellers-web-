<template>
  <VerticalLayout>
    <b-card title="Payment methods for cash withdrawal">
      <p class="text-muted mb-4">
        Configure how sellers can receive payouts. Add banks and mobile money providers, then set which are available.
        Sellers choose from available options in their profile.
      </p>
      <b-alert v-if="error" variant="danger" dismissible show>{{ error }}</b-alert>
      <b-alert v-if="successMessage" variant="success" dismissible show>{{ successMessage }}</b-alert>

      <!-- Banks -->
      <h6 class="mb-3">Banks</h6>
      <b-table
        v-if="settings.banks.length"
        :items="settings.banks"
        :fields="bankFields"
        striped
        responsive
        small
      >
        <template #cell(is_available)="{ item }">
          <b-form-checkbox v-model="item.is_available" switch @change="debounceSave" />
        </template>
        <template #cell(actions)="{ item, index }">
          <b-button size="sm" variant="outline-danger" @click="removeBank(index)">Remove</b-button>
        </template>
      </b-table>
      <p v-else class="text-muted small">No banks added. Add one below.</p>
      <div class="d-flex flex-wrap align-items-end gap-2 mb-4">
        <b-form-input v-model="newBank.name" placeholder="Bank name" class="w-auto" style="min-width: 140px;" />
        <b-form-input v-model="newBank.code" placeholder="Code (optional)" class="w-auto" style="max-width: 100px;" />
        <b-button variant="outline-primary" size="sm" :disabled="!newBank.name.trim()" @click="addBank">Add bank</b-button>
      </div>

      <!-- Mobile money -->
      <h6 class="mb-3">Mobile money providers</h6>
      <b-table
        v-if="settings.mobile_money_providers.length"
        :items="settings.mobile_money_providers"
        :fields="mmFields"
        striped
        responsive
        small
      >
        <template #cell(is_available)="{ item }">
          <b-form-checkbox v-model="item.is_available" switch @change="debounceSave" />
        </template>
        <template #cell(actions)="{ item, index }">
          <b-button size="sm" variant="outline-danger" @click="removeMobileMoney(index)">Remove</b-button>
        </template>
      </b-table>
      <p v-else class="text-muted small">No mobile money providers. Add one below.</p>
      <div class="d-flex flex-wrap align-items-end gap-2 mb-4">
        <b-form-input v-model="newMM.name" placeholder="Provider name (e.g. M-Pesa, Tigo Pesa)" class="w-auto" style="min-width: 160px;" />
        <b-form-input v-model="newMM.code" placeholder="Code (optional)" class="w-auto" style="max-width: 100px;" />
        <b-button variant="outline-primary" size="sm" :disabled="!newMM.name.trim()" @click="addMobileMoney">Add provider</b-button>
      </div>

      <!-- Selcom -->
      <h6 class="mb-2">Selcom</h6>
      <b-form-checkbox v-model="settings.selcom_enabled" switch @change="save">
        Enable Selcom for seller payouts
      </b-form-checkbox>
      <p class="small text-muted mb-0">When enabled, sellers can choose Selcom as a withdrawal option.</p>

      <div class="mt-4">
        <b-button variant="primary" :disabled="saving" @click="save">
          {{ saving ? 'Saving…' : 'Save all changes' }}
        </b-button>
      </div>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, reactive, onMounted } from 'vue'
import { payoutsAdminApi, type PayoutMethodsSettings, type PayoutMethodOption } from '@/api'

const bankFields = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'is_available', label: 'Available to sellers' },
  { key: 'actions', label: '' },
]
const mmFields = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'is_available', label: 'Available to sellers' },
  { key: 'actions', label: '' },
]

const settings = reactive<PayoutMethodsSettings>({
  banks: [],
  mobile_money_providers: [],
  selcom_enabled: false,
})
const newBank = reactive({ name: '', code: '' })
const newMM = reactive({ name: '', code: '' })
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
let saveTimeout: ReturnType<typeof setTimeout> | null = null

function getNextId(list: PayoutMethodOption[]): number {
  const ids = list.map((x) => (typeof x.id === 'number' ? x.id : parseInt(String(x.id), 10)))
  const max = ids.filter((n) => !Number.isNaN(n)).reduce((a, b) => Math.max(a, b), 0)
  return max + 1
}

function addBank() {
  const name = newBank.name.trim()
  if (!name) return
  settings.banks.push({
    id: getNextId(settings.banks),
    name,
    code: newBank.code.trim() || undefined,
    is_available: true,
  })
  newBank.name = ''
  newBank.code = ''
  debounceSave()
}

function removeBank(index: number) {
  settings.banks.splice(index, 1)
  debounceSave()
}

function addMobileMoney() {
  const name = newMM.name.trim()
  if (!name) return
  settings.mobile_money_providers.push({
    id: getNextId(settings.mobile_money_providers),
    name,
    code: newMM.code.trim() || undefined,
    is_available: true,
  })
  newMM.name = ''
  newMM.code = ''
  debounceSave()
}

function removeMobileMoney(index: number) {
  settings.mobile_money_providers.splice(index, 1)
  debounceSave()
}

function debounceSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(save, 600)
}

async function save() {
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await payoutsAdminApi.updatePayoutMethods({
      banks: [...settings.banks],
      mobile_money_providers: [...settings.mobile_money_providers],
      selcom_enabled: settings.selcom_enabled,
    })
    successMessage.value = 'Payment methods saved. Sellers will see available options in their profile.'
    setTimeout(() => { successMessage.value = '' }, 4000)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } }; message?: string }
    error.value = err.response?.data?.detail ?? err.message ?? 'Failed to save'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await payoutsAdminApi.getPayoutMethods()
    if (data) {
      settings.banks = Array.isArray(data.banks) ? data.banks : []
      settings.mobile_money_providers = Array.isArray(data.mobile_money_providers) ? data.mobile_money_providers : []
      settings.selcom_enabled = Boolean(data.selcom_enabled)
    }
  } catch {
    error.value = 'Could not load payment methods. Backend may not implement this yet. You can still add items and save when the API is ready.'
  } finally {
    loading.value = false
  }
})
</script>
