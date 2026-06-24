<template>
  <VerticalLayout>
    <b-row class="align-items-center mb-4">
      <b-col cols="12" md="8">
        <h4 class="mb-0">My account</h4>
      </b-col>
    </b-row>

    <b-alert v-if="restrictedMessage" show variant="warning" class="mb-4">{{ restrictedMessage }}</b-alert>

    <b-row class="g-3 mb-4">
      <b-col cols="12" lg="7">
        <b-card class="h-100" header="Signed in as" header-bg-variant="light" header-class="fw-semibold">
          <div class="d-flex align-items-start gap-3">
            <img
              v-if="hubAvatarUrl"
              :src="hubAvatarUrl"
              alt=""
              class="account-hub-avatar rounded-3 flex-shrink-0 object-fit-cover"
              width="64"
              height="64"
            />
            <div
              v-else
              class="account-hub-avatar rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center text-primary"
            >
              <Icon icon="solar:user-circle-bold-duotone" class="fs-1" />
            </div>
            <div class="min-w-0 flex-grow-1">
              <h5 class="mb-1 text-truncate">{{ displayName }}</h5>
              <p v-if="contactLine" class="text-muted small mb-3">{{ contactLine }}</p>
              <div class="d-flex flex-wrap gap-2">
                <router-link :to="{ name: 'account.profile' }" class="btn btn-sm btn-soft-primary">
                  Edit profile
                </router-link>
                <router-link :to="{ name: 'account.notifications' }" class="btn btn-sm btn-soft-primary">
                  Notifications
                </router-link>
                <router-link :to="{ name: 'account.backup-codes' }" class="btn btn-sm btn-soft-primary">
                  Backup codes
                </router-link>
              </div>
            </div>
          </div>
        </b-card>
      </b-col>
      <b-col cols="12" lg="5">
        <b-card class="h-100" header="Active role" header-bg-variant="light" header-class="fw-semibold">
          <div class="d-flex flex-wrap gap-2">
            <b-button
              v-for="roleOption in roleSwitchOptions"
              :key="roleOption.role"
              pill
              size="sm"
              :variant="activeAccountRole === roleOption.role ? 'primary' : 'outline-secondary'"
              class="d-inline-flex align-items-center gap-2"
              @click="switchRole(roleOption.role)"
            >
              <Icon :icon="roleOption.icon" class="fs-18" />
              <span>{{ roleOption.label }}</span>
            </b-button>
          </div>
        </b-card>
      </b-col>
    </b-row>

    <b-card class="mb-4" header="Customer experiences" header-bg-variant="light" header-class="fw-semibold">
      <b-row class="g-3">
        <b-col v-for="app in frontendApps" :key="app.title" cols="12" sm="6" xl="4">
          <a :href="app.href" class="text-decoration-none text-reset d-block h-100">
            <b-card class="h-100 border shadow-sm account-hub-link-card">
              <div class="d-flex align-items-start gap-3">
                <span class="account-hub-tile-icon rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center">
                  <Icon :icon="app.icon" class="fs-4 text-primary" />
                </span>
                <div class="min-w-0">
                  <div class="d-flex flex-wrap align-items-center gap-2">
                    <h6 class="mb-0">{{ app.title }}</h6>
                    <span class="badge badge-soft-primary rounded-pill">{{ app.badge }}</span>
                  </div>
                </div>
              </div>
            </b-card>
          </a>
        </b-col>
      </b-row>
    </b-card>

    <b-card header="Workspaces" header-bg-variant="light" header-class="fw-semibold">
      <b-row class="g-3">
        <b-col v-for="workspace in workspaceCards" :key="workspace.title" cols="12" md="6" xl="4">
          <b-card
            class="h-100"
            :class="{ 'opacity-75': !workspace.available }"
            body-class="d-flex flex-column"
          >
            <div class="d-flex align-items-start gap-3 mb-3">
              <span class="account-hub-tile-icon rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center">
                <Icon :icon="workspace.icon" class="fs-4 text-primary" />
              </span>
              <div class="min-w-0 flex-grow-1">
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <h6 class="mb-0">{{ workspace.title }}</h6>
                  <span
                    :class="
                      workspace.available ? 'badge badge-soft-success rounded-pill' : 'badge bg-secondary rounded-pill'
                    "
                  >
                    {{ workspace.status }}
                  </span>
                </div>
              </div>
            </div>
            <div class="d-flex flex-wrap gap-2 mt-auto pt-1">
              <b-button
                v-if="workspace.available && workspace.role"
                variant="primary"
                size="sm"
                @click="switchRole(workspace.role)"
              >
                Switch here
              </b-button>
              <a
                v-else-if="workspace.href"
                :href="workspace.href"
                class="btn btn-sm"
                :class="workspace.available ? 'btn-outline-secondary' : 'btn-outline-primary'"
                target="_blank"
                rel="noopener"
              >
                {{ workspace.available ? workspace.cta : workspace.fallbackCta ?? workspace.cta }}
              </a>
              <router-link
                v-else-if="workspace.route"
                :to="workspace.route"
                class="btn btn-sm"
                :class="workspace.available ? 'btn-outline-secondary' : 'btn-outline-primary'"
              >
                {{ workspace.available ? workspace.cta : workspace.fallbackCta ?? workspace.cta }}
              </router-link>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { ROLES } from '@/acl'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { BUYER_ACCOUNT_ROLE, useAuthStore, type AccountRole } from '@/stores/auth'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { buyerWebPath, bizWebPath } from '@/config/cross-app-links'
