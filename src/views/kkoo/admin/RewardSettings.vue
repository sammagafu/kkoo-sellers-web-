<template>
  <VerticalLayout>
    <b-card title="Reward Settings">
      <p class="text-muted">Configure referral bonuses, purchase rewards, redemption rules, and point expiry.</p>
      <p v-if="loading && !data">Loading…</p>
      <p v-else-if="error" class="text-danger">{{ error }}</p>
      <b-alert v-if="saveSuccess" variant="success" dismissible show @dismissed="saveSuccess = false">Settings saved.</b-alert>
      <b-form v-else-if="data" @submit.prevent="save">
        <b-card title="General" class="mb-3">
          <b-form-group label="Rewards active" label-for="is_active">
            <b-form-checkbox id="is_active" v-model="form.is_active" switch>
              Enable rewards system (earning and redemption)
            </b-form-checkbox>
          </b-form-group>
        </b-card>

        <b-card title="Referral bonuses" class="mb-3">
          <b-row>
            <b-col md="6">
              <b-form-group label="Referrer bonus (points)" label-for="referrer_bonus" description="Points awarded to the referrer when referee makes first purchase.">
                <b-form-input id="referrer_bonus" v-model.number="form.referrer_bonus" type="number" min="0" step="1" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Referred bonus (points)" label-for="referred_bonus" description="Points awarded to the new user when they make first purchase.">
                <b-form-input id="referred_bonus" v-model.number="form.referred_bonus" type="number" min="0" step="1" />
              </b-form-group>
            </b-col>
          </b-row>
        </b-card>

        <b-card title="Purchase rewards" class="mb-3">
          <b-row>
            <b-col md="6">
              <b-form-group label="Base percent (%)" label-for="purchase_reward_base_percent" description="Base percentage of order value earned as points (e.g. 1 = 1%).">
                <b-form-input id="purchase_reward_base_percent" v-model.number="form.purchase_reward_base_percent" type="number" min="0" max="100" step="0.01" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Reward rate" label-for="purchase_reward_rate" description="Multiplier or rate for purchase points (if used by backend).">
                <b-form-input id="purchase_reward_rate" v-model.number="form.purchase_reward_rate" type="number" min="0" step="0.01" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Cap per order (points)" label-for="purchase_reward_cap_per_order" description="Maximum points earned per single order.">
                <b-form-input id="purchase_reward_cap_per_order" v-model.number="form.purchase_reward_cap_per_order" type="number" min="0" step="1" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Max percent at checkout (%)" label-for="max_purchase_reward_percent" description="Maximum percentage of order that can be paid with points (e.g. 50 = 50%).">
                <b-form-input id="max_purchase_reward_percent" v-model.number="form.max_purchase_reward_percent" type="number" min="0" max="100" step="1" />
              </b-form-group>
            </b-col>
          </b-row>
        </b-card>

        <b-card title="Redemption" class="mb-3">
          <b-row>
            <b-col md="6">
              <b-form-group label="Min redemption points" label-for="min_redemption_points" description="Minimum points required per redemption request and at checkout.">
                <b-form-input id="min_redemption_points" v-model.number="form.min_redemption_points" type="number" min="0" step="1" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Points to cash rate" label-for="points_to_cash_rate" description="1 point = this many currency units (e.g. 10 = 1 point = 10 TZS).">
                <b-form-input id="points_to_cash_rate" v-model.number="form.points_to_cash_rate" type="number" min="0" step="0.01" />
              </b-form-group>
            </b-col>
          </b-row>
        </b-card>

        <b-card title="Points expiry" class="mb-3">
          <b-form-group label="Points expire (days)" label-for="points_expire_days" description="Number of days after which earned points expire (0 = never).">
            <b-form-input id="points_expire_days" v-model.number="form.points_expire_days" type="number" min="0" step="1" />
          </b-form-group>
        </b-card>

        <b-card title="Cross-App Reward Rules" class="mb-3">
          <p class="text-muted">
            Set earn and redemption guardrails for rides, food, and hotels. These rules power
            “Earn anywhere. Redeem anywhere.”
          </p>
          <p v-if="rulesLoading" class="text-muted">Loading cross-app rules…</p>
          <b-alert v-else-if="rulesError" variant="danger" show>{{ rulesError }}</b-alert>
          <template v-else>
            <b-row>
              <b-col v-for="rule in rewardRules" :key="rule.vertical" lg="4" class="mb-3">
                <b-card :title="verticalLabel(rule.vertical)">
                  <b-form-group label="Earn rate (%)">
                    <b-form-input v-model.number="rule.earn_rate_percent" type="number" min="0" step="0.1" />
                  </b-form-group>
                  <b-form-group label="Earn cap (points)">
                    <b-form-input v-model.number="rule.earn_cap_points" type="number" min="0" step="1" />
                  </b-form-group>
                  <b-form-group label="Redeem cap (%)">
                    <b-form-input v-model.number="rule.redeem_cap_percent" type="number" min="0" max="100" step="1" />
                  </b-form-group>
                  <b-form-group label="Minimum basket amount">
                    <b-form-input v-model.number="rule.min_basket_amount" type="number" min="0" step="100" />
                  </b-form-group>
                  <div class="d-flex flex-column gap-2">
                    <b-form-checkbox v-model="rule.eligible_on_fees" switch>
                      Allow points on fees
                    </b-form-checkbox>
                    <b-form-checkbox v-model="rule.eligible_on_promos" switch>
                      Allow points with promotions
                    </b-form-checkbox>
                    <b-form-checkbox v-model="rule.is_active" switch>
                      Active
                    </b-form-checkbox>
                  </div>
                </b-card>
              </b-col>
            </b-row>
            <div class="d-flex gap-2">
              <b-button variant="primary" :disabled="rulesSaving" @click="saveRules">Save cross-app rules</b-button>
              <b-button variant="outline-secondary" @click="loadRules">Reload rules</b-button>
            </div>
          </template>
        </b-card>

        <div class="d-flex gap-2">
          <b-button type="submit" variant="primary" :disabled="saving">Save settings</b-button>
          <b-button variant="outline-secondary" @click="load">Reset</b-button>
        </div>

        <hr class="my-4" />
        <p class="text-muted small mb-1"><strong>Read-only:</strong> ID {{ data.id }} · Updated {{ formatDate(data.updated_at) }}{{ data.updated_by ? ` by ${data.updated_by}` : '' }}</p>
      </b-form>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, reactive, onMounted } from 'vue'
