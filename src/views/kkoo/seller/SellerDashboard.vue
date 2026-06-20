<template>
  <VerticalLayout class="seller-dashboard-home">
    <!-- Greeting (match main dashboard) -->
    <b-row class="dashboard-greeting-row mb-4">
      <b-col class="d-flex align-items-center gap-3">
        <div class="dashboard-greeting-avatar flex-shrink-0">
          <img v-if="userAvatar" :src="userAvatar" alt="" class="rounded-circle" width="48" height="48" />
          <div v-else class="dashboard-greeting-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center">
            <Icon icon="solar:user-circle-bold-duotone" class="dashboard-greeting-icon" />
          </div>
        </div>
        <div class="flex-grow-1 min-w-0">
          <h5 class="dashboard-greeting-title mb-0">Greetings{{ greetingName ? ', ' + greetingName : '!' }}</h5>
          <p class="dashboard-greeting-subtitle text-muted mb-0 small">Start your day with KKOO</p>
        </div>
      </b-col>
    </b-row>

    <b-row class="mb-3">
      <b-col>
        <h4 class="dashboard-heading mb-0">Seller dashboard</h4>
        <p class="dashboard-subtitle text-muted mb-0">Your sales and company overview.</p>
      </b-col>
    </b-row>

    <b-alert
      v-if="!isSellerVerified"
      variant="warning"
      show
      class="mb-3"
    >
      <h6 class="mb-1">Complete registration</h6>
      <p class="mb-1 small">Verify your profile to unlock seller tools.</p>
      <router-link
        :to="{ name: 'seller.profile' }"
        class="btn btn-sm btn-outline-primary"
      >
        Finalize registration →
      </router-link>
    </b-alert>

    <!-- Company profile completion (hidden when complete) -->
    <template v-if="companyCompletionLoaded && companyCompletionPercent < 100">
    <h6 class="dashboard-section-label mb-2 mt-4">Company profile completion</h6>
    <b-card class="mb-4 seller-completion-card">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="flex-grow-1">
          <h6 class="text-muted text-uppercase small mb-1">Company profile completion</h6>
          <p class="mb-0 small text-muted">Verification: {{ isSellerVerified ? 'Approved' : 'Pending' }}</p>
          <div class="d-flex align-items-center gap-3">
            <div class="progress flex-grow-1" style="height: 1.25rem; max-width: 280px;">
              <div
                class="progress-bar"
                :class="companyCompletionPercent >= 100 ? 'bg-success' : (companyCompletionPercent >= 50 ? 'bg-info' : 'bg-warning')"
                :style="{ width: companyCompletionPercent + '%' }"
                role="progressbar"
                :aria-valuenow="companyCompletionPercent"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <span class="fw-semibold">{{ companyCompletionPercent }}%</span>
          </div>
        </div>
        <b-button variant="outline-primary" size="sm" :to="{ name: 'seller.profile' }">Complete profile</b-button>
      </div>
    </b-card>
    </template>

    <h6 class="dashboard-section-label mb-2 mt-4">Your performance</h6>
    <p class="text-muted small mb-3">Products, orders, and sales at a glance.</p>
    <b-row v-if="loading" class="mb-4">
      <b-col md="3" class="mb-3" v-for="i in 4" :key="i">
        <b-card class="h-100">
          <div class="placeholder-glow">
            <span class="placeholder col-6 rounded"></span>
            <span class="placeholder col-4 d-block mt-2 rounded"></span>
          </div>
        </b-card>
      </b-col>
    </b-row>
    <b-row v-else class="mb-4">
      <b-col md="3" class="mb-3">
        <b-card class="h-100 seller-stat-card">
          <b-card-body class="d-flex align-items-start gap-3">
            <div class="seller-stat-icon-wrap seller-stat-icon--primary rounded p-2">
              <Icon icon="solar:box-broken" class="seller-stat-icon text-primary" />
            </div>
            <div class="flex-grow-1 min-w-0">
              <h6 class="seller-stat-label mb-1">Products</h6>
              <p class="seller-stat-value mb-0">{{ stats.totalProducts }}</p>
              <p v-if="stats.lowStockCount != null && stats.lowStockCount > 0" class="text-warning small mb-0 mt-1">{{ stats.lowStockCount }} low stock</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col md="3" class="mb-3">
        <b-card class="h-100 seller-stat-card">
          <b-card-body class="d-flex align-items-start gap-3">
            <div class="seller-stat-icon-wrap seller-stat-icon--success rounded p-2">
              <Icon icon="solar:cart-large-2-broken" class="seller-stat-icon text-success" />
            </div>
            <div class="flex-grow-1 min-w-0">
              <h6 class="seller-stat-label mb-1">Orders</h6>
              <p class="seller-stat-value mb-0">{{ stats.totalOrders }}</p>
              <p class="text-muted small mb-0 mt-1">Total all time</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col md="3" class="mb-3">
        <b-card class="h-100 seller-stat-card">
          <b-card-body class="d-flex align-items-start gap-3">
            <div class="seller-stat-icon-wrap seller-stat-icon--warning rounded p-2">
              <Icon icon="solar:clock-circle-broken" class="seller-stat-icon text-warning" />
            </div>
            <div class="flex-grow-1 min-w-0">
              <h6 class="seller-stat-label mb-1">Pending orders</h6>
              <p class="seller-stat-value mb-0">{{ stats.pendingOrders }}</p>
              <p class="text-muted small mb-0 mt-1">Not yet shipped</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col md="3" class="mb-3">
        <b-card class="h-100 seller-stat-card">
          <b-card-body class="d-flex align-items-start gap-3">
            <div class="seller-stat-icon-wrap seller-stat-icon--info rounded p-2">
              <Icon icon="solar:wallet-money-broken" class="seller-stat-icon text-info" />
            </div>
            <div class="flex-grow-1 min-w-0">
              <h6 class="seller-stat-label mb-1">Total sales</h6>
              <p class="seller-stat-value mb-0">{{ stats.totalSales }}</p>
              <p class="text-muted small mb-0 mt-1">Revenue to date</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <!-- Extra stats: this week / month, AOV, returns, payout -->
    <h6 class="dashboard-section-label mb-2 mt-4">Overview</h6>
    <p class="text-muted small mb-3">Orders, AOV, returns, payout, and rating at a glance.</p>
    <b-row v-if="!loading" class="mb-4">
      <b-col sm="6" md="4" lg="2" class="mb-3">
        <b-card class="h-100 seller-stat-card seller-stat-card--sm">
          <b-card-body class="d-flex align-items-center gap-2 py-2">
            <Icon icon="solar:calendar-minimalistic-broken" class="seller-stat-icon-sm text-primary" />
            <div class="min-w-0">
              <span class="d-block small text-muted">Orders this week</span>
              <span class="fw-semibold">{{ stats.ordersThisWeek }}</span>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col sm="6" md="4" lg="2" class="mb-3">
        <b-card class="h-100 seller-stat-card seller-stat-card--sm">
          <b-card-body class="d-flex align-items-center gap-2 py-2">
            <Icon icon="solar:calendar-date-broken" class="seller-stat-icon-sm text-primary" />
            <div class="min-w-0">
              <span class="d-block small text-muted">Orders this month</span>
              <span class="fw-semibold">{{ stats.ordersThisMonth }}</span>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col sm="6" md="4" lg="2" class="mb-3">
        <b-card class="h-100 seller-stat-card seller-stat-card--sm">
          <b-card-body class="d-flex align-items-center gap-2 py-2">
            <Icon icon="solar:chart-2-broken" class="seller-stat-icon-sm text-success" />
            <div class="min-w-0">
              <span class="d-block small text-muted">Avg order value</span>
              <span class="fw-semibold">{{ stats.averageOrderValue }}</span>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col sm="6" md="4" lg="2" class="mb-3">
        <b-card class="h-100 seller-stat-card seller-stat-card--sm">
          <b-card-body class="d-flex align-items-center gap-2 py-2">
            <Icon icon="solar:refresh-broken" class="seller-stat-icon-sm text-warning" />
            <div class="min-w-0">
              <span class="d-block small text-muted">Returns</span>
              <span class="fw-semibold">{{ stats.returnsCount }}</span>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col sm="6" md="4" lg="2" class="mb-3">
        <b-card class="h-100 seller-stat-card seller-stat-card--sm">
          <b-card-body class="d-flex align-items-center gap-2 py-2">
            <Icon icon="solar:wallet-money-broken" class="seller-stat-icon-sm text-info" />
            <div class="min-w-0">
              <span class="d-block small text-muted">Pending payout</span>
              <span class="fw-semibold">{{ stats.pendingPayout }}</span>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col sm="6" md="4" lg="2" class="mb-3">
        <b-card class="h-100 seller-stat-card seller-stat-card--sm">
          <b-card-body class="d-flex align-items-center gap-2 py-2">
            <Icon icon="solar:star-bold" class="seller-stat-icon-sm text-warning" />
            <div class="min-w-0">
              <span class="d-block small text-muted">Rating</span>
              <span class="fw-semibold">{{ stats.averageRating }}</span>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <DashboardQuickActions panel-id="seller-quick-actions" :items="sellerQuickActions" />
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import DashboardQuickActions, { type QuickActionItem } from '@/components/dashboard/DashboardQuickActions.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileCompletion } from '@/composables/useProfileCompletion'
import { useSellerStoreLink } from '@/composables/useSellerStoreLink'
import { analyticsSellerApi } from '@/api'
import { buyerWebPath } from '@/config/cross-app-links'

