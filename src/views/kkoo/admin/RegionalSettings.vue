<template>
  <VerticalLayout>
    <b-card title="Regional settings">
      <p class="text-muted mb-4">
        Manage supported currencies and phone country codes (dial extensions) shown in buyer, seller, and rider apps.
        TZS uses exchange rate <strong>1</strong> as the base; other rates are relative to TZS.
      </p>
      <b-alert v-if="error" variant="danger" dismissible show>{{ error }}</b-alert>
      <b-alert v-if="successMessage" variant="success" dismissible show>{{ successMessage }}</b-alert>

      <b-tabs v-model="activeTab" content-class="pt-3">
        <b-tab title="Currencies" active>
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-form-checkbox v-model="showInactiveCurrencies" switch @change="loadCurrencies">Show inactive</b-form-checkbox>
            <b-button size="sm" variant="outline-primary" @click="loadCurrencies">Refresh</b-button>
            <b-button size="sm" variant="primary" class="ms-auto" @click="showCurrencyCreate = true">Add currency</b-button>
          </div>

          <b-table v-if="currencies.length" :items="currencies" :fields="currencyFields" striped responsive small>
            <template #cell(is_active)="row">
              <b-badge :variant="row.item.is_active ? 'success' : 'secondary'">
                {{ row.item.is_active ? 'active' : 'inactive' }}
              </b-badge>
            </template>
            <template #cell(exchange_rate)="row">
              {{ formatRate(row.item.exchange_rate) }}
            </template>
            <template #cell(actions)="row">
              <b-button size="sm" variant="outline-secondary" @click="openCurrencyEdit(row.item)">Edit</b-button>
            </template>
          </b-table>
          <p v-else-if="currenciesLoading" class="text-muted">Loading…</p>
          <EmptyState v-else title="No currencies" message="Add currencies buyers can select in the app." />
        </b-tab>

        <b-tab title="Phone countries">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-form-checkbox v-model="showInactivePhone" switch @change="loadPhoneCountries">Show inactive</b-form-checkbox>
            <b-button size="sm" variant="outline-primary" @click="loadPhoneCountries">Refresh</b-button>
            <b-button size="sm" variant="primary" class="ms-auto" @click="showPhoneCreate = true">Add country</b-button>
          </div>

          <b-table v-if="phoneCountries.length" :items="phoneCountries" :fields="phoneFields" striped responsive small>
            <template #cell(dial_code)="row">
              <span>{{ row.item.flag_emoji ? row.item.flag_emoji + ' ' : '' }}{{ row.item.dial_code }}</span>
            </template>
            <template #cell(is_active)="row">
              <b-badge :variant="row.item.is_active ? 'success' : 'secondary'">
                {{ row.item.is_active ? 'active' : 'inactive' }}
              </b-badge>
            </template>
            <template #cell(is_default)="row">
              <b-badge v-if="row.item.is_default" variant="primary">default</b-badge>
              <span v-else class="text-muted">—</span>
            </template>
            <template #cell(actions)="row">
              <b-button size="sm" variant="outline-secondary" @click="openPhoneEdit(row.item)">Edit</b-button>
            </template>
          </b-table>
          <p v-else-if="phoneLoading" class="text-muted">Loading…</p>
          <EmptyState v-else title="No phone countries" message="Add dial codes for login and checkout phone fields." />
        </b-tab>
      </b-tabs>
    </b-card>

    <!-- Currency create -->
    <b-modal v-model="showCurrencyCreate" title="Add currency" hide-footer>
      <b-form @submit.prevent="createCurrency">
        <b-form-group label="Code" description="3-letter ISO code, e.g. TZS">
          <b-form-input v-model="currencyForm.code" maxlength="3" required />
        </b-form-group>
        <b-form-group label="Name">
          <b-form-input v-model="currencyForm.name" required />
        </b-form-group>
        <b-form-group label="Symbol">
          <b-form-input v-model="currencyForm.symbol" required />
        </b-form-group>
        <b-form-group label="Exchange rate (vs TZS base)" description="TZS = 1. KES ≈ 0.058 means 1000 TZS ≈ 58 KES.">
          <b-form-input v-model.number="currencyForm.exchange_rate" type="number" step="0.000001" min="0.000001" required />
        </b-form-group>
        <b-form-checkbox v-model="currencyForm.is_active" class="mb-3">Active</b-form-checkbox>
        <div class="d-flex justify-content-end gap-2">
          <b-button variant="outline-secondary" @click="showCurrencyCreate = false">Cancel</b-button>
          <b-button type="submit" variant="primary" :disabled="saving">Add</b-button>
        </div>
      </b-form>
    </b-modal>

    <!-- Currency edit -->
    <b-modal v-model="showCurrencyEdit" title="Edit currency" hide-footer>
      <b-form @submit.prevent="saveCurrencyEdit">
        <p class="text-muted small mb-3">Code: <strong>{{ currencyEditForm.code }}</strong></p>
        <b-form-group label="Name">
          <b-form-input v-model="currencyEditForm.name" required />
        </b-form-group>
        <b-form-group label="Symbol">
          <b-form-input v-model="currencyEditForm.symbol" required />
        </b-form-group>
        <b-form-group label="Exchange rate (vs TZS base)">
          <b-form-input v-model.number="currencyEditForm.exchange_rate" type="number" step="0.000001" min="0.000001" required />
        </b-form-group>
        <b-form-checkbox v-model="currencyEditForm.is_active" class="mb-3">Active</b-form-checkbox>
        <div class="d-flex justify-content-end gap-2">
          <b-button variant="outline-secondary" @click="showCurrencyEdit = false">Cancel</b-button>
          <b-button type="submit" variant="primary" :disabled="saving">Save</b-button>
        </div>
      </b-form>
    </b-modal>

    <!-- Phone create -->
    <b-modal v-model="showPhoneCreate" title="Add phone country" hide-footer>
      <b-form @submit.prevent="createPhone">
        <b-form-group label="ISO code" description="2-letter country code, e.g. TZ">
          <b-form-input v-model="phoneForm.iso_code" maxlength="2" required />
        </b-form-group>
        <b-form-group label="Country name">
          <b-form-input v-model="phoneForm.name" required />
        </b-form-group>
        <b-form-group label="Dial code" description="Include + prefix, e.g. +255">
          <b-form-input v-model="phoneForm.dial_code" placeholder="+255" required />
        </b-form-group>
        <b-form-group label="Flag emoji (optional)">
          <b-form-input v-model="phoneForm.flag_emoji" placeholder="🇹🇿" />
        </b-form-group>
        <b-form-group label="Display order">
          <b-form-input v-model.number="phoneForm.display_order" type="number" min="0" />
        </b-form-group>
        <b-form-checkbox v-model="phoneForm.is_active" class="mb-2">Active</b-form-checkbox>
        <b-form-checkbox v-model="phoneForm.is_default" class="mb-3">Default country in phone picker</b-form-checkbox>
        <div class="d-flex justify-content-end gap-2">
          <b-button variant="outline-secondary" @click="showPhoneCreate = false">Cancel</b-button>
          <b-button type="submit" variant="primary" :disabled="saving">Add</b-button>
        </div>
      </b-form>
    </b-modal>

    <!-- Phone edit -->
    <b-modal v-model="showPhoneEdit" title="Edit phone country" hide-footer>
      <b-form @submit.prevent="savePhoneEdit">
        <p class="text-muted small mb-3">ISO: <strong>{{ phoneEditForm.iso_code }}</strong></p>
        <b-form-group label="Country name">
          <b-form-input v-model="phoneEditForm.name" required />
        </b-form-group>
        <b-form-group label="Dial code">
          <b-form-input v-model="phoneEditForm.dial_code" required />
        </b-form-group>
        <b-form-group label="Flag emoji">
          <b-form-input v-model="phoneEditForm.flag_emoji" />
        </b-form-group>
        <b-form-group label="Display order">
          <b-form-input v-model.number="phoneEditForm.display_order" type="number" min="0" />
        </b-form-group>
        <b-form-checkbox v-model="phoneEditForm.is_active" class="mb-2">Active</b-form-checkbox>
        <b-form-checkbox v-model="phoneEditForm.is_default" class="mb-3">Default country</b-form-checkbox>
        <div class="d-flex justify-content-end gap-2">
          <b-button variant="outline-secondary" @click="showPhoneEdit = false">Cancel</b-button>
          <b-button type="submit" variant="primary" :disabled="saving">Save</b-button>
        </div>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import {
  currenciesAdminApi,
  phoneCountriesAdminApi,
  type CurrencyRow,
  type PhoneCountryRow,
} from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const activeTab = ref(0)
const error = ref('')
const successMessage = ref('')
const saving = ref(false)

