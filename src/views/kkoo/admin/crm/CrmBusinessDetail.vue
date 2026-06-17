<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'admin.crm.businesses' }">← Back to Businesses</b-button>
    <b-card v-if="business" title="Business detail">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-primary" size="sm" @click="showEditModal = true">Edit business</b-button>
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.crm.customers', query: { business_id: business.id } }">Customers</b-button>
      </div>
      <b-alert v-if="businessError" variant="danger" show>{{ businessError }}</b-alert>
      <b-row>
        <b-col md="6">
          <b-list-group flush>
            <b-list-group-item><strong>ID</strong> {{ business.id }}</b-list-group-item>
            <b-list-group-item><strong>Name</strong> {{ business.name || '—' }}</b-list-group-item>
            <b-list-group-item><strong>Owner ID</strong> {{ business.owner_id ?? '—' }}</b-list-group-item>
            <b-list-group-item><strong>Location</strong> {{ business.location || '—' }}</b-list-group-item>
            <b-list-group-item><strong>Phone</strong> {{ business.phone || '—' }}</b-list-group-item>
            <b-list-group-item><strong>Currency</strong> {{ business.currency || '—' }}</b-list-group-item>
          </b-list-group>
        </b-col>
        <b-col md="6">
          <b-list-group flush>
            <b-list-group-item><strong>Plan</strong> <b-badge variant="secondary">{{ business.plan ?? '—' }}</b-badge></b-list-group-item>
            <b-list-group-item><strong>Max users</strong> {{ business.max_users ?? '—' }}</b-list-group-item>
            <b-list-group-item><strong>Member count</strong> {{ business.member_count ?? 0 }}</b-list-group-item>
            <b-list-group-item v-if="business.subscription_status"><strong>Subscription</strong> {{ business.subscription_status }}</b-list-group-item>
            <b-list-group-item v-if="business.billing_cycle"><strong>Billing cycle</strong> {{ business.billing_cycle }}</b-list-group-item>
          </b-list-group>
        </b-col>
      </b-row>

      <hr class="my-4" />
      <h6 class="mb-2">Members</h6>
      <b-alert v-if="membersError" variant="danger" show>{{ membersError }}</b-alert>
      <b-alert v-if="addMemberError" variant="danger" show>{{ addMemberError }}</b-alert>
      <b-table v-if="members.length" :items="members" :fields="memberFields" striped size="sm" class="mb-3">
        <template #cell(role)="data">
          <b-form-select
            :value="data.item.role ?? 'member'"
            :options="memberRoleOptions"
            size="sm"
            class="w-auto"
            style="max-width: 110px;"
            :disabled="roleUpdateLoading === data.item.user_id"
            @change="(v: unknown) => updateMemberRole(data.item.user_id, String(v))"
          />
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-danger" :disabled="removeLoading === data.item.user_id" @click="removeMember(data.item.user_id)">Remove</b-button>
        </template>
      </b-table>
      <p v-else-if="membersLoading" class="text-muted small">Loading members…</p>
      <p v-else class="text-muted small">No members yet.</p>
      <div class="d-flex flex-wrap align-items-end gap-2 mt-2">
        <b-form-group label="Add member" class="mb-0">
          <b-input-group>
            <b-form-input v-model.number="addUserId" type="number" placeholder="User ID" style="max-width: 100px;" />
            <b-form-select v-model="addMemberRole" :options="memberRoleOptions" style="max-width: 120px;" />
            <b-button variant="primary" size="sm" :disabled="addMemberSaving || !addUserId" @click="addMember">Add</b-button>
          </b-input-group>
        </b-form-group>
      </div>

      <hr class="my-4" />
      <h6 class="mb-2">Transfer ownership</h6>
      <p class="text-muted small mb-2">Only the current owner or platform admin can transfer ownership. Enter the new owner's user ID.</p>
      <b-alert v-if="transferError" variant="danger" show>{{ transferError }}</b-alert>
      <div class="d-flex flex-wrap align-items-end gap-2">
        <b-form-group label="New owner user ID" class="mb-0">
          <b-form-input v-model.number="transferNewOwnerId" type="number" placeholder="User ID" style="max-width: 120px;" />
        </b-form-group>
        <b-button variant="outline-warning" size="sm" :disabled="transferSaving || transferNewOwnerId == null" @click="transferOwnership">Transfer ownership</b-button>
      </div>

      <hr class="my-4" />
      <h6 class="mb-2">Invitations</h6>
      <p class="text-muted small mb-2">Business owner and company admin can invite by email. When you invite or revoke, the backend notifies company admin and all platform superusers.</p>
      <b-alert v-if="invitationsError" variant="danger" show>{{ invitationsError }}</b-alert>
      <b-alert v-if="inviteByEmailError" variant="danger" show>{{ inviteByEmailError }}</b-alert>
      <b-table v-if="invitations.length" :items="invitations" :fields="invitationFields" striped size="sm" class="mb-3">
        <template #cell(role)="data">{{ data.item.role ?? '—' }}</template>
        <template #cell(created_at)="data">{{ formatInvitationDate(data.item.created_at) }}</template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-danger" :disabled="revokeInvitationLoading === data.item.id" @click="revokeInvitation(data.item.id)">Revoke</b-button>
        </template>
      </b-table>
      <p v-else-if="invitationsLoading" class="text-muted small">Loading invitations…</p>
      <p v-else class="text-muted small">No pending invitations.</p>
      <div class="d-flex flex-wrap align-items-end gap-2 mt-2">
        <b-form-group label="Invite by email" class="mb-0">
          <b-input-group>
            <b-form-input v-model="inviteEmail" type="email" placeholder="email@example.com" class="me-1" style="min-width: 180px;" />
            <b-form-select v-model="inviteRole" :options="inviteRoleOptions" style="max-width: 120px;" class="me-1" />
            <b-button variant="primary" size="sm" :disabled="inviteByEmailSaving || !inviteEmailTrimmed" @click="inviteByEmail">Invite</b-button>
          </b-input-group>
        </b-form-group>
      </div>
    </b-card>
    <b-card v-else-if="loading" title="Business detail"><p class="text-muted">Loading…</p></b-card>
    <EmptyState v-else title="Business not found" />

    <b-modal v-model="showEditModal" title="Edit business" @ok="onEditOk">
      <b-alert v-if="editErrors._form" variant="danger" show>{{ editErrors._form }}</b-alert>
      <b-form>
        <b-form-group label="Name" :invalid-feedback="editErrors.name">
          <b-form-input v-model="editForm.name" />
        </b-form-group>
        <b-form-group label="Plan" :invalid-feedback="editErrors.plan">
          <b-form-select v-model="editForm.plan" :options="planOptions" />
        </b-form-group>
        <b-form-group label="Subscription status">
          <b-form-input v-model="editForm.subscription_status" placeholder="e.g. active" />
        </b-form-group>
        <b-form-group label="Billing cycle">
          <b-form-input v-model="editForm.billing_cycle" placeholder="e.g. monthly" />
        </b-form-group>
        <b-form-group label="Location">
          <b-form-input v-model="editForm.location" />
        </b-form-group>
        <b-form-group label="Phone">
          <b-form-input v-model="editForm.phone" />
        </b-form-group>
        <b-form-group label="Currency">
          <b-form-input v-model="editForm.currency" />
        </b-form-group>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { crmApi } from '@/api'