const auth = useAuthStore()
const isSellerVerified = computed(() => auth.isSellerVerified)
const { storeLink: micrositeUrl, hasStoreLink: hasMicrositeLink } = useSellerStoreLink()

const sellerQuickActions = computed<QuickActionItem[]>(() => {
  const items: QuickActionItem[] = [
    { key: 'products', label: 'Products', icon: 'solar:box-broken', tone: 'primary', hint: 'Catalog & stock', to: { name: 'seller.products' } },
    { key: 'create-product', label: 'Add product', icon: 'solar:add-circle-broken', tone: 'teal', hint: 'New listing', to: { name: 'seller.products.create' } },
    { key: 'orders', label: 'Orders', icon: 'solar:cart-large-2-broken', tone: 'success', hint: 'Fulfillment queue', to: { name: 'seller.orders' } },
    { key: 'checkout', label: 'Web checkout', icon: 'solar:bag-check-broken', tone: 'pink', hint: 'Buyer web cart', href: buyerWebPath('/checkout') },
  ]

  if (hasMicrositeLink.value) {
    items.push({
      key: 'microsite',
      label: 'View storefront',
      icon: 'solar:monitor-bold',
      tone: 'purple',
      hint: 'Public microsite',
      href: micrositeUrl.value,
    })
  } else {
    items.push({
      key: 'store-link',
      label: 'Set store link',
      icon: 'solar:link-square-bold',
      tone: 'info',
      hint: 'Publish storefront',
      to: { name: 'seller.profile' },
    })
  }

  items.push(
    { key: 'profile', label: 'Store profile', icon: 'solar:user-id-broken', tone: 'info', hint: 'Brand & settings', to: { name: 'seller.profile' } },
    { key: 'import', label: 'Import products', icon: 'solar:upload-minimalistic-broken', tone: 'orange', hint: 'Bulk catalog upload', to: { name: 'seller.products.import' } },
  )

  if (isSellerVerified.value) {
    items.push(
      { key: 'invoicing', label: 'Invoicing', icon: 'solar:bill-list-broken', tone: 'warning', hint: 'Bills & receipts', to: { name: 'seller.crm.invoices' } },
      { key: 'crm', label: 'CRM', icon: 'solar:chart-2-broken', tone: 'info', hint: 'Customers & ops', to: { name: 'seller.crm.dashboard' } },
      { key: 'customers', label: 'Customers', icon: 'solar:users-group-rounded-broken', tone: 'teal', hint: 'Buyer relationships', to: { name: 'seller.crm.customers' } },
      { key: 'menu', label: 'Menu', icon: 'solar:restaurant-broken', tone: 'dark', hint: 'Restaurant items', to: { name: 'seller.menu' } },
      { key: 'analytics', label: 'Analytics', icon: 'solar:chart-square-broken', tone: 'orange', hint: 'Sales performance', to: { name: 'seller.analytics' } },
      { key: 'wholesale', label: 'Wholesale', icon: 'solar:delivery-broken', tone: 'dark', hint: 'Tier pricing', to: { name: 'seller.wholesale' } },
    )
  }

  items.push(
    { key: 'kyc', label: 'KYC documents', icon: 'solar:document-broken', tone: 'secondary', hint: 'Verification files', to: { name: 'seller.documents' } },
    { key: 'notifications', label: 'Notifications', icon: 'solar:bell-bing-broken', tone: 'purple', hint: 'Alert preferences', to: { name: 'seller.notification-preferences' } },
    { key: 'referrals', label: 'Referrals', icon: 'solar:gift-broken', tone: 'success', hint: 'Rewards program', to: { name: 'seller.referral-rewards' } },
    { key: 'vouchers', label: 'Gift vouchers', icon: 'solar:card-broken', tone: 'primary', hint: 'Promo codes', to: { name: 'seller.gift-vouchers' } },
    { key: 'share', label: 'Share earnings', icon: 'solar:share-broken', tone: 'info', hint: 'Partner payouts', to: { name: 'seller.share-earnings' } },
    { key: 'search', label: 'Search insights', icon: 'solar:magnifer-broken', tone: 'pink', hint: 'Demand signals', to: { name: 'seller.search-insights' } },
  )

  return items
})

