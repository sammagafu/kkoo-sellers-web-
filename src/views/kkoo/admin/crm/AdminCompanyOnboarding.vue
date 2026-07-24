<template>
  <VerticalLayout class="admin-onboard">
    <header class="admin-onboard__head mb-4">
      <p class="admin-onboard__eyebrow mb-1">Platform CRM</p>
      <h1 class="admin-onboard__title mb-2">Company onboarding</h1>
      <p class="admin-onboard__lead text-muted mb-0">
        Register a business, set its type, then invite the owner and team by phone.
      </p>
    </header>

    <nav class="admin-onboard__steps mb-4" aria-label="Onboarding steps">
      <button
        v-for="s in stepMeta"
        :key="s.n"
        type="button"
        class="admin-onboard__step"
        :class="{
          'admin-onboard__step--active': step === s.n,
          'admin-onboard__step--done': step > s.n,
        }"
        :disabled="s.n > step && !createdBusinessId"
        @click="goStep(s.n)"
      >
        <span class="admin-onboard__step-num">{{ s.n }}</span>
        <span class="admin-onboard__step-label">{{ s.label }}</span>
      </button>
    </nav>

    <b-alert v-if="pageError" variant="danger" show class="mb-3">{{ pageError }}</b-alert>

    <!-- Step 1: Company -->
    <section v-show="step === 1" class="admin-onboard__panel">
      <h2 class="h5 mb-1">Company details</h2>
      <p class="text-muted small mb-3">Name and type are required. Owner can be an existing KKOO user.</p>

      <b-row class="g-3">
        <b-col md="8">
          <b-form-group label="Company name *" :invalid-feedback="fieldErrors.name" :state="fieldState('name')">
            <b-form-input v-model="form.name" placeholder="e.g. Dar Fresh Market" maxlength="120" />
          </b-form-group>
        </b-col>
        <b-col md="4">
          <b-form-group label="Currency">
            <b-form-input v-model="form.currency" placeholder="TZS" />
          </b-form-group>
        </b-col>
        <b-col cols="12">
          <b-form-group label="Business type *">
            <div v-if="optionsLoading" class="text-muted small">Loading types…</div>
            <div v-else class="admin-onboard__verticals">
              <button
                v-for="v in verticals"
                :key="v.key"
                type="button"
                class="admin-onboard__vertical"
                :class="{ 'admin-onboard__vertical--active': form.verticalKey === v.key }"
                @click="selectVertical(v)"
              >
                <strong>{{ v.label }}</strong>
                <span class="small text-muted">{{ v.description }}</span>
              </button>
            </div>
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label="Company phone">
            <b-form-input v-model="form.phone" type="tel" placeholder="+2557…" />
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label="Location">
            <b-form-input v-model="form.location" placeholder="City / area" />
          </b-form-group>
        </b-col>
        <b-col cols="12">
          <b-form-group label="Owner (existing user)">
            <p class="small text-muted mb-2">
              Search by phone or name. Leave empty to assign ownership to you (you can transfer later).
            </p>
            <div class="d-flex flex-wrap gap-2 align-items-start">
              <b-form-input
                v-model="ownerSearch"
                placeholder="Search phone or name…"
                class="flex-grow-1"
                style="min-width: 200px; max-width: 320px;"
                @keyup.enter="searchOwner"
              />
              <b-button variant="outline-secondary" :disabled="ownerSearching" @click="searchOwner">
                {{ ownerSearching ? 'Searching…' : 'Find user' }}
              </b-button>
              <b-button v-if="form.ownerId" variant="outline-danger" size="sm" @click="clearOwner">Clear</b-button>
            </div>
            <p v-if="ownerHint" class="small mt-2 mb-0" :class="ownerFound ? 'text-success' : 'text-muted'">
              {{ ownerHint }}
            </p>
            <ul v-if="ownerResults.length" class="list-unstyled admin-onboard__owner-list mt-2 mb-0">
              <li v-for="u in ownerResults" :key="u.id">
                <button type="button" class="admin-onboard__owner-pick" @click="pickOwner(u)">
                  <strong>#{{ u.id }}</strong>
                  <span>{{ userDisplay(u) }}</span>
                  <span class="text-muted small">{{ u.phone_number }}</span>
                </button>
              </li>
            </ul>
          </b-form-group>
        </b-col>
      </b-row>

      <div class="d-flex flex-wrap gap-2 mt-4">
        <b-button variant="primary" :disabled="!canContinueCompany" @click="step = 2">Continue</b-button>
        <b-button variant="outline-secondary" :to="{ name: 'admin.crm.businesses' }">Cancel</b-button>
      </div>
    </section>

    <!-- Step 2: Modules -->
    <section v-show="step === 2" class="admin-onboard__panel">
      <h2 class="h5 mb-1">CRM modules</h2>
      <p class="text-muted small mb-3">Suggested for this industry — adjust before creating the company.</p>

      <div v-for="cat in moduleCategories" :key="cat" class="mb-3">
        <p class="small fw-semibold text-uppercase text-muted mb-2">{{ categoryLabel(cat) }}</p>
        <div class="admin-onboard__modules">
          <label v-for="mod in modulesByCategory(cat)" :key="mod.key" class="admin-onboard__module">
            <b-form-checkbox v-model="selectedModules[mod.key]" />
            <span>
              <strong>{{ mod.name }}</strong>
              <span class="d-block small text-muted">{{ mod.description }}</span>
            </span>
          </label>
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2 mt-4">
        <b-button variant="outline-secondary" @click="step = 1">Back</b-button>
        <b-button variant="primary" :disabled="creating" @click="createCompany">
          {{ creating ? 'Creating…' : 'Create company' }}
        </b-button>
      </div>
      <p v-if="createdBusinessId" class="text-success small mt-3 mb-0">
        Company #{{ createdBusinessId }} created. Continue to invitations.
      </p>
    </section>

    <!-- Step 3: Invitations -->
    <section v-show="step === 3" class="admin-onboard__panel">
      <h2 class="h5 mb-1">Team invitations</h2>
      <p class="text-muted small mb-3">
        Invite the owner and staff by WhatsApp number. We send SMS by default (works without Meta templates).
      </p>

      <b-alert v-if="!createdBusinessId" variant="warning" show>
        Create the company first (step 2).
      </b-alert>

      <template v-else>
        <div
          v-for="(row, idx) in inviteRows"
          :key="idx"
          class="admin-onboard__invite-row d-flex flex-wrap gap-2 align-items-end mb-2"
        >
          <b-form-group :label="idx === 0 ? 'Phone' : undefined" class="mb-0 flex-grow-1" style="min-width: 160px;">
            <b-form-input v-model="row.phone" type="tel" placeholder="+2557…" />
          </b-form-group>
          <b-form-group :label="idx === 0 ? 'Role' : undefined" class="mb-0" style="min-width: 140px;">
            <b-form-select v-model="row.role" :options="inviteRoleOptions" />
          </b-form-group>
          <b-button
            v-if="inviteRows.length > 1"
            variant="outline-danger"
            size="sm"
            class="mb-1"
            @click="inviteRows.splice(idx, 1)"
          >
            Remove
          </b-button>
        </div>
        <b-button variant="link" class="px-0 mb-3" @click="addInviteRow">+ Add another invite</b-button>

        <b-alert v-if="inviteBatchError" variant="danger" show>{{ inviteBatchError }}</b-alert>
        <b-alert v-if="inviteResults.length" variant="success" show>
          <p class="mb-2 fw-semibold">Invites sent</p>
          <ul class="mb-0 ps-3">
            <li v-for="(r, i) in inviteResults" :key="i" class="mb-1">
              {{ r.phone }} ({{ crmRoleLabel(r.role) }})
              <template v-if="r.join_url">
                — <a :href="r.join_url" target="_blank" rel="noopener">join link</a>
                <b-button size="sm" variant="outline-success" class="ms-1 py-0" @click="copyText(r.join_url)">Copy</b-button>
              </template>
            </li>
          </ul>
        </b-alert>

        <div class="d-flex flex-wrap gap-2 mt-3">
          <b-button variant="outline-secondary" @click="step = 2">Back</b-button>
          <b-button variant="primary" :disabled="inviting || !hasValidInvites" @click="sendInvites">
            {{ inviting ? 'Sending…' : 'Send invitations' }}
          </b-button>
          <b-button
            variant="outline-primary"
            :to="{ name: 'admin.crm.businesses.detail', params: { id: String(createdBusinessId) } }"
          >
            Open company
          </b-button>
          <b-button variant="outline-secondary" :to="{ name: 'admin.crm.businesses' }">Done</b-button>
        </div>
      </template>
    </section>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { crmApi, usersAdminApi } from '@/api'