import { rewardsAdminApi, type RewardRuleRow, type RewardRulesPayload, type RewardSettingsPayload } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

interface RewardSettingsResponse extends RewardSettingsPayload {
  id?: number
  updated_at?: string
  updated_by?: string | number
}

const data = ref<RewardSettingsResponse | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const saveSuccess = ref(false)
const rulesLoading = ref(false)
const rulesSaving = ref(false)
const rulesError = ref('')
const rewardRules = ref<RewardRuleRow[]>([])

const form = reactive<Record<string, unknown>>({
  referrer_bonus: 0,
  referred_bonus: 0,
  purchase_reward_rate: 0,
  purchase_reward_base_percent: 0,
  purchase_reward_cap_per_order: 0,
  max_purchase_reward_percent: 50,
  min_redemption_points: 100,
  points_to_cash_rate: 10,
  points_expire_days: 0,
  is_active: true,
})

function assignForm(src: RewardSettingsResponse) {
  form.referrer_bonus = src.referrer_bonus ?? 0
  form.referred_bonus = src.referred_bonus ?? 0
  form.purchase_reward_rate = src.purchase_reward_rate ?? 0
  form.purchase_reward_base_percent = src.purchase_reward_base_percent ?? 0
  form.purchase_reward_cap_per_order = src.purchase_reward_cap_per_order ?? 0
  form.max_purchase_reward_percent = src.max_purchase_reward_percent ?? 50
  form.min_redemption_points = src.min_redemption_points ?? 100
  form.points_to_cash_rate = src.points_to_cash_rate ?? 10
  form.points_expire_days = src.points_expire_days ?? 0
  form.is_active = src.is_active ?? true
}