import { getApiFieldErrors } from '@/types/crm'
import { CRM_ROLE_OPTIONS, crmRoleLabel, KKOO_CRM_ROLES } from '@/config/crmRoles'

const route = useRoute()
const id = computed<string | undefined>(() => { const p = route.params.id; return Array.isArray(p) ? p[0] : (p ?? undefined) })
const loading = ref(false)
const business = ref<Record<string, unknown> | null>(null)
const businessError = ref('')
const showEditModal = ref(false)
const editForm = ref({
  name: '',
  plan: '',
  subscription_status: '',
  billing_cycle: '',
  location: '',
  phone: '',
  currency: 'TZS',
})
const editErrors = ref<Record<string, string>>({})

const members = ref<{ user_id: number; user_name?: string; role?: string }[]>([])
const membersLoading = ref(false)
const membersError = ref('')
const addUserId = ref<number | null>(null)
const addMemberRole = ref(KKOO_CRM_ROLES.RUNNER)
const addMemberSaving = ref(false)
const addMemberError = ref('')
const removeLoading = ref<number | null>(null)
const roleUpdateLoading = ref<number | null>(null)
const transferNewOwnerId = ref<number | null>(null)
const transferSaving = ref(false)
const transferError = ref('')

const invitations = ref<{ id: number | string; email?: string; role?: string; created_at?: string }[]>([])
const invitationsLoading = ref(false)
const invitationsError = ref('')
const inviteEmail = ref('')
const inviteRole = ref(KKOO_CRM_ROLES.RUNNER)
const inviteByEmailSaving = ref(false)
const inviteByEmailError = ref('')
const revokeInvitationLoading = ref<number | string | null>(null)