const greetingName = computed(() => {
  const u = auth.user
  if (!u) return ''
  const first = (u as { first_name?: string }).first_name
  const last = (u as { last_name?: string }).last_name
  return [first, last].filter(Boolean).join(' ') || (u as { phone_number?: string }).phone_number || ''
})
const userAvatar = computed(() => (auth.user as { avatar?: string })?.avatar || '')

const { percentage: companyCompletionPercentRef, loading: companyCompletionLoadingRef } = useProfileCompletion()
const companyCompletionPercent = computed(() => companyCompletionPercentRef.value)
const companyCompletionLoaded = computed(() => !companyCompletionLoadingRef.value)

const loading = ref(true)
const stats = ref({
  totalProducts: 0,
  totalOrders: 0,
  pendingOrders: 0,
  totalSales: '0',
  lowStockCount: null as number | null,
  ordersThisWeek: 0,
  ordersThisMonth: 0,
  salesThisWeek: '0',
  salesThisMonth: '0',
  averageOrderValue: '0',
  returnsCount: 0,
  pendingPayout: '0',
  averageRating: '—',
})

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(n)
}

onMounted(async () => {
  loading.value = true
  try {
    const { data: a } = await analyticsSellerApi.overview().catch(() => ({ data: {} }))
    const d = (a ?? {}) as Record<string, unknown>
    const ordersByStatus = (d.orders_by_status as Record<string, number>) || {}
    const pending =
      Number(ordersByStatus.pending ?? 0) +
      Number(ordersByStatus.confirmed ?? 0)
    const productsLowStock = d.products_low_stock_count != null ? Number(d.products_low_stock_count) : null
    const avgRating = d.average_rating != null ? Number(d.average_rating) : null
    stats.value = {
      totalProducts: Number(d.products_count ?? 0),
      totalOrders: Number(d.total_orders ?? 0),
      pendingOrders: pending,
      totalSales: formatMoney(Number(d.total_sales ?? 0)),
      lowStockCount: productsLowStock,
      ordersThisWeek: Number(d.orders_this_week ?? 0),
      ordersThisMonth: Number(d.orders_this_month ?? 0),
      salesThisWeek: formatMoney(Number(d.sales_this_week ?? 0)),
      salesThisMonth: formatMoney(Number(d.sales_this_month ?? 0)),
      averageOrderValue: formatMoney(Number(d.average_order_value ?? 0)),
      returnsCount: Number(d.returns_count ?? 0),
      pendingPayout: formatMoney(Number(d.pending_payout ?? 0)),
      averageRating: avgRating != null ? avgRating.toFixed(1) : '—',
    }
  } catch {
    // keep defaults
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Match main dashboard: greeting */
.seller-dashboard-home .dashboard-greeting-row { padding: 0.5rem 0; }
.seller-dashboard-home .dashboard-greeting-title {
  font-size: 1.25rem;
  line-height: 1.4;
  font-weight: 600;
  color: var(--bs-headings-color);
}
.seller-dashboard-home .dashboard-greeting-subtitle {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--bs-secondary-color);
}
.seller-dashboard-home .dashboard-greeting-avatar img,
.seller-dashboard-home .dashboard-greeting-avatar-placeholder {
  width: 3rem;
  height: 3rem;
  object-fit: cover;
}
.seller-dashboard-home .dashboard-greeting-avatar-placeholder {
  background: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.15);
  color: var(--bs-primary);
}
.seller-dashboard-home .dashboard-greeting-icon {
  width: 1.618rem;
  height: 1.618rem;
}
.seller-dashboard-home .dashboard-heading { color: var(--bs-headings-color); }
.seller-dashboard-home .dashboard-subtitle { color: var(--bs-secondary-color); }

/* Section labels (same as main dashboard) */
.seller-dashboard-home .dashboard-section-label {
  color: var(--bs-headings-color);
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: 0.01em;
  padding-left: 0;
  border-left: none;
  margin-bottom: 0;
}

/* Cards use global design; completion card subtle brand */
.seller-completion-card {
  background: linear-gradient(135deg, rgba(var(--bs-primary-rgb, 92, 48, 143), 0.06) 0%, transparent 50%);
}

/* Stat cards: big numbers (2rem like main dashboard), icon size */
.seller-stat-card { border: none; }
.seller-stat-label {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--bs-secondary-color);
  text-transform: none;
}
.seller-stat-value {
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--bs-body-color);
}
.seller-stat-icon-wrap {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
}
.seller-stat-icon {
  width: 1.618rem;
  height: 1.618rem;
}
.seller-stat-icon-wrap.seller-stat-icon--primary { background: linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.22), rgba(var(--bs-primary-rgb), 0.06)); }
.seller-stat-icon-wrap.seller-stat-icon--success { background: linear-gradient(135deg, rgba(var(--bs-success-rgb), 0.22), rgba(var(--bs-success-rgb), 0.06)); }
.seller-stat-icon-wrap.seller-stat-icon--warning { background: linear-gradient(135deg, rgba(var(--bs-warning-rgb), 0.22), rgba(var(--bs-warning-rgb), 0.06)); }
.seller-stat-icon-wrap.seller-stat-icon--info { background: linear-gradient(135deg, rgba(var(--bs-info-rgb), 0.22), rgba(var(--bs-info-rgb), 0.06)); }
.seller-stat-card--sm .card-body { padding: 0.75rem 1rem; }
.seller-stat-icon-sm {
  width: 1.618rem;
  height: 1.618rem;
  flex-shrink: 0;
}
.seller-stat-card--sm .fw-semibold { font-size: 1rem; font-weight: 600; }

</style>
