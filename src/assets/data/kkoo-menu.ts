import type { MenuItemType } from '@/types/menu'
import type { User } from '@/types/auth'
import { ROLES } from '@/acl'
import type { CrmRolePermissions } from '@/config/crmRoles'
import { bizSellerAccountUrl, bizSellerDashboardUrl } from '@/config/app-portal-links'

const base: MenuItemType[] = [
  { key: 'kkoo-menu', label: 'PLATFORM', isTitle: true },
  {
    key: 'dashboard',
    icon: 'solar:home-2-broken',
    label: 'Home',
    route: { name: 'dashboards.index' },
  },
]

/**
 * Platform ops IA — nested groups so staff/superusers can scan ~7 hubs instead of ~47 leaves.
 * Seller Management stays superuser-only (filtered in adminMenuForUser).
 */
const adminMenu: MenuItemType[] = [
  { key: 'admin-section', label: 'OPERATIONS', isTitle: true },
  {
    key: 'admin-hub-workbench',
    icon: 'solar:clipboard-list-broken',
    label: 'Workbench',
    children: [
      { key: 'admin-orders', label: 'Orders', route: { name: 'admin.orders' }, parentKey: 'admin-hub-workbench' },
      { key: 'admin-returns', label: 'Returns', route: { name: 'admin.returns' }, parentKey: 'admin-hub-workbench' },
      { key: 'admin-disputes', label: 'Disputes', route: { name: 'admin.disputes' }, parentKey: 'admin-hub-workbench' },
      { key: 'admin-logistics', label: 'Drivers', route: { name: 'admin.logistics' }, parentKey: 'admin-hub-workbench' },
      { key: 'admin-group-orders', label: 'Group orders', route: { name: 'admin.group-orders' }, parentKey: 'admin-hub-workbench' },
    ],
  },
  {
    key: 'admin-hub-catalog',
    icon: 'solar:box-broken',
    label: 'Catalog',
    children: [
      { key: 'admin-products', label: 'Products', route: { name: 'admin.catalog.products' }, parentKey: 'admin-hub-catalog' },
      { key: 'admin-categories', label: 'Categories', route: { name: 'admin.catalog.categories' }, parentKey: 'admin-hub-catalog' },
      { key: 'admin-brands', label: 'Brands', route: { name: 'admin.catalog.brands' }, parentKey: 'admin-hub-catalog' },
      { key: 'admin-catalog-import', label: 'Import & templates', route: { name: 'admin.catalog.import' }, parentKey: 'admin-hub-catalog' },
      { key: 'admin-media', label: 'Media', route: { name: 'admin.catalog.media' }, parentKey: 'admin-hub-catalog' },
      { key: 'admin-stock', label: 'Stock', route: { name: 'admin.stock' }, parentKey: 'admin-hub-catalog' },
      {
        key: 'admin-missing-product-reports',
        label: 'Missing product reports',
        route: { name: 'admin.catalog.missing-product-reports' },
        parentKey: 'admin-hub-catalog',
      },
    ],
  },
  {
    key: 'admin-hub-people',
    icon: 'solar:users-group-two-rounded-broken',
    label: 'People & merchants',
    children: [
      { key: 'admin-users', label: 'Users', route: { name: 'admin.users' }, parentKey: 'admin-hub-people' },
      { key: 'admin-sellers', label: 'Seller management', route: { name: 'admin.sellers' }, parentKey: 'admin-hub-people' },
      { key: 'admin-kyc', label: 'KYC documents', route: { name: 'admin.kyc-documents' }, parentKey: 'admin-hub-people' },
      { key: 'admin-document-types', label: 'Document types', route: { name: 'admin.document-types' }, parentKey: 'admin-hub-people' },
      {
        key: 'admin-document-requirements',
        label: 'Document requirements',
        route: { name: 'admin.document-requirements' },
        parentKey: 'admin-hub-people',
      },
      { key: 'admin-referral-stats', label: 'Referral stats', route: { name: 'admin.referral-stats' }, parentKey: 'admin-hub-people' },
    ],
  },
  {
    key: 'admin-hub-growth',
    icon: 'solar:chart-2-broken',
    label: 'Growth',
    children: [
      {
        key: 'admin-hub-growth-marketing',
        label: 'Marketing',
        parentKey: 'admin-hub-growth',
        children: [
          { key: 'admin-promotions', label: 'Promotions', route: { name: 'admin.promotions' }, parentKey: 'admin-hub-growth-marketing' },
          { key: 'admin-flash-sales', label: 'Flash sales', route: { name: 'admin.flash-sales' }, parentKey: 'admin-hub-growth-marketing' },
          { key: 'admin-platform-campaigns', label: 'Push & promos', route: { name: 'admin.platform-campaigns' }, parentKey: 'admin-hub-growth-marketing' },
          { key: 'admin-seller-help-tour', label: 'Seller help tour', route: { name: 'admin.seller-help-tour' }, parentKey: 'admin-hub-growth-marketing' },
          { key: 'admin-ride-promotions', label: 'Ride promotions', route: { name: 'admin.ride-promotions' }, parentKey: 'admin-hub-growth-marketing' },
          { key: 'admin-promotion-bundles', label: 'Promotion bundles', route: { name: 'admin.promotions.bundles' }, parentKey: 'admin-hub-growth-marketing' },
          { key: 'admin-discover-events', label: 'Dar events', route: { name: 'admin.discover-events' }, parentKey: 'admin-hub-growth-marketing' },
          { key: 'admin-careers', label: 'Temp jobs', route: { name: 'admin.careers' }, parentKey: 'admin-hub-growth-marketing' },
        ],
      },
      {
        key: 'admin-hub-growth-loyalty',
        label: 'Loyalty & rewards',
        parentKey: 'admin-hub-growth',
        children: [
          { key: 'admin-vouchers', label: 'Vouchers', route: { name: 'admin.vouchers' }, parentKey: 'admin-hub-growth-loyalty' },
          { key: 'admin-redemptions', label: 'Loyalty redemptions', route: { name: 'admin.redemptions' }, parentKey: 'admin-hub-growth-loyalty' },
          { key: 'admin-reward-settings', label: 'Reward settings', route: { name: 'admin.reward-settings' }, parentKey: 'admin-hub-growth-loyalty' },
          { key: 'admin-weekly-pass', label: 'Weekly pass', route: { name: 'admin.weekly-pass' }, parentKey: 'admin-hub-growth-loyalty' },
          { key: 'admin-premium', label: 'Premium programs', route: { name: 'admin.premium' }, parentKey: 'admin-hub-growth-loyalty' },
        ],
      },
    ],
  },
  {
    key: 'admin-hub-network',
    icon: 'solar:delivery-broken',
    label: 'Network & payouts',
    children: [
      { key: 'admin-logistics-zones', label: 'Delivery zones', route: { name: 'admin.logistics.zones' }, parentKey: 'admin-hub-network' },
      { key: 'admin-logistics-map-places', label: 'Kkoo Maps', route: { name: 'admin.logistics.map-places' }, parentKey: 'admin-hub-network' },
      { key: 'admin-logistics-settings', label: 'Logistics settings', route: { name: 'admin.logistics.settings' }, parentKey: 'admin-hub-network' },
      { key: 'admin-payouts', label: 'Payouts', route: { name: 'admin.payouts' }, parentKey: 'admin-hub-network' },
      { key: 'admin-payout-methods', label: 'Payment methods', route: { name: 'admin.payout-methods' }, parentKey: 'admin-hub-network' },
      { key: 'admin-regional-settings', label: 'Currencies & phone', route: { name: 'admin.regional-settings' }, parentKey: 'admin-hub-network' },
    ],
  },
  {
    key: 'admin-hub-crm',
    icon: 'solar:buildings-2-broken',
    label: 'Platform CRM',
    children: [
      {
        key: 'admin-hub-crm-ops',
        label: 'CRM ops',
        parentKey: 'admin-hub-crm',
        children: [
          { key: 'admin-crm-dashboard', label: 'CRM dashboard', route: { name: 'admin.crm.dashboard' }, parentKey: 'admin-hub-crm-ops' },
          { key: 'admin-crm-onboarding', label: 'Company onboarding', route: { name: 'admin.crm.onboarding' }, parentKey: 'admin-hub-crm-ops' },
          { key: 'admin-crm-businesses', label: 'Businesses', route: { name: 'admin.crm.businesses' }, parentKey: 'admin-hub-crm-ops' },
          { key: 'admin-crm-customers', label: 'Customers', route: { name: 'admin.crm.customers' }, parentKey: 'admin-hub-crm-ops' },
          { key: 'admin-crm-invoices', label: 'Invoices', route: { name: 'admin.crm.invoices' }, parentKey: 'admin-hub-crm-ops' },
          { key: 'admin-crm-debts', label: 'Debts (Deni)', route: { name: 'admin.crm.debts' }, parentKey: 'admin-hub-crm-ops' },
        ],
      },
      {
        key: 'admin-hub-crm-config',
        label: 'CRM config',
        parentKey: 'admin-hub-crm',
        children: [
          { key: 'admin-crm-products', label: 'Inventory', route: { name: 'admin.crm.products' }, parentKey: 'admin-hub-crm-config' },
          { key: 'admin-crm-expenses', label: 'Expenses', route: { name: 'admin.crm.expenses' }, parentKey: 'admin-hub-crm-config' },
          { key: 'admin-crm-suppliers', label: 'Suppliers', route: { name: 'admin.crm.suppliers' }, parentKey: 'admin-hub-crm-config' },
          { key: 'admin-crm-purchase-orders', label: 'Purchase orders', route: { name: 'admin.crm.purchase-orders' }, parentKey: 'admin-hub-crm-config' },
          { key: 'admin-crm-employees', label: 'Employees', route: { name: 'admin.crm.employees' }, parentKey: 'admin-hub-crm-config' },
        ],
      },
    ],
  },
  {
    key: 'admin-hub-insights',
    icon: 'solar:chart-square-broken',
    label: 'Insights & config',
    children: [
      { key: 'admin-analytics', label: 'Analytics', route: { name: 'admin.analytics' }, parentKey: 'admin-hub-insights' },
      { key: 'admin-search-log', label: 'Search log', route: { name: 'admin.search-log' }, parentKey: 'admin-hub-insights' },
      { key: 'admin-verticals', label: 'Verticals overview', route: { name: 'admin.verticals.shop' }, parentKey: 'admin-hub-insights' },
      { key: 'admin-v-restaurants', label: 'Restaurants & menu', route: { name: 'admin.restaurants-menu' }, parentKey: 'admin-hub-insights' },
      { key: 'admin-v-hotels', label: 'Hotels', route: { name: 'admin.hotel' }, parentKey: 'admin-hub-insights' },
      { key: 'admin-v-groceries', label: 'Groceries', route: { name: 'admin.verticals.groceries' }, parentKey: 'admin-hub-insights' },
      { key: 'admin-partner-oauth', label: 'Partner OAuth', route: { name: 'admin.partner-oauth' }, parentKey: 'admin-hub-insights' },
    ],
  },
]

