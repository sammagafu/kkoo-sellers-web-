<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'seller.crm.dashboard' }">← CRM Dashboard</b-button>

    <b-card v-if="business" title="Team">
      <b-alert v-if="forbiddenMessage" variant="warning" show>{{ forbiddenMessage }}</b-alert>
      <template v-else>
        <p class="text-muted small mb-3">
          <strong>{{ business.name || 'Company' }}</strong>
          · {{ business.member_count ?? 0 }}/{{ business.max_users ?? '—' }} members
          · plan {{ business.plan ?? '—' }}
          <span v-if="crmRoleDisplay" class="ms-1 badge bg-soft-primary text-primary">{{ crmRoleDisplay }}</span>
        </p>

        <b-tabs v-model="activeTab" content-class="pt-3">
          <b-tab title="Members" active>
            <b-alert v-if="membersError" variant="danger" show>{{ membersError }}</b-alert>
            <b-alert v-if="addMemberError" variant="danger" show>{{ addMemberError }}</b-alert>
            <b-table v-if="members.length" :items="members" :fields="memberFields" striped size="sm" class="mb-3">
              <template #cell(role)="data">
                <b-form-select
                  :value="data.item.role ?? KKOO_CRM_ROLES.RUNNER"
                  :options="memberRoleOptions"
                  size="sm"
                  class="w-auto"
                  style="max-width: 160px;"
                  :disabled="!canManageTeam || roleUpdateLoading === data.item.user_id || data.item.role === 'owner'"
                  @change="(v: unknown) => updateMemberRole(data.item.user_id, String(v))"
                />
              </template>
              <template #cell(actions)="data">
                <b-button
                  v-if="canManageTeam"
                  size="sm"
                  variant="outline-danger"
                  :disabled="removeLoading === data.item.user_id"
                  @click="removeMember(data.item.user_id)"
                >
                  Remove
                </b-button>
              </template>
            </b-table>
            <p v-else-if="membersLoading" class="text-muted small">Loading members…</p>
            <p v-else class="text-muted small">No members yet.</p>
            <div v-if="canManageTeam" class="d-flex flex-wrap align-items-end gap-2 mt-2">
              <b-form-group label="Add member" class="mb-0">
                <b-input-group>
                  <b-form-input v-model.number="addUserId" type="number" placeholder="User ID" style="max-width: 100px;" />
                  <b-form-select v-model="addMemberRole" :options="memberRoleOptions" style="max-width: 120px;" />
                  <b-button variant="primary" size="sm" :disabled="addMemberSaving || addUserId == null" @click="addMember">Add</b-button>
                </b-input-group>
              </b-form-group>
            </div>
            <p v-else class="text-muted small mb-0">Stewards only.</p>
          </b-tab>

          <b-tab title="Invitations">
            <b-alert v-if="invitationsError" variant="danger" show>{{ invitationsError }}</b-alert>
            <b-alert v-if="inviteByEmailError" variant="danger" show>{{ inviteByEmailError }}</b-alert>
            <b-table v-if="invitations.length" :items="invitations" :fields="invitationFields" striped size="sm" class="mb-3">
              <template #cell(role)="data">{{ crmRoleLabel(data.item.role) }}</template>
              <template #cell(created_at)="data">{{ formatInvitationDate(data.item.created_at) }}</template>
              <template #cell(actions)="data">
                <b-button
                  v-if="canManageTeam"
                  size="sm"
                  variant="outline-danger"
                  :disabled="revokeInvitationLoading === data.item.id"
                  @click="revokeInvitation(data.item.id)"
                >
                  Revoke
                </b-button>
              </template>
            </b-table>
            <p v-else-if="invitationsLoading" class="text-muted small">Loading invitations…</p>
            <p v-else class="text-muted small">No pending invitations.</p>
            <div v-if="canManageTeam" class="d-flex flex-wrap align-items-end gap-2 mt-2">
              <b-form-group label="Invite by email" class="mb-0">
                <b-input-group>
                  <b-form-input v-model="inviteEmail" type="email" placeholder="email@example.com" class="me-1" style="min-width: 180px;" />
                  <b-form-select v-model="inviteRole" :options="inviteRoleOptions" style="max-width: 120px;" class="me-1" />
                  <b-button variant="primary" size="sm" :disabled="inviteByEmailSaving || !inviteEmailTrimmed" @click="inviteByEmail">Invite</b-button>
                </b-input-group>
              </b-form-group>
            </div>
          </b-tab>

          <b-tab v-if="canManageTeam" title="Ownership">
            <p class="text-muted small mb-2">Transfer company ownership to another user by ID.</p>
            <b-alert v-if="transferError" variant="danger" show>{{ transferError }}</b-alert>
            <div class="d-flex flex-wrap align-items-end gap-2">
              <b-form-group label="New owner user ID" class="mb-0">
                <b-form-input v-model.number="transferNewOwnerId" type="number" placeholder="User ID" style="max-width: 120px;" />
              </b-form-group>
              <b-button variant="outline-warning" size="sm" :disabled="transferSaving || transferNewOwnerId == null" @click="transferOwnership">
                Transfer ownership
              </b-button>
            </div>
          </b-tab>
        </b-tabs>
      </template>
    </b-card>

    <b-card v-else-if="workspaceLoading" title="Team"><p class="text-muted">Loading…</p></b-card>
    <EmptyState v-else title="No company" message="Switch company from the top bar, or ask an admin to invite you." />
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { crmApi } from '@/api'
import { CRM_ROLE_OPTIONS, crmRoleLabel, KKOO_CRM_ROLES } from '@/config/crmRoles'
import { useCrmWorkspace } from '@/composables/useCrmWorkspace'