import {
  getSellerOnboardingOptions,
  type CrmModuleInfo,
  type OnboardingVertical,
} from '@/api/onboarding'
import { CRM_ROLE_OPTIONS, KKOO_CRM_ROLES, crmRoleLabel } from '@/config/crmRoles'
import { formatApiError } from '@/utils/formatApiError'
import { isLikelyE164, normalizeInvitePhone } from '@/utils/phone'

type OwnerHit = {
  id: number
  phone_number?: string
  first_name?: string
  last_name?: string
  email?: string
}

const step = ref(1)
const stepMeta = [
  { n: 1, label: 'Company' },
  { n: 2, label: 'Modules' },
  { n: 3, label: 'Invitations' },
]

const pageError = ref('')
const optionsLoading = ref(true)
const verticals = ref<OnboardingVertical[]>([])
const modules = ref<CrmModuleInfo[]>([])
const selectedModules = reactive<Record<string, boolean>>({})

const form = reactive({
  name: '',
  currency: 'TZS',
  phone: '',
  location: '',
  verticalKey: '',
  businessType: '',
  ownerId: null as number | null,
})

const fieldErrors = ref<Record<string, string>>({})
const ownerSearch = ref('')
const ownerSearching = ref(false)
const ownerResults = ref<OwnerHit[]>([])
const ownerHint = ref('')
const ownerFound = ref(false)