import {
  adminDashboardUrl,
  bizCrmUrl,
  bizSellerAccountUrl,
  bizSellerDashboardUrl,
  bizSellerRegisterUrl,
  buyerBusinessUrl,
  buyerMerchantUrl,
  buyerShopUrl,
} from '@/config/app-portal-links'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const { user, activeAccountRole, availableAccountRoles } = storeToRefs(auth)

const roleMeta: Record<AccountRole, { label: string; icon: string }> = {
  [BUYER_ACCOUNT_ROLE]: { label: 'Buyer', icon: 'solar:cart-large-2-bold' },
  [ROLES.SELLER]: { label: 'Seller', icon: 'solar:shop-2-bold' },
  [ROLES.ADMIN]: { label: 'Admin', icon: 'solar:shield-user-bold' },
  [ROLES.STAFF]: { label: 'Staff', icon: 'solar:users-group-rounded-bold' },
  [ROLES.CRM_MEMBER]: { label: 'Business team', icon: 'solar:buildings-3-bold' },
}

const roleDefaultRoutes: Record<AccountRole, { name?: string; href?: string }> = {
  [BUYER_ACCOUNT_ROLE]: { href: buyerWebPath('/account') },
  [ROLES.SELLER]: { href: bizSellerAccountUrl },
  [ROLES.ADMIN]: { name: 'dashboards.index' },
  [ROLES.STAFF]: { name: 'dashboards.index' },
  [ROLES.CRM_MEMBER]: { href: bizWebPath('/seller/crm') },
}