const {
  activeBusiness,
  activeBusinessId,
  crmRoleDisplay,
  canManageCrmTeam,
  loadWorkspace,
  loading: workspaceLoading,
} = useCrmWorkspace()

const canManageTeam = computed(() => canManageCrmTeam())
const business = computed(() => activeBusiness.value as Record<string, unknown> | null)
const activeTab = ref(0)
const forbiddenMessage = ref('')

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

const businessId = computed(() => activeBusinessId.value ?? undefined)

const memberRoleOptions = CRM_ROLE_OPTIONS.map((r) => ({ value: r.value, text: r.text }))
const inviteRoleOptions = memberRoleOptions
const memberFields = [
  { key: 'user_id', label: 'User ID' },
  { key: 'user_name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'actions', label: 'Actions' },
]
const invitationFields = [
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'created_at', label: 'Invited' },
  { key: 'actions', label: 'Actions' },
]

function formatInvitationDate(createdAt: unknown): string {
  if (createdAt == null || createdAt === '') return '—'
  const d = typeof createdAt === 'string' ? new Date(createdAt) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'
}

async function loadMembers() {
  const id = businessId.value
  if (id === undefined) return
  membersLoading.value = true
  membersError.value = ''
  forbiddenMessage.value = ''
  try {
    const { data } = await crmApi.getBusinessMembers(id)
    const raw = data as { results?: { user_id: number; user_name?: string; role?: string }[] } | { user_id: number; user_name?: string; role?: string }[]
    members.value = Array.isArray(raw) ? raw : raw?.results ?? []
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 403) {
      forbiddenMessage.value = 'You do not have permission to view this team.'
    } else {
      membersError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to load members'
    }
    members.value = []
  } finally {
    membersLoading.value = false
  }
}