/**
 * Sellers operate on biz.kkooapp.co.tz — admin-web only offers a portal handoff,
 * never platform ops or dead seller.* router links.
 */
const sellerPortalMenu: MenuItemType[] = [
  { key: 'seller-section', label: 'SELLER', isTitle: true },
  {
    key: 'seller-portal',
    icon: 'solar:shop-2-broken',
    label: 'Open seller portal',
    url: bizSellerDashboardUrl,
    target: '_self',
    badge: { variant: 'primary', text: 'Biz' },
  },
  {
    key: 'seller-account',
    icon: 'solar:user-circle-broken',
    label: 'Seller account',
    url: bizSellerAccountUrl,
    target: '_self',
  },
]

/** Seller approve/reject requires superuser on the API; staff must not see Seller Management. */
export function canAccessSellerManagement(user?: User | null): boolean {
  return user?.is_superuser === true || user?.isSuperuser === true
}

function omitSellerManagementFromTree(items: MenuItemType[]): MenuItemType[] {
  return items
    .map((item) => {
      if (!item.children?.length) return item
      return {
        ...item,
        children: omitSellerManagementFromTree(item.children.filter((c) => c.key !== 'admin-sellers')),
      }
    })
    .filter((item) => item.key !== 'admin-sellers')
}

function adminMenuForUser(user?: User | null): MenuItemType[] {
  if (canAccessSellerManagement(user)) return adminMenu
  return omitSellerManagementFromTree(adminMenu)
}

