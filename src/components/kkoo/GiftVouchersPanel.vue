<template>
  <div class="gift-vouchers-panel">
    <!-- Hero -->
    <header v-if="showTitle" class="gv-hero mb-4">
      <div class="gv-hero__glow" aria-hidden="true" />
      <div class="gv-hero__content">
        <div class="gv-hero__text">
          <h4 class="gv-hero__title mb-1">{{ title }}</h4>
          <p class="gv-hero__subtitle mb-0">{{ subtitle }}</p>
        </div>
      </div>
      <div class="gv-hero__stats">
        <div class="gv-stat">
          <span class="gv-stat__value">{{ stats.total }}</span>
          <span class="gv-stat__label">Vouchers</span>
        </div>
        <div class="gv-stat">
          <span class="gv-stat__value">{{ stats.active }}</span>
          <span class="gv-stat__label">Active</span>
        </div>
        <div class="gv-stat gv-stat--highlight">
          <span class="gv-stat__value">{{ formatMoney(stats.totalValue, stats.currency) }}</span>
          <span class="gv-stat__label">Active value</span>
        </div>
      </div>
    </header>

    <!-- Create -->
    <section class="gv-create mb-4">
      <div class="gv-create__header">
        <div>
          <h5 class="mb-0">{{ createCardTitle }}</h5>
          <p class="text-muted small mb-0">{{ createHelp }}</p>
        </div>
      </div>

      <div class="gv-quick-amounts mb-3">
        <span class="gv-quick-label">Quick amounts</span>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="preset in amountPresets"
            :key="preset"
            type="button"
            class="gv-preset-chip"
            :class="{ 'gv-preset-chip--active': voucherForm.amount === preset }"
            @click="voucherForm.amount = preset"
          >
            {{ formatMoney(preset, voucherForm.currency_code) }}
          </button>
        </div>
      </div>

      <b-form @submit.prevent="createVoucher" class="gv-form">
        <b-row class="g-3 gy-3">
          <b-col cols="12" sm="6" md="3" class="mb-3 mb-md-0">
            <b-form-group :label="labels.amount" label-for="gv-amount">
              <b-form-input
                id="gv-amount"
                v-model.number="voucherForm.amount"
                type="number"
                min="1"
                step="0.01"
                required
                class="gv-input"
              />
            </b-form-group>
          </b-col>
          <b-col cols="6" sm="3" md="2" class="mb-3 mb-md-0">
            <b-form-group :label="labels.currency" label-for="gv-currency">
              <b-form-input id="gv-currency" v-model="voucherForm.currency_code" placeholder="TZS" class="gv-input" />
            </b-form-group>
          </b-col>
          <b-col cols="6" sm="3" md="2" class="mb-3 mb-md-0">
            <b-form-group :label="labels.expiresDays" label-for="gv-expires">
              <b-form-input
                id="gv-expires"
                v-model.number="voucherForm.expires_in_days"
                type="number"
                min="1"
                placeholder="365"
                class="gv-input"
              />
            </b-form-group>
          </b-col>
          <b-col cols="12" md="5" class="mb-3 mb-md-0">
            <b-form-group :label="labels.recipientEmail" label-for="gv-email">
              <b-form-input
                id="gv-email"
                v-model="voucherForm.recipient_email"
                type="email"
                placeholder="optional@example.com"
                class="gv-input"
              />
            </b-form-group>
          </b-col>
          <b-col cols="12">
            <b-form-group :label="labels.message" label-for="gv-msg">
              <b-form-textarea
                id="gv-msg"
                v-model="voucherForm.message"
                rows="2"
                maxlength="500"
                :placeholder="labels.messagePlaceholder"
                class="gv-input"
              />
            </b-form-group>
          </b-col>
        </b-row>
        <div class="mt-3 d-flex flex-wrap align-items-center gap-2">
          <b-button type="submit" variant="primary" class="gv-submit-btn" :disabled="voucherLoading">
            {{ voucherLoading ? 'Creating…' : labels.createCta }}
          </b-button>
        </div>
      </b-form>

      <b-alert v-if="voucherResult" variant="success" show dismissible class="mt-3 gv-success-alert" @dismissed="voucherResult = ''">
        <template v-if="voucherCreated?.code">
          <strong class="d-block mb-2">{{ labels.created }}</strong>
          <div class="gv-created-code">{{ voucherCreated.code }}</div>
          <span v-if="shareLinkCreated" class="small">
            <a :href="shareLinkCreated" target="_blank" rel="noopener">{{ labels.openShare }}</a>
          </span>
          <div class="mt-2 d-flex flex-wrap gap-2">
            <b-button size="sm" variant="outline-success" @click="copyText(voucherCreated.code ?? '', 'code')">
              {{ copiedKind === 'code' ? 'Copied!' : labels.copyCode }}
            </b-button>
            <b-button size="sm" variant="outline-success" @click="copyText(voucherCreated.share_text || shareLinkCreated || '', 'text')">
              {{ copiedKind === 'text' ? 'Copied!' : labels.copyShare }}
            </b-button>
          </div>
        </template>
        <template v-else>{{ voucherResult }}</template>
      </b-alert>
      <b-alert v-if="voucherError" variant="danger" show dismissible class="mt-2" @dismissed="voucherError = ''">{{ voucherError }}</b-alert>
    </section>

    <!-- List -->
    <section class="gv-list">
      <div class="gv-list__toolbar">
        <h5 class="mb-0">{{ listTitle }}</h5>
        <div class="gv-filter-pills" role="tablist">
          <button
            v-for="tab in filterTabs"
            :key="tab.id"
            type="button"
            class="gv-filter-pill"
            :class="{ 'gv-filter-pill--active': filterType === tab.id }"
            @click="setFilter(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <p v-if="listError" class="text-danger small mt-2">{{ listError }}</p>

      <div v-if="listLoading" class="gv-skeleton-grid">
        <div v-for="i in 3" :key="i" class="gv-skeleton-card" />
      </div>

      <div v-else-if="!vouchers.length" class="gv-empty">
        <Icon icon="solar:gift-broken" class="gv-empty__icon" />
        <p class="mb-0">{{ labels.empty }}</p>
        <p class="small text-muted mb-0">Create your first voucher above — share the code at checkout.</p>
      </div>

      <div v-else class="gv-card-grid">
        <article
          v-for="v in vouchers"
          :key="v.id ?? v.code"
          class="gv-gift-card"
          :class="`gv-gift-card--${statusClass(v.status)}`"
        >
          <div class="gv-gift-card__shine" aria-hidden="true" />
          <div class="gv-gift-card__pattern" aria-hidden="true" />
          <div class="gv-gift-card__top">
            <span class="gv-gift-card__brand">KKOOAPP</span>
            <span class="gv-gift-card__badge" :class="`gv-gift-card__badge--${statusClass(v.status)}`">
              {{ v.status || '—' }}
            </span>
          </div>
          <p class="gv-gift-card__amount">{{ formatMoney(v.amount, v.currency_code) }}</p>
          <p class="gv-gift-card__role">{{ roleLabel(v) }}</p>
          <div class="gv-gift-card__code-wrap">
            <code class="gv-gift-card__code">{{ v.code }}</code>
          </div>
          <p class="gv-gift-card__meta">
            {{ labels.expires }} {{ formatDate(v.expires_at) }}
          </p>
          <p v-if="v.recipient_email" class="gv-gift-card__meta gv-gift-card__meta--email">
            {{ v.recipient_email }}
          </p>
          <div class="gv-gift-card__actions">
            <button type="button" class="gv-action-btn" @click="copyText(v.code ?? '', `code-${v.id}`)">
              {{ copiedKind === `code-${v.id}` ? 'Copied' : labels.copyCode }}
            </button>
            <button type="button" class="gv-action-btn" @click="copyText(shareUrl(v.code), `link-${v.id}`)">
              {{ copiedKind === `link-${v.id}` ? 'Copied' : labels.copyLink }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { rewardsUserApi, type GiftVoucherRow, type GiftVoucherCreateResponse } from '@/api/rewards'
import { userApi } from '@/api/user'
import { giftVoucherShareUrl } from '@/utils/giftVoucherShare'
import { formatApiError } from '@/utils/formatApiError'

const props = withDefaults(
  defineProps<{
    showTitle?: boolean
    title?: string
    subtitle?: string
    createCardTitle?: string
    createHelp?: string
    listTitle?: string
    labels?: Record<string, string>
  }>(),
  {
    showTitle: true,
    title: 'Gift vouchers',
    subtitle: 'Buy a voucher, send it to someone, or redeem at checkout with gift_voucher_code.',
    createCardTitle: 'Create voucher',
    createHelp: 'Creates a voucher billed to your account. You can share the code or link with the recipient.',
    listTitle: 'Your vouchers',
    labels: () => ({}),
  }
)

const defaultLabels: Record<string, string> = {
  amount: 'Amount',
  currency: 'Currency',
  expiresDays: 'Expires in (days)',
  recipientEmail: 'Recipient email',
  message: 'Message (optional)',
  messagePlaceholder: 'Happy birthday!',
  createCta: 'Create voucher',
  created: 'Voucher created.',
  openShare: 'Open share link',
  copyCode: 'Copy code',
  copyShare: 'Copy share text',
  copyLink: 'Copy link',
  tabAll: 'All',
  tabIssued: 'Issued',
  tabReceived: 'Received',
  loading: 'Loading…',
  empty: 'No vouchers in this view yet.',
  expires: 'Expires',
  to: 'To',
  youIssued: 'You issued',
  youReceived: 'You received',
}

const L = computed(() => ({ ...defaultLabels, ...props.labels }))

const amountPresets = [5000, 10000, 25000, 50000]

const voucherForm = ref({
  amount: 10000,
  currency_code: 'TZS',
  expires_in_days: 365,
  recipient_email: '',
  message: '',
})
const voucherLoading = ref(false)
const voucherResult = ref('')
const voucherError = ref('')
const voucherCreated = ref<GiftVoucherCreateResponse | null>(null)
const copiedKind = ref('')

const shareLinkCreated = computed(() => {
  const c = voucherCreated.value?.code
  if (!c) return ''
  return voucherCreated.value?.share_url || giftVoucherShareUrl(c)
})

const filterType = ref<'all' | 'issued' | 'received'>('all')
const vouchers = ref<GiftVoucherRow[]>([])
const listLoading = ref(false)
const listError = ref('')
const myUserId = ref<number | null>(null)

const filterTabs = computed(() => [
  { id: 'all' as const, label: L.value.tabAll },
  { id: 'issued' as const, label: L.value.tabIssued },
  { id: 'received' as const, label: L.value.tabReceived },
])

const stats = computed(() => {
  const list = vouchers.value
  const active = list.filter((v) => String(v.status || '').toLowerCase() === 'active')
  const totalValue = active.reduce((sum, v) => sum + (Number(v.amount) || 0), 0)
  const currency =
    active[0]?.currency_code || list[0]?.currency_code || voucherForm.value.currency_code || 'TZS'
  return { total: list.length, active: active.length, totalValue, currency }
})

function formatMoney(amount: unknown, currency?: string): string {
  const n = Number(amount)
  if (Number.isNaN(n)) return '—'
  const cur = currency || 'TZS'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
  } catch {
    return `${n.toLocaleString()} ${cur}`
  }
}