const currencies = ref<CurrencyRow[]>([])
const currenciesLoading = ref(false)
const showInactiveCurrencies = ref(true)
const showCurrencyCreate = ref(false)
const showCurrencyEdit = ref(false)
const currencyEditId = ref<number | null>(null)
const currencyForm = ref({
  code: '',
  name: '',
  symbol: '',
  exchange_rate: 1,
  is_active: true,
})
const currencyEditForm = ref({
  code: '',
  name: '',
  symbol: '',
  exchange_rate: 1,
  is_active: true,
})

const phoneCountries = ref<PhoneCountryRow[]>([])
const phoneLoading = ref(false)
const showInactivePhone = ref(true)
const showPhoneCreate = ref(false)
const showPhoneEdit = ref(false)
const phoneEditId = ref<number | null>(null)
const phoneForm = ref({
  iso_code: '',
  name: '',
  dial_code: '',
  flag_emoji: '',
  display_order: 0,
  is_active: true,
  is_default: false,
})
const phoneEditForm = ref({
  iso_code: '',
  name: '',
  dial_code: '',
  flag_emoji: '',
  display_order: 0,
  is_active: true,
  is_default: false,
})

const currencyFields = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'exchange_rate', label: 'Rate (vs TZS)' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: '' },
]

const phoneFields = [
  { key: 'iso_code', label: 'ISO' },
  { key: 'name', label: 'Country' },
  { key: 'dial_code', label: 'Dial code' },
  { key: 'display_order', label: 'Order' },
  { key: 'is_default', label: 'Default' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: '' },
]