function isPlatformOperator(user?: User | null): boolean {
  return (
    user?.is_superuser === true ||
    user?.isSuperuser === true ||
    user?.is_staff === true ||
    user?.isStaff === true
  )
}

function resolveEffectivePanelRole(
  role: string | null,
  panelRole: string | null | undefined,
  user?: User | null,
  activeAccountRole?: string | null,
): string | null {
  if (activeAccountRole === 'buyer') return null
  if (
    panelRole === ROLES.ADMIN ||
    panelRole === ROLES.STAFF ||
    panelRole === ROLES.SELLER ||
    panelRole === ROLES.CRM_MEMBER
  ) {
    return panelRole
  }
  if (user?.is_superuser === true || user?.isSuperuser === true) return ROLES.ADMIN
  if (user?.is_staff === true || user?.isStaff === true) return ROLES.STAFF
  if (role) return role
  return null
}

/** CRM / seller tools live on biz — admin only exposes handoff links. */
function crmMemberPortalMenu(crmPermissions?: CrmRolePermissions | null): MenuItemType[] {
  const items: MenuItemType[] = [
    { key: 'kkoo-menu', label: 'PLATFORM', isTitle: true },
    {
      key: 'crm-portal',
      icon: 'solar:chart-2-broken',
      label: 'Open business CRM',
      url: bizSellerDashboardUrl,
      target: '_self',
      badge: { variant: 'primary', text: 'Biz' },
    },
    {
      key: 'crm-account',
      icon: 'solar:user-circle-broken',
      label: 'Business account',
      url: bizSellerAccountUrl,
      target: '_self',
    },
  ]
  return filterCrmMenuByPermissions(items, crmPermissions)
}