const creating = ref(false)
const createdBusinessId = ref<number | null>(null)

const inviteRows = ref([{ phone: '', role: KKOO_CRM_ROLES.STEWARD }])
const inviting = ref(false)
const inviteBatchError = ref('')
const inviteResults = ref<{ phone: string; role: string; join_url?: string }[]>([])

const inviteRoleOptions = CRM_ROLE_OPTIONS.map((r) => ({ value: r.value, text: r.text }))

const canContinueCompany = computed(() => form.name.trim().length > 1 && !!form.businessType)

const moduleCategories = computed(() => {
  const cats = new Set(modules.value.map((m) => m.category))
  return Array.from(cats)
})

const hasValidInvites = computed(() =>
  inviteRows.value.some((r) => isLikelyE164(normalizeInvitePhone(r.phone))),
)

function fieldState(key: string): boolean | null {
  return fieldErrors.value[key] ? false : null
}

function modulesByCategory(cat: string) {
  return modules.value.filter((m) => m.category === cat)
}

function categoryLabel(cat: string) {
  return cat.replace(/_/g, ' ')
}

function userDisplay(u: OwnerHit) {
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ')
  return name || u.email || 'User'
}

function selectVertical(v: OnboardingVertical) {
  form.verticalKey = v.key
  form.businessType = v.business_type || v.key
  Object.keys(selectedModules).forEach((k) => {
    selectedModules[k] = false
  })
  for (const key of v.suggested_module_keys ?? []) {
    selectedModules[key] = true
  }
}

function goStep(n: number) {
  if (n === 3 && !createdBusinessId.value) return
  if (n < step.value || n === step.value || createdBusinessId.value) step.value = n
}

function clearOwner() {
  form.ownerId = null
  ownerHint.value = ''
  ownerFound.value = false
  ownerResults.value = []
}

function pickOwner(u: OwnerHit) {
  form.ownerId = u.id
  ownerHint.value = `Owner set to #${u.id} — ${userDisplay(u)} (${u.phone_number || 'no phone'})`
  ownerFound.value = true
  ownerResults.value = []
}

async function searchOwner() {
  const q = ownerSearch.value.trim()
  if (!q) return
  ownerSearching.value = true
  ownerHint.value = ''
  ownerFound.value = false
  ownerResults.value = []
  try {
    const { data } = await usersAdminApi.list({ search: q, page: 1, page_size: 8 })
    const raw = data as { results?: OwnerHit[] } | OwnerHit[]
    const list = Array.isArray(raw) ? raw : raw.results ?? []
    ownerResults.value = list
    if (!list.length) ownerHint.value = 'No users matched. Create the company under your account, then invite this phone.'
  } catch (e) {
    ownerHint.value = formatApiError(e) || 'Search failed'
  } finally {
    ownerSearching.value = false
  }
}

function addInviteRow() {
  inviteRows.value.push({ phone: '', role: KKOO_CRM_ROLES.RUNNER })
}

async function loadOptions() {
  optionsLoading.value = true
  pageError.value = ''
  try {
    const data = await getSellerOnboardingOptions()
    verticals.value = data.verticals ?? []
    modules.value = data.modules ?? []
    for (const m of modules.value) {
      selectedModules[m.key] = false
    }
  } catch (e) {
    pageError.value = formatApiError(e) || 'Could not load business types'
  } finally {
    optionsLoading.value = false
  }
}