async function loadInvitations() {
  const id = businessId.value
  if (id === undefined) return
  invitationsLoading.value = true
  invitationsError.value = ''
  try {
    const { data } = await crmApi.getBusinessInvitations(id)
    const raw = data as { results?: { id: number | string; email?: string; role?: string; created_at?: string }[] } | { id: number | string; email?: string; role?: string; created_at?: string }[]
    invitations.value = Array.isArray(raw) ? raw : raw?.results ?? []
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 403) {
      forbiddenMessage.value = 'You do not have permission to view invitations.'
    } else {
      invitationsError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to load invitations'
    }
    invitations.value = []
  } finally {
    invitationsLoading.value = false
  }
}

async function refreshTeamData() {
  await loadWorkspace(true)
  await Promise.all([loadMembers(), loadInvitations()])
}

async function addMember() {
  const id = businessId.value
  if (id === undefined || addUserId.value == null) return
  addMemberSaving.value = true
  addMemberError.value = ''
  try {
    await crmApi.addBusinessMember(id, { user_id: addUserId.value, role: addMemberRole.value })
    addUserId.value = null
    await refreshTeamData()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error_code?: string; error?: string } } }
    addMemberError.value =
      err.response?.data?.error_code === 'plan_user_limit_reached'
        ? 'Plan user limit reached. Upgrade plan to add more members.'
        : err.response?.data?.error ?? (e as { message?: string }).message ?? 'Failed to add member'
  } finally {
    addMemberSaving.value = false
  }
}

async function updateMemberRole(userId: number, newRole: string) {
  const id = businessId.value
  if (id === undefined) return
  roleUpdateLoading.value = userId
  membersError.value = ''
  try {
    await crmApi.updateBusinessMemberRole(id, userId, { role: newRole })
    await loadMembers()
  } catch (e: unknown) {
    membersError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to update role'
  } finally {
    roleUpdateLoading.value = null
  }
}

async function removeMember(userId: number) {
  const id = businessId.value
  if (id === undefined) return
  removeLoading.value = userId
  try {
    await crmApi.removeBusinessMember(id, userId)
    await refreshTeamData()
  } catch (e: unknown) {
    membersError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to remove member'
  } finally {
    removeLoading.value = null
  }
}

async function transferOwnership() {
  const id = businessId.value
  if (id === undefined || transferNewOwnerId.value == null) return
  transferSaving.value = true
  transferError.value = ''
  try {
    await crmApi.transferOwnership(id, { new_owner_user_id: transferNewOwnerId.value })
    transferNewOwnerId.value = null
    await refreshTeamData()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    transferError.value = err.response?.data?.error ?? (e as { message?: string }).message ?? 'Failed to transfer ownership'
  } finally {
    transferSaving.value = false
  }
}

async function inviteByEmail() {
  const id = businessId.value
  if (id === undefined || !inviteEmailTrimmed.value) return
  inviteByEmailSaving.value = true
  inviteByEmailError.value = ''
  try {
    await crmApi.createBusinessInvitation(id, { email: inviteEmailTrimmed.value, role: inviteRole.value })
    inviteEmail.value = ''
    await refreshTeamData()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error_code?: string; error?: string } } }
    inviteByEmailError.value =
      err.response?.data?.error_code === 'plan_user_limit_reached'
        ? 'Plan user limit reached. Upgrade plan to add more members.'
        : err.response?.data?.error ?? (e as { message?: string }).message ?? 'Failed to send invitation'
  } finally {
    inviteByEmailSaving.value = false
  }
}

async function revokeInvitation(invitationId: number | string) {
  const id = businessId.value
  if (id === undefined) return
  revokeInvitationLoading.value = invitationId
  try {
    await crmApi.revokeBusinessInvitation(id, invitationId)
    await loadInvitations()
  } catch (e: unknown) {
    invitationsError.value = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to revoke invitation'
  } finally {
    revokeInvitationLoading.value = null
  }
}

watch(activeBusinessId, () => {
  forbiddenMessage.value = ''
  void loadMembers()
  void loadInvitations()
})

onMounted(async () => {
  await loadWorkspace()
  if (businessId.value !== undefined) {
    loadMembers()
    loadInvitations()
  }
})
</script>