const displayName = computed(() => {
  const currentUser = user.value
  return (
    currentUser?.full_name ||
    [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') ||
    currentUser?.username ||
    'KKOO member'
  )
})

const hubAvatarUrl = computed(() => {
  const u = user.value as { avatar_url?: string; avatar?: string } | null
  return resolveAssetUrl(u?.avatar_url ?? u?.avatar) ?? ''
})

const contactLine = computed(() => {
  const currentUser = user.value
  return [currentUser?.phone_number, currentUser?.email].filter(Boolean).join(' • ')
})

const restrictedMessage = computed(() => {
  const restricted = String(route.query.restricted ?? '').toLowerCase()
  switch (restricted) {
    case 'admin':
      return 'No admin access on this account.'
    case 'business':
      return 'Register as a seller to open business tools.'
    default:
      return ''
  }
})

const roleSwitchOptions = computed(() =>
  availableAccountRoles.value.map((role) => ({
    role,
    label: roleMeta[role].label,
    icon: roleMeta[role].icon,
  }))
)

const frontendApps = computed(() => [
  { title: 'KKOO Shop', icon: 'solar:home-2-bold', badge: 'Home', href: buyerShopUrl },
  { title: 'Marketplace', icon: 'solar:cart-large-2-bold', badge: 'Buyer', href: buyerWebPath('/personal') },
  { title: 'For business', icon: 'solar:shop-2-bold', badge: 'Info', href: buyerBusinessUrl },
  { title: 'For merchants', icon: 'solar:bag-5-bold', badge: 'Info', href: buyerMerchantUrl },
  { title: 'Restaurants', icon: 'solar:chef-hat-bold', badge: 'Eat', href: buyerWebPath('/restaurants') },
  { title: 'Hotels', icon: 'solar:bed-bold', badge: 'Stay', href: buyerWebPath('/hotels') },
  { title: 'Community', icon: 'solar:users-group-rounded-bold', badge: 'People', href: buyerWebPath('/community') },
  { title: 'Share & earn', icon: 'solar:gift-bold', badge: 'Growth', href: buyerWebPath('/share-earn') },
  { title: 'Gift vouchers', icon: 'solar:ticket-bold', badge: 'Gifting', href: buyerWebPath('/vouchers') },
  { title: 'Seller portal', icon: 'solar:widget-5-bold', badge: 'Biz', href: bizSellerDashboardUrl },
  { title: 'Business CRM', icon: 'solar:buildings-3-bold', badge: 'Biz', href: bizCrmUrl },
  { title: 'Admin panel', icon: 'solar:shield-user-bold', badge: 'Admin', href: adminDashboardUrl },
  { title: 'KKOORide', icon: 'solar:scooter-bold', badge: 'Mobility', href: buyerWebPath('/courier') },
])

const roleAvailability = computed(() => new Set(availableAccountRoles.value))

const workspaceCards = computed(() => [
  {
    title: 'Buyer account',
    icon: 'solar:user-circle-bold',
    available: true,
    status: activeAccountRole.value === BUYER_ACCOUNT_ROLE ? 'Current' : 'Available',
    role: BUYER_ACCOUNT_ROLE,
    route: undefined,
    href: buyerWebPath('/account'),
    cta: 'Open buyer',
  },
  {
    title: 'Seller account',
    icon: 'solar:shop-2-bold',
    available: roleAvailability.value.has(ROLES.SELLER),
    status: roleAvailability.value.has(ROLES.SELLER) ? 'Available' : 'Register required',
    role: roleAvailability.value.has(ROLES.SELLER) ? ROLES.SELLER : null,
    route: undefined,
    href: roleAvailability.value.has(ROLES.SELLER) ? bizSellerAccountUrl : bizSellerRegisterUrl,
    cta: roleAvailability.value.has(ROLES.SELLER) ? 'Open seller account' : 'Register business',
    fallbackCta: 'Register business',
  },
  {
    title: 'Business CRM',
    icon: 'solar:buildings-3-bold',
    available: roleAvailability.value.has(ROLES.CRM_MEMBER),
    status: roleAvailability.value.has(ROLES.CRM_MEMBER) ? 'Available' : 'Invite required',
    role: roleAvailability.value.has(ROLES.CRM_MEMBER) ? ROLES.CRM_MEMBER : null,
    route: undefined,
    href: roleAvailability.value.has(ROLES.CRM_MEMBER) ? bizWebPath('/seller/crm') : undefined,
    cta: 'Open CRM',
  },
  {
    title: 'Admin dashboard',
    icon: 'solar:shield-user-bold',
    available: roleAvailability.value.has(ROLES.ADMIN) || roleAvailability.value.has(ROLES.STAFF),
    status: roleAvailability.value.has(ROLES.ADMIN) || roleAvailability.value.has(ROLES.STAFF) ? 'Available' : 'Restricted',
    role: roleAvailability.value.has(ROLES.ADMIN)
      ? ROLES.ADMIN
      : roleAvailability.value.has(ROLES.STAFF)
        ? ROLES.STAFF
        : null,
    route:
      roleAvailability.value.has(ROLES.ADMIN) || roleAvailability.value.has(ROLES.STAFF)
        ? { name: 'dashboards.index' }
        : null,
    cta: 'Open admin',
  },
])

async function switchRole(role: AccountRole) {
  auth.setActiveAccountRole(role)
  const target = roleDefaultRoutes[role]
  if (!target) return
  if (target.href) {
    window.location.href = target.href
    return
  }
  if (target.name) await router.push({ name: target.name })
}
</script>

<style scoped>
.account-hub-avatar {
  width: 3.5rem;
  height: 3.5rem;
  background: rgba(var(--bs-primary-rgb), 0.1);
}

.account-hub-tile-icon {
  width: 2.75rem;
  height: 2.75rem;
  background: rgba(var(--bs-primary-rgb), 0.08);
}

.account-hub-link-card {
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.account-hub-link-card:hover {
  border-color: rgba(var(--bs-primary-rgb), 0.35) !important;
  box-shadow: 0 0.25rem 1rem rgba(var(--bs-body-color-rgb), 0.08) !important;
}
</style>