function formatDate(iso: unknown): string {
  if (!iso) return '—'
  const d = new Date(String(iso))
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function statusClass(status: unknown): string {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return 'active'
  if (s === 'redeemed') return 'redeemed'
  if (s === 'expired') return 'expired'
  return 'other'
}

function shareUrl(code: string | undefined): string {
  if (!code) return ''
  return giftVoucherShareUrl(code)
}

function roleLabel(v: GiftVoucherRow): string {
  const me = myUserId.value
  const issued = v.issued_by_user_id
  const rec = v.recipient_user_id
  if (me != null) {
    const iAmIssuer = issued === me
    const iAmRecipient = rec != null && rec === me
    if (iAmIssuer && iAmRecipient) return `${L.value.youIssued} · ${L.value.youReceived}`
    if (iAmIssuer) return L.value.youIssued
    if (iAmRecipient) return L.value.youReceived
  }
  if (filterType.value === 'issued') return L.value.youIssued
  if (filterType.value === 'received') return L.value.youReceived
  return L.value.youIssued
}

async function loadList() {
  listLoading.value = true
  listError.value = ''
  try {
    const { data } = await rewardsUserApi.getGiftVouchers({ type: filterType.value })
    const raw = data?.results
    vouchers.value = Array.isArray(raw) ? raw : []
  } catch (e: unknown) {
    listError.value = formatApiError(e, 'Failed to load vouchers')
    vouchers.value = []
  } finally {
    listLoading.value = false
  }
}

function setFilter(t: 'all' | 'issued' | 'received') {
  filterType.value = t
  loadList()
}

async function createVoucher() {
  voucherLoading.value = true
  voucherResult.value = ''
  voucherError.value = ''
  voucherCreated.value = null
  try {
    const { data } = await rewardsUserApi.createGiftVoucher({
      amount: voucherForm.value.amount,
      currency_code: voucherForm.value.currency_code || 'TZS',
      expires_in_days: voucherForm.value.expires_in_days || undefined,
      recipient_email: voucherForm.value.recipient_email?.trim() || undefined,
      message: voucherForm.value.message?.trim() || undefined,
    })
    voucherCreated.value = data ?? null
    voucherResult.value = data?.code ? 'ok' : ''
    await loadList()
  } catch (e: unknown) {
    voucherError.value = formatApiError(e, 'Failed to create voucher')
  } finally {
    voucherLoading.value = false
  }
}

async function copyText(text: string, kind: string) {
  if (!text?.trim()) return
  try {
    await navigator.clipboard.writeText(text)
    copiedKind.value = kind
    setTimeout(() => {
      if (copiedKind.value === kind) copiedKind.value = ''
    }, 2000)
  } catch {
    // ignore
  }
}

onMounted(async () => {
  try {
    const { data } = await userApi.getMe()
    const id = (data as { id?: number })?.id
    myUserId.value = typeof id === 'number' ? id : null
  } catch {
    myUserId.value = null
  }
  loadList()
})
</script>

<style scoped>
.gift-vouchers-panel {
  --gv-purple: #5c308f;
  --gv-purple-dark: #3b1a5a;
  --gv-gold: #f7a829;
  --gv-gold-light: #ffd180;
  --gv-surface: #f8f2ec;
}

/* Hero */
.gv-hero {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 1.5rem 1.25rem;
  background: linear-gradient(135deg, var(--gv-purple-dark) 0%, var(--gv-purple) 55%, #7b46b3 100%);
  color: #fff;
}

.gv-hero__glow {
  position: absolute;
  top: -40%;
  right: -10%;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(247, 168, 41, 0.35) 0%, transparent 70%);
  pointer-events: none;
}

.gv-hero__content {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.gv-hero__icon-wrap {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.gv-hero__icon {
  font-size: 1.75rem;
  color: var(--gv-gold-light);
}

.gv-hero__title {
  font-weight: 700;
  font-size: 1.35rem;
  color: #fff;
}

.gv-hero__subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.45;
}

.gv-hero__stats {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.gv-stat {
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  text-align: center;
}

.gv-stat--highlight {
  background: linear-gradient(135deg, rgba(247, 168, 41, 0.25), rgba(247, 168, 41, 0.08));
  border-color: rgba(247, 168, 41, 0.35);
}

.gv-stat__value {
  display: block;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.2;
}

.gv-stat__label {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.8;
  margin-top: 0.15rem;
}

/* Create section */
.gv-create {
  padding: 1.25rem;
  border-radius: 16px;
  background: var(--bs-body-bg, #fff);
  border: 1px solid rgba(92, 48, 143, 0.1);
  box-shadow: 0 4px 24px rgba(92, 48, 143, 0.06);
}

.gv-create__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.gv-create__header-icon {
  font-size: 1.5rem;
  color: var(--gv-purple);
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.gv-quick-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bs-secondary-color);
  margin-bottom: 0.5rem;
}

.gv-preset-chip {
  border: 1px solid rgba(92, 48, 143, 0.2);
  background: rgba(92, 48, 143, 0.04);
  color: var(--gv-purple);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gv-preset-chip:hover {
  background: rgba(92, 48, 143, 0.1);
  border-color: var(--gv-purple);
}

.gv-preset-chip--active {
  background: var(--gv-purple);
  border-color: var(--gv-purple);
  color: #fff;
}

.gv-input {
  border-radius: 10px !important;
}

.gv-submit-btn {
  border-radius: 10px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
}

.gv-created-code {
  font-family: ui-monospace, monospace;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--gv-purple-dark);
  padding: 0.5rem 0.75rem;
  background: rgba(92, 48, 143, 0.08);
  border-radius: 8px;
  display: inline-block;
}

/* List toolbar */
.gv-list__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.gv-filter-pills {
  display: flex;
  gap: 0.35rem;
  padding: 0.25rem;
  background: rgba(92, 48, 143, 0.06);
  border-radius: 999px;
}

.gv-filter-pill {
  border: none;
  background: transparent;
  color: var(--gv-purple);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gv-filter-pill:hover {
  background: rgba(92, 48, 143, 0.1);
}

.gv-filter-pill--active {
  background: var(--gv-purple);
  color: #fff;
  box-shadow: 0 2px 8px rgba(92, 48, 143, 0.3);
}

/* Gift cards grid */
.gv-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.gv-gift-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 1.1rem 1.15rem 1rem;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  color: #fff;
  background: linear-gradient(145deg, var(--gv-purple-dark) 0%, var(--gv-purple) 50%, #6a3d9e 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 28px rgba(59, 26, 90, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gv-gift-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 16px 40px rgba(59, 26, 90, 0.45);
}

.gv-gift-card--redeemed {
  background: linear-gradient(145deg, #4a5568 0%, #718096 100%);
  opacity: 0.92;
}

.gv-gift-card--expired {
  background: linear-gradient(145deg, #744210 0%, #b7791f 100%);
}

.gv-gift-card__shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.08) 45%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 55%,
    transparent 60%
  );
  transform: rotate(-12deg);
  pointer-events: none;
  transition: transform 0.6s ease;
}

.gv-gift-card:hover .gv-gift-card__shine {
  transform: rotate(-12deg) translateX(20%);
}

.gv-gift-card__pattern {
  position: absolute;
  bottom: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid rgba(247, 168, 41, 0.2);
  pointer-events: none;
}

.gv-gift-card__top {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.gv-gift-card__brand {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  opacity: 0.85;
}

.gv-gift-card__badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}

.gv-gift-card__badge--active {
  background: rgba(16, 185, 129, 0.35);
}

.gv-gift-card__badge--redeemed {
  background: rgba(255, 255, 255, 0.15);
}

.gv-gift-card__badge--expired {
  background: rgba(0, 0, 0, 0.2);
}

.gv-gift-card__amount {
  position: relative;
  font-size: 1.65rem;
  font-weight: 800;
  margin: 0 0 0.25rem;
  line-height: 1.1;
  background: linear-gradient(180deg, #fff 0%, var(--gv-gold-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gv-gift-card__role {
  position: relative;
  font-size: 0.75rem;
  opacity: 0.75;
  margin: 0 0 0.75rem;
}

.gv-gift-card__code-wrap {
  position: relative;
  margin-top: auto;
  padding: 0.5rem 0.65rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.25);
  margin-bottom: 0.5rem;
}

.gv-gift-card__code {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fff;
  word-break: break-all;
}

.gv-gift-card__meta {
  position: relative;
  font-size: 0.7rem;
  opacity: 0.7;
  margin: 0 0 0.25rem;
  display: flex;
  align-items: center;
}

.gv-gift-card__meta--email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gv-gift-card__actions {
  position: relative;
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.gv-action-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.gv-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Empty & skeleton */
.gv-empty {
  text-align: center;
  padding: 3rem 1.5rem;
  border-radius: 16px;
  background: rgba(92, 48, 143, 0.04);
  border: 1px dashed rgba(92, 48, 143, 0.2);
}

.gv-empty__icon {
  font-size: 3rem;
  color: var(--gv-purple);
  opacity: 0.5;
  margin-bottom: 0.75rem;
}

.gv-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.gv-skeleton-card {
  height: 220px;
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(92, 48, 143, 0.06) 25%, rgba(92, 48, 143, 0.12) 50%, rgba(92, 48, 143, 0.06) 75%);
  background-size: 200% 100%;
  animation: gv-shimmer 1.2s infinite;
}

@keyframes gv-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 576px) {
  .gv-hero__stats {
    grid-template-columns: 1fr;
  }

  .gv-hero__title {
    font-size: 1.15rem;
  }

  .gv-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
