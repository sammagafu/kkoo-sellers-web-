<template>
  <nav
    class="admin-toolbar border rounded-3 px-3 py-2 mb-3 d-flex flex-wrap align-items-center gap-2"
    aria-label="Admin quick navigation"
  >
    <span class="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle small">Admin</span>
    <span class="text-truncate fw-semibold" style="max-width: min(42vw, 280px)" :title="shortPageTitle">{{ shortPageTitle }}</span>

    <div class="d-flex flex-wrap align-items-center gap-1 ms-lg-auto">
      <b-button size="sm" variant="outline-secondary" :to="{ name: 'dashboards.index' }">Home</b-button>
      <b-button size="sm" variant="outline-secondary" :to="{ name: 'admin.orders' }">Orders</b-button>
      <b-button size="sm" variant="outline-secondary" :to="{ name: 'admin.users' }">Users</b-button>
      <b-button size="sm" variant="outline-secondary" :to="{ name: 'admin.catalog.products' }">Products</b-button>
      <b-button
        v-if="canManageSellers"
        size="sm"
        variant="outline-secondary"
        :to="{ name: 'admin.sellers' }"
      >
        Sellers
      </b-button>
      <b-button size="sm" variant="outline-secondary" :to="{ name: 'admin.crm.dashboard' }">CRM</b-button>
      <b-dropdown size="sm" variant="outline-secondary" text="More" menu-class="shadow-sm">
        <b-dropdown-item :to="{ name: 'admin.catalog.categories' }">Categories</b-dropdown-item>
        <b-dropdown-item :to="{ name: 'admin.catalog.brands' }">Brands</b-dropdown-item>
        <b-dropdown-item :to="{ name: 'admin.catalog.import' }">{{ t('catalogImport.hubTitle') }}</b-dropdown-item>
        <b-dropdown-item :to="{ name: 'admin.catalog.media' }">Media</b-dropdown-item>
        <b-dropdown-divider />
        <b-dropdown-item :to="{ name: 'admin.kyc-documents' }">KYC</b-dropdown-item>
        <b-dropdown-item :to="{ name: 'admin.promotions' }">Promotions</b-dropdown-item>
        <b-dropdown-item :to="{ name: 'admin.logistics' }">Logistics</b-dropdown-item>
        <b-dropdown-item :to="{ name: 'admin.analytics' }">Analytics</b-dropdown-item>
        <b-dropdown-item :to="{ name: 'admin.redemptions' }">Redemptions</b-dropdown-item>
        <b-dropdown-item :to="{ name: 'admin.vouchers' }">Vouchers</b-dropdown-item>
      </b-dropdown>
      <b-button size="sm" variant="outline-primary" @click="showShortcuts = true">Shortcuts</b-button>
    </div>

    <b-modal v-model="showShortcuts" title="Admin keyboard shortcuts" ok-only ok-title="Close" size="lg" @hidden="showShortcuts = false">
      <p class="text-muted small mb-3">
        Shortcuts are disabled while focus is in a field, combobox, or when any dialog is open (except this help).
        Press <kbd class="px-1 rounded border bg-light">Esc</kbd> to close this panel.
      </p>
      <b-table :items="shortcutRows" :fields="shortcutFields" small striped class="mb-0" />
    </b-modal>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { canAccessSellerManagement } from '@/assets/data/kkoo-menu'

const { t } = useI18n()
import { useAdminToolbarShortcuts } from '@/composables/useAdminToolbarShortcuts'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const showShortcuts = ref(false)

const canManageSellers = computed(() => canAccessSellerManagement(auth.user))

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
  background: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.04);
  border-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.12) !important;
}
kbd {
  font-size: 0.8em;
}
</style>