async function createCompany() {
  if (!canContinueCompany.value) return
  creating.value = true
  pageError.value = ''
  fieldErrors.value = {}
  try {
    const modulesPayload: Record<string, boolean> = {}
    for (const [k, on] of Object.entries(selectedModules)) {
      if (on) modulesPayload[k] = true
    }
    const phone = normalizeInvitePhone(form.phone)
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      business_type: form.businessType,
      currency: form.currency.trim() || 'TZS',
      location: form.location.trim() || undefined,
      phone: phone || undefined,
      selected_modules: modulesPayload,
    }
    if (form.ownerId != null) payload.owner_id = form.ownerId

    const { data } = await crmApi.createBusiness(payload)
    const id = Number((data as { id?: number })?.id)
    if (!id) throw new Error('Business created but no id returned')
    createdBusinessId.value = id
    // Prefill first invite with company phone or owner search
    if (phone && !inviteRows.value[0]?.phone) {
      inviteRows.value[0].phone = phone
      inviteRows.value[0].role = KKOO_CRM_ROLES.STEWARD
    }
    step.value = 3
  } catch (e) {
    pageError.value = formatApiError(e) || 'Failed to create company'
  } finally {
    creating.value = false
  }
}

async function sendInvites() {
  if (!createdBusinessId.value || !hasValidInvites.value) return
  inviting.value = true
  inviteBatchError.value = ''
  inviteResults.value = []
  const failures: string[] = []
  for (const row of inviteRows.value) {
    const phone = normalizeInvitePhone(row.phone)
    if (!phone) continue
    if (!isLikelyE164(phone)) {
      failures.push(`${row.phone}: invalid phone`)
      continue
    }
    try {
      const { data } = await crmApi.createBusinessInvitation(createdBusinessId.value, {
        phone_number: phone,
        role: row.role,
        channel: 'sms',
      })
      inviteResults.value.push({
        phone,
        role: row.role,
        join_url: data?.join_url,
      })
    } catch (e) {
      failures.push(`${phone}: ${formatApiError(e) || 'failed'}`)
    }
  }
  if (failures.length) inviteBatchError.value = failures.join(' · ')
  inviting.value = false
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  void loadOptions()
})
</script>

<style scoped>
.admin-onboard__eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--kkoo-primary, #5c308f);
}

.admin-onboard__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--bs-headings-color);
  line-height: 1.2;
}

.admin-onboard__lead {
  max-width: 36rem;
}

.admin-onboard__steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.admin-onboard__step {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(92, 48, 143, 0.15);
  background: rgba(92, 48, 143, 0.04);
  border-radius: 999px;
  padding: 0.4rem 0.85rem;
  color: inherit;
}

.admin-onboard__step--active {
  border-color: var(--kkoo-primary, #5c308f);
  background: rgba(92, 48, 143, 0.12);
  font-weight: 600;
}

.admin-onboard__step--done {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.08);
}

.admin-onboard__step-num {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--kkoo-primary, #5c308f);
  color: #fff;
}

.admin-onboard__panel {
  background: linear-gradient(180deg, rgba(248, 242, 236, 0.65), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(92, 48, 143, 0.1);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem 1.5rem;
}

.admin-onboard__verticals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.admin-onboard__vertical {
  text-align: left;
  border: 1px solid rgba(92, 48, 143, 0.14);
  background: #fff;
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.admin-onboard__vertical--active {
  border-color: var(--kkoo-primary, #5c308f);
  box-shadow: 0 0 0 2px rgba(92, 48, 143, 0.2);
}

.admin-onboard__modules {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.5rem;
}

.admin-onboard__module {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  border: 1px solid rgba(92, 48, 143, 0.1);
  border-radius: 0.65rem;
  padding: 0.65rem 0.75rem;
  background: #fff;
  margin: 0;
}

.admin-onboard__owner-list {
  border: 1px solid rgba(92, 48, 143, 0.12);
  border-radius: 0.65rem;
  overflow: hidden;
  max-width: 480px;
}

.admin-onboard__owner-pick {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  text-align: left;
  border: 0;
  border-bottom: 1px solid rgba(92, 48, 143, 0.08);
  background: #fff;
  padding: 0.65rem 0.85rem;
}

.admin-onboard__owner-pick:last-child {
  border-bottom: 0;
}

.admin-onboard__owner-pick:hover {
  background: rgba(92, 48, 143, 0.06);
}
</style>