const inviteEmailTrimmed = computed(() => inviteEmail.value?.trim() ?? '')

const planOptions = [
  { value: '', text: '—' },
  { value: 'free', text: 'Free' },
  { value: 'starter', text: 'Starter' },
  { value: 'growth', text: 'Growth' },
  { value: 'elite', text: 'Elite' },
]
const memberRoleOptions = CRM_ROLE_OPTIONS.map((r) => ({ value: r.value, text: r.text }))
const inviteRoleOptions = memberRoleOptions

const invitationFields = [
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'created_at', label: 'Invited' },
  { key: 'actions', label: 'Actions' },
]

const memberFields = [
  { key: 'user_id', label: 'User ID' },
  { key: 'user_name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'actions', label: 'Actions' },
]

async function loadBusiness() {
  if (!id.value) return
  loading.value = true
  businessError.value = ''
  try {
    const { data } = await crmApi.getBusiness(id.value)
    business.value = (data ?? {}) as Record<string, unknown>
    editForm.value = {
      name: String(business.value.name ?? ''),
      plan: String(business.value.plan ?? ''),
      subscription_status: String(business.value.subscription_status ?? ''),
      billing_cycle: String(business.value.billing_cycle ?? ''),
      location: String(business.value.location ?? ''),
      phone: String(business.value.phone ?? ''),
      currency: String(business.value.currency ?? 'TZS'),
    }
  } catch (e: unknown) {
    businessError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to load business'
    business.value = null
  } finally {
    loading.value = false
  }
}

async function loadMembers() {
  if (!id.value) return
  membersLoading.value = true
  membersError.value = ''
  try {
    const { data } = await crmApi.getBusinessMembers(id.value)
    const raw = data as { results?: { user_id: number; user_name?: string; role?: string }[] } | { user_id: number; user_name?: string; role?: string }[]
    members.value = Array.isArray(raw) ? raw : raw?.results ?? []
  } catch (e: unknown) {
    membersError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to load members'
    members.value = []
  } finally {
    membersLoading.value = false
  }
}

async function onEditOk(ev: Event) {
  ev.preventDefault()
  if (!id.value || !business.value) return
  editErrors.value = {}
  try {
    await crmApi.updateBusiness(id.value, {
      name: editForm.value.name?.trim() || undefined,
      plan: editForm.value.plan || undefined,
      subscription_status: editForm.value.subscription_status?.trim() || undefined,
      billing_cycle: editForm.value.billing_cycle?.trim() || undefined,
      location: editForm.value.location?.trim() || undefined,
      phone: editForm.value.phone?.trim() || undefined,
      currency: editForm.value.currency?.trim() || undefined,
    })
    showEditModal.value = false
    await loadBusiness()
  } catch (e: unknown) {
    editErrors.value = getApiFieldErrors(e)
    const err = e as { response?: { data?: { error?: string } } }
    if (Object.keys(editErrors.value).length === 0 && err.response?.data?.error) {
      editErrors.value = { _form: err.response.data.error }
    }
  }
}

async function addMember() {
  if (!id.value || addUserId.value == null) return
  addMemberSaving.value = true
  addMemberError.value = ''
  try {
    await crmApi.addBusinessMember(id.value, { user_id: addUserId.value, role: addMemberRole.value })
    addUserId.value = null
    await loadMembers()
    await loadBusiness()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string; error_code?: string } } }
    const code = err.response?.data?.error_code
    const msg = err.response?.data?.error ?? (e as { message?: string }).message
    addMemberError.value = code === 'plan_user_limit_reached' ? 'Plan user limit reached. Upgrade plan to add more members.' : (msg ?? 'Failed to add member')
  } finally {
    addMemberSaving.value = false
  }
}

