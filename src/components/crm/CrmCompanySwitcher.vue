<template>
  <div v-if="showSwitcher" class="crm-company-switcher d-flex align-items-center gap-2">
    <Icon icon="solar:buildings-2-bold" class="crm-company-switcher__icon" aria-hidden="true" />
    <b-form-select
      :model-value="activeBusinessId"
      :options="companyOptions"
      value-field="value"
      text-field="text"
      size="sm"
      class="crm-company-switcher__select"
      aria-label="Active company"
      @update:model-value="onChange"
    />
    <span v-if="crmRoleDisplay" class="badge bg-soft-primary text-primary crm-company-switcher__role d-none d-md-inline">
      {{ crmRoleDisplay }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ROLES } from '@/acl'
import { useAuthStore } from '@/stores/auth'
import { useCrmWorkspace } from '@/composables/useCrmWorkspace'

const route = useRoute()
const auth = useAuthStore()
const {
  activeBusinessId,
  companyOptions,
  crmRoleDisplay,
  hasCompanies,
  loadWorkspace,
  selectCompany,
} = useCrmWorkspace()

const inCrmArea = computed(
  () =>
    route.path.startsWith('/seller/crm') ||
    route.path.startsWith('/admin/crm') ||
    route.path.startsWith('/invitations') ||
    auth.activePanelRole === ROLES.CRM_MEMBER,
)

const showSwitcher = computed(() => inCrmArea.value && hasCompanies.value)

function onChange(value: unknown) {
  const id = value == null || value === '' ? null : Number(value)
  void selectCompany(Number.isNaN(id as number) ? null : id)
}

onMounted(() => {
  if (inCrmArea.value) void loadWorkspace()
})

watch(inCrmArea, (active) => {
  if (active) void loadWorkspace()
})
</script>

<style scoped>
.crm-company-switcher__icon {
  width: 1.15rem;
  height: 1.15rem;
  color: var(--bs-secondary);
  flex-shrink: 0;
}
.crm-company-switcher__select {
  min-width: 9rem;
  max-width: 14rem;
  border-radius: 999px;
}
.crm-company-switcher__role {
  font-weight: 600;
  white-space: nowrap;
}
</style>