function formatDate(val: unknown): string {
  if (!val) return '—'
  const d = new Date(String(val))
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString()
}

function defaultRule(vertical: 'ride' | 'food' | 'hotel'): RewardRuleRow {
  return {
    vertical,
    earn_rate_percent: vertical === 'hotel' ? 0.8 : 1,
    earn_cap_points: vertical === 'hotel' ? 2500 : 2000,
    redeem_cap_percent: vertical === 'ride' ? 30 : vertical === 'food' ? 25 : 20,
    min_basket_amount: 0,
    eligible_on_fees: vertical === 'ride',
    eligible_on_promos: true,
    is_active: true,
  }
}

function verticalLabel(vertical: RewardRuleRow['vertical']): string {
  switch (vertical) {
    case 'ride':
      return 'Rides'
    case 'food':
      return 'Food'
    case 'hotel':
      return 'Hotels'
    default:
      return String(vertical || 'Rule')
  }
}

function assignRules(rows: RewardRuleRow[]) {
  const byVertical = new Map(rows.map((row) => [row.vertical, { ...row }]))
  rewardRules.value = (['ride', 'food', 'hotel'] as const).map((vertical) => {
    return { ...defaultRule(vertical), ...(byVertical.get(vertical) ?? {}) }
  })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data: res } = await rewardsAdminApi.getSettings()
    const payload = (res ?? {}) as RewardSettingsResponse
    data.value = payload
    assignForm(payload)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load settings')
    data.value = null
  } finally {
    loading.value = false
  }
}

async function loadRules() {
  rulesLoading.value = true
  rulesError.value = ''
  try {
    const { data: res } = await rewardsAdminApi.getRules()
    assignRules(Array.isArray(res?.results) ? res.results : [])
  } catch (e: unknown) {
    rulesError.value = formatApiError(e, 'Failed to load cross-app rules')
    assignRules([])
  } finally {
    rulesLoading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  saveSuccess.value = false
  try {
    const payload: RewardSettingsPayload = {
      referrer_bonus: Number(form.referrer_bonus) || 0,
      referred_bonus: Number(form.referred_bonus) || 0,
      purchase_reward_rate: Number(form.purchase_reward_rate) || 0,
      purchase_reward_base_percent: Number(form.purchase_reward_base_percent) ?? 0,
      purchase_reward_cap_per_order: Number(form.purchase_reward_cap_per_order) ?? 0,
      max_purchase_reward_percent: Number(form.max_purchase_reward_percent) ?? 50,
      min_redemption_points: Number(form.min_redemption_points) ?? 100,
      points_to_cash_rate: Number(form.points_to_cash_rate) ?? 10,
      points_expire_days: Number(form.points_expire_days) ?? 0,
      is_active: Boolean(form.is_active),
    }
    await rewardsAdminApi.updateSettings(payload)
    saveSuccess.value = true
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to save settings')
  } finally {
    saving.value = false
  }
}

async function saveRules() {
  rulesSaving.value = true
  rulesError.value = ''
  try {
    const payload: RewardRulesPayload = {
      rules: rewardRules.value.map((rule) => ({
        vertical: rule.vertical,
        earn_rate_percent: Number(rule.earn_rate_percent) || 0,
        earn_cap_points: Number(rule.earn_cap_points) || 0,
        redeem_cap_percent: Number(rule.redeem_cap_percent) || 0,
        min_basket_amount: Number(rule.min_basket_amount) || 0,
        eligible_on_fees: Boolean(rule.eligible_on_fees),
        eligible_on_promos: Boolean(rule.eligible_on_promos),
        is_active: Boolean(rule.is_active),
      })),
    }
    const { data: res } = await rewardsAdminApi.updateRules(payload)
    assignRules(Array.isArray(res?.results) ? res.results : [])
  } catch (e: unknown) {
    rulesError.value = formatApiError(e, 'Failed to save cross-app rules')
  } finally {
    rulesSaving.value = false
  }
}

onMounted(() => {
  load()
  loadRules()
})
</script>