function formatRate(n: number) {
  if (n == null || Number.isNaN(n)) return '—'
  return n < 0.01 ? n.toFixed(6) : n.toFixed(4)
}

async function loadCurrencies() {
  currenciesLoading.value = true
  error.value = ''
  try {
    const { data } = await currenciesAdminApi.list({ include_inactive: showInactiveCurrencies.value })
    currencies.value = data?.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    currenciesLoading.value = false
  }
}

async function loadPhoneCountries() {
  phoneLoading.value = true
  error.value = ''
  try {
    const { data } = await phoneCountriesAdminApi.list({ include_inactive: showInactivePhone.value })
    phoneCountries.value = data?.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    phoneLoading.value = false
  }
}

async function createCurrency() {
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await currenciesAdminApi.create({
      code: currencyForm.value.code.trim().toUpperCase(),
      name: currencyForm.value.name.trim(),
      symbol: currencyForm.value.symbol.trim(),
      exchange_rate: currencyForm.value.exchange_rate,
      is_active: currencyForm.value.is_active,
    })
    showCurrencyCreate.value = false
    currencyForm.value = { code: '', name: '', symbol: '', exchange_rate: 1, is_active: true }
    successMessage.value = 'Currency added.'
    await loadCurrencies()
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    saving.value = false
  }
}

function openCurrencyEdit(row: CurrencyRow) {
  currencyEditId.value = row.id
  currencyEditForm.value = {
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    exchange_rate: row.exchange_rate,
    is_active: row.is_active,
  }
  showCurrencyEdit.value = true
}

async function saveCurrencyEdit() {
  if (currencyEditId.value == null) return
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await currenciesAdminApi.patch(currencyEditId.value, {
      name: currencyEditForm.value.name.trim(),
      symbol: currencyEditForm.value.symbol.trim(),
      exchange_rate: currencyEditForm.value.exchange_rate,
      is_active: currencyEditForm.value.is_active,
    })
    showCurrencyEdit.value = false
    successMessage.value = 'Currency updated.'
    await loadCurrencies()
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    saving.value = false
  }
}

async function createPhone() {
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await phoneCountriesAdminApi.create({
      iso_code: phoneForm.value.iso_code.trim().toUpperCase(),
      name: phoneForm.value.name.trim(),
      dial_code: phoneForm.value.dial_code.trim(),
      flag_emoji: phoneForm.value.flag_emoji.trim() || undefined,
      display_order: phoneForm.value.display_order,
      is_active: phoneForm.value.is_active,
      is_default: phoneForm.value.is_default,
    })
    showPhoneCreate.value = false
    phoneForm.value = {
      iso_code: '',
      name: '',
      dial_code: '',
      flag_emoji: '',
      display_order: 0,
      is_active: true,
      is_default: false,
    }
    successMessage.value = 'Phone country added.'
    await loadPhoneCountries()
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    saving.value = false
  }
}

function openPhoneEdit(row: PhoneCountryRow) {
  phoneEditId.value = row.id
  phoneEditForm.value = {
    iso_code: row.iso_code,
    name: row.name,
    dial_code: row.dial_code,
    flag_emoji: row.flag_emoji ?? '',
    display_order: row.display_order,
    is_active: row.is_active,
    is_default: row.is_default,
  }
  showPhoneEdit.value = true
}

async function savePhoneEdit() {
  if (phoneEditId.value == null) return
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await phoneCountriesAdminApi.patch(phoneEditId.value, {
      name: phoneEditForm.value.name.trim(),
      dial_code: phoneEditForm.value.dial_code.trim(),
      flag_emoji: phoneEditForm.value.flag_emoji.trim() || undefined,
      display_order: phoneEditForm.value.display_order,
      is_active: phoneEditForm.value.is_active,
      is_default: phoneEditForm.value.is_default,
    })
    showPhoneEdit.value = false
    successMessage.value = 'Phone country updated.'
    await loadPhoneCountries()
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCurrencies()
  loadPhoneCountries()
})
</script>
