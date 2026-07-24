<template>
  <nav
    class="admin-toolbar border rounded-3 px-3 py-2 mb-3 d-flex flex-wrap align-items-center gap-2"
    aria-label="Admin page context"
  >
    <span class="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle small">
      {{ roleBadge }}
    </span>
    <span class="text-truncate fw-semibold" style="max-width: min(52vw, 360px)" :title="shortPageTitle">{{ shortPageTitle }}</span>

    <div class="d-flex flex-wrap align-items-center gap-1 ms-lg-auto">
      <b-button size="sm" variant="outline-primary" @click="showShortcuts = true">Shortcuts</b-button>
    </div>

    <b-modal v-model="showShortcuts" title="Admin keyboard shortcuts" ok-only ok-title="Close" size="lg" @hidden="showShortcuts = false">
      <p class="text-muted small mb-3">
        Shortcuts are disabled while focus is in a field, combobox, or when any dialog is open (except this help).
        Press <kbd class="px-1 rounded border bg-light">Esc</kbd> to close this panel.
        Use the sidebar for full navigation.
      </p>
      <b-table :items="shortcutRows" :fields="shortcutFields" small striped class="mb-0" />
    </b-modal>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { canAccessSellerManagement } from '@/assets/data/kkoo-menu'
import { useAdminToolbarShortcuts } from '@/composables/useAdminToolbarShortcuts'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const showShortcuts = ref(false)

const canManageSellers = computed(() => canAccessSellerManagement(auth.user))
const roleBadge = computed(() => (auth.isSuperuser ? 'Superuser' : 'Staff'))

const shortPageTitle = computed(() => {
  const t = route.meta?.title
  if (typeof t !== 'string') return 'Admin'
  const first = t.split(' | ')[0]?.trim()
  return first || 'Admin'
})

const modLabel = computed(() => (/Mac|iPhone|iPod|iPad/i.test(navigator.userAgent) ? '⌘' : 'Ctrl'))

const shortcutRows = computed(() => {
  const m = modLabel.value
  const rows = [
    { keys: `${m} + /`, action: 'Open or close this shortcuts panel' },
    { keys: 'Shift + ?', action: 'Same as above (US keyboard: Shift + /)' },
    { keys: 'Esc', action: 'Close shortcuts panel when it is open' },
    { keys: 'g then o', action: 'Go to Orders' },
    { keys: 'g then u', action: 'Go to Users' },
    { keys: 'g then p', action: 'Go to Catalog products' },
  ]
  if (canManageSellers.value) {
    rows.push({ keys: 'g then s', action: 'Go to Seller management' })
  }
  rows.push(
    { keys: 'g then c', action: 'Go to CRM dashboard' },
    { keys: 'g then k', action: 'Go to KYC documents' },
    { keys: 'g then m', action: 'Go to Promotions' },
    { keys: 'g then h', action: 'Go to Home dashboard' },
    { keys: 'g then a', action: 'Go to Analytics' },
    { keys: 'g then r', action: 'Go to Redemptions' },
    { keys: 'g then v', action: 'Go to Vouchers' },
    { keys: 'g then l', action: 'Go to Logistics (drivers)' },
    { keys: 'g then e', action: 'Go to Categories' },
    { keys: 'g then b', action: 'Go to Brands' },
  )
  return rows
})

const shortcutFields = [
  { key: 'keys', label: 'Shortcut' },
  { key: 'action', label: 'Action' },
]

useAdminToolbarShortcuts(router, showShortcuts, () => route.path.startsWith('/admin'), canManageSellers)
</script>

<style scoped>
.admin-toolbar {
  background: rgba(92, 48, 143, 0.04);
  border-color: rgba(92, 48, 143, 0.12) !important;
}
kbd {
  font-size: 0.8em;
}
</style>