async function updateMemberRole(userId: number, newRole: string) {
  if (!id.value) return
  roleUpdateLoading.value = userId
  membersError.value = ''
  try {
    await crmApi.updateBusinessMemberRole(id.value, userId, { role: newRole })
    await loadMembers()
  } catch (e: unknown) {
    membersError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to update role'
  } finally {
    roleUpdateLoading.value = null
  }
}

async function removeMember(userId: number) {
  if (!id.value) return
  removeLoading.value = userId
  try {
    await crmApi.removeBusinessMember(id.value, userId)
    await loadMembers()
    await loadBusiness()
  } catch (e: unknown) {
    membersError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to remove member'
  } finally {
    removeLoading.value = null
  }
}

async function transferOwnership() {
  if (!id.value || transferNewOwnerId.value == null) return
  transferSaving.value = true
  transferError.value = ''
  try {
    await crmApi.transferOwnership(id.value, { new_owner_user_id: transferNewOwnerId.value })
    transferNewOwnerId.value = null
    await loadBusiness()
    await loadMembers()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string; error_code?: string } } }
    transferError.value = err.response?.data?.error ?? (e as { message?: string }).message ?? 'Failed to transfer ownership'
  } finally {
    transferSaving.value = false
  }
}

function formatInvitationDate(createdAt: unknown): string {
  if (createdAt == null || createdAt === '') return '—'
  const d = typeof createdAt === 'string' ? new Date(createdAt) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'
}

async function loadInvitations() {
  if (!id.value) return
  invitationsLoading.value = true
  invitationsError.value = ''
  try {
    const { data } = await crmApi.getBusinessInvitations(id.value)
    const raw = data as { results?: { id: number | string; email?: string; role?: string; created_at?: string }[] } | { id: number | string; email?: string; role?: string; created_at?: string }[]
    invitations.value = Array.isArray(raw) ? raw : raw?.results ?? []
  } catch (e: unknown) {
    invitationsError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to load invitations'
    invitations.value = []
  } finally {
    invitationsLoading.value = false
  }
}

async function inviteByEmail() {
  if (!id.value || !inviteEmailTrimmed.value) return
  inviteByEmailSaving.value = true
  inviteByEmailError.value = ''
  try {
    await crmApi.createBusinessInvitation(id.value, { email: inviteEmailTrimmed.value, role: inviteRole.value })
    inviteEmail.value = ''
    await loadInvitations()
    await loadBusiness()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string; error_code?: string } } }
    const code = err.response?.data?.error_code
    inviteByEmailError.value = code === 'plan_user_limit_reached' ? 'Plan user limit reached. Upgrade plan to add more members.' : (err.response?.data?.error ?? (e as { message?: string }).message ?? 'Failed to send invitation')
  } finally {
    inviteByEmailSaving.value = false
  }
}

async function revokeInvitation(invitationId: number | string) {
  if (!id.value) return
  revokeInvitationLoading.value = invitationId
  try {
    await crmApi.revokeBusinessInvitation(id.value, invitationId)
    await loadInvitations()
  } catch (e: unknown) {
    invitationsError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to revoke invitation'
  } finally {
    revokeInvitationLoading.value = null
  }
}

onMounted(() => {
  loadBusiness()
  loadMembers()
  loadInvitations()
})
watch(id, () => {
  loadBusiness()
  loadMembers()
  loadInvitations()
})
</script>
