<template>
  <div class="crm-customer-picker">
    <b-form-input
      v-model="query"
      :placeholder="placeholder"
      :disabled="disabled"
      autocomplete="off"
      @input="onQueryInput"
      @focus="open = true"
    />
    <div v-if="selectedLabel && !open" class="crm-customer-picker__selected text-muted small mt-1">
      Selected: <strong>{{ selectedLabel }}</strong>
      <button type="button" class="btn btn-link btn-sm p-0 ms-1" :disabled="disabled" @click="clear">Clear</button>
    </div>
    <div v-if="open" class="crm-customer-picker__menu border rounded bg-body shadow-sm mt-1">
      <button
        v-if="allowEmpty"
        type="button"
        class="crm-customer-picker__item"
        @click="pick(null)"
      >
        {{ emptyLabel }}
      </button>
      <p v-if="loading" class="small text-muted px-3 py-2 mb-0">Searching…</p>
      <p v-else-if="!options.length" class="small text-muted px-3 py-2 mb-0">No clients found.</p>
      <button
        v-for="opt in options"
        :key="opt.id"
        type="button"
        class="crm-customer-picker__item"
        @click="pick(opt)"
      >
        <span class="fw-semibold">{{ opt.name }}</span>
        <span v-if="opt.phone" class="text-muted small ms-2">{{ opt.phone }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { crmApi } from '@/api'
import { useCrmWorkspace } from '@/composables/useCrmWorkspace'

type CustomerOpt = { id: number; name: string; phone?: string }

const props = withDefaults(
  defineProps<{
    modelValue: number | null
    placeholder?: string
    allowEmpty?: boolean
    emptyLabel?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'Search clients by name or phone…',
    allowEmpty: false,
    emptyLabel: '— Walk-in —',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { activeBusinessId } = useCrmWorkspace()
const query = ref('')
const open = ref(false)
const loading = ref(false)
const options = ref<CustomerOpt[]>([])
const selected = ref<CustomerOpt | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const selectedLabel = computed(() => {
  if (!selected.value) return ''
  return selected.value.phone
    ? `${selected.value.name} · ${selected.value.phone}`
    : selected.value.name
})

async function searchClients(term: string) {
  loading.value = true
  try {
    const { data } = await crmApi.getCustomers({
      business_id: activeBusinessId.value ?? undefined,
      search: term.trim() || undefined,
      page: 1,
      page_size: 20,
    })
    const payload = data as { results?: Record<string, unknown>[] }
    const list = Array.isArray(payload?.results) ? payload.results : []
    options.value = list.map((c) => ({
      id: Number(c.id),
      name: String(c.name ?? c.id),
      phone: c.phone ? String(c.phone) : undefined,
    }))
  } catch {
    options.value = []
  } finally {
    loading.value = false
  }
}

function onQueryInput() {
  open.value = true
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    void searchClients(query.value)
  }, 250)
}

function pick(opt: CustomerOpt | null) {
  selected.value = opt
  query.value = opt ? (opt.phone ? `${opt.name} (${opt.phone})` : opt.name) : ''
  emit('update:modelValue', opt?.id ?? null)
  open.value = false
}

function clear() {
  pick(null)
}

async function hydrateSelected(id: number | null) {
  if (id == null) {
    selected.value = null
    return
  }
  if (selected.value?.id === id) return
  try {
    const { data } = await crmApi.getCustomer(id)
    const c = data as Record<string, unknown>
    selected.value = {
      id: Number(c.id),
      name: String(c.name ?? c.id),
      phone: c.phone ? String(c.phone) : undefined,
    }
    query.value = selected.value.phone
      ? `${selected.value.name} (${selected.value.phone})`
      : selected.value.name
  } catch {
    selected.value = { id, name: `Client #${id}` }
    query.value = selected.value.name
  }
}

watch(
  () => props.modelValue,
  (id) => {
    void hydrateSelected(id)
  },
  { immediate: true },
)

function onDocClick(e: MouseEvent) {
  const root = (e.target as HTMLElement | null)?.closest?.('.crm-customer-picker')
  if (!root) open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  void searchClients('')
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
.crm-customer-picker {
  position: relative;
}

.crm-customer-picker__menu {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  max-height: 240px;
  overflow: auto;
}

.crm-customer-picker__item {
  display: flex;
  align-items: baseline;
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
}

.crm-customer-picker__item:hover {
  background: color-mix(in srgb, var(--bs-primary, #5c308f) 8%, transparent);
}
</style>