/**
 * Menu resolver for admin-web.
 * - Admin/staff → platform ops tree (Seller management = superuser only)
 * - Seller (including unverified) → seller portal links only
 * - CRM member → biz CRM handoff
 */
export function getKkooMenuItems(
  role: string | null,
  sellerVerified: boolean = true,
  user?: User | null,
  panelRole?: string | null,
  crmPermissions?: CrmRolePermissions | null,
  activeAccountRole?: string | null,
): MenuItemType[] {
  void sellerVerified
  const effectiveRole = resolveEffectivePanelRole(role, panelRole, user, activeAccountRole)
  if (!effectiveRole) return base

  if (effectiveRole === ROLES.CRM_MEMBER) {
    return crmMemberPortalMenu(crmPermissions)
  }

  if (effectiveRole === ROLES.SELLER) {
    // Dual-role admins who switch to "seller" still only get seller tools — never platform ops under seller role.
    return [
      {
        key: 'kkoo-menu',
        label: 'SELLER WORKSPACE',
        isTitle: true,
      },
      ...sellerPortalMenu.filter((i) => !i.isTitle),
      ...(isPlatformOperator(user)
        ? [
            { key: 'back-admin-title', label: 'PLATFORM', isTitle: true } as MenuItemType,
            {
              key: 'back-admin',
              icon: 'solar:shield-user-broken',
              label: 'Back to admin home',
              route: { name: 'dashboards.index' },
            } as MenuItemType,
          ]
        : []),
    ]
  }

  if (effectiveRole === ROLES.ADMIN || effectiveRole === ROLES.STAFF) {
    return [...base, ...adminMenuForUser(user)]
  }

  return base
}

function filterCrmMenuByPermissions(items: MenuItemType[], perms?: CrmRolePermissions | null): MenuItemType[] {
  if (!perms) return items
  return items
}
