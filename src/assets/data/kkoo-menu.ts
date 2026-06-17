import type { MenuItemType } from '@/types/menu'
import type { User } from '@/types/auth'
import { ROLES } from '@/acl'
import type { CrmRolePermissions } from '@/config/crmRoles'

const base: MenuItemType[] = [
  { key: 'kkoo-menu', label: 'KKOOAPP', isTitle: true },
  {
    key: 'dashboard',
    icon: 'solar:home-2-broken',
    label: 'Dashboard',
    route: { name: 'dashboards.index' },
  },
]

const adminMenu: MenuItemType[] = [
  { key: 'admin-section', label: 'ADMIN', isTitle: true },
  // —— Verticals: shop, groceries, restaurants, hotels (buyer-app surfaces) ——
  { key: 'admin-group-verticals', label: 'Verticals', isTitle: true },
  {
    key: 'admin-verticals',
    icon: 'solar:widget-5-broken',
    label: 'All verticals',
    children: [
      { key: 'admin-v-shop', label: 'Shop', route: { name: 'admin.verticals.shop' }, parentKey: 'admin-verticals' },
      { key: 'admin-v-groceries', label: 'Groceries', route: { name: 'admin.verticals.groceries' }, parentKey: 'admin-verticals' },
      { key: 'admin-v-restaurants', label: 'Restaurants & menu', route: { name: 'admin.restaurants-menu' }, parentKey: 'admin-verticals' },
      { key: 'admin-v-hotels', label: 'Hotels', route: { name: 'admin.hotel' }, parentKey: 'admin-verticals' },
    ],
  },
  // —— Super app: Vouchers, Loyalty, Invoices, Stock ——
  { key: 'admin-group-superapp', label: 'Super app', isTitle: true },
  {
    key: 'admin-vouchers',
    icon: 'solar:gift-broken',
    label: 'Vouchers',
    route: { name: 'admin.vouchers' },
  },
  {
    key: 'admin-redemptions',
    icon: 'solar:hand-money-broken',
    label: 'Loyalty (Redemptions)',
    route: { name: 'admin.redemptions' },
  },
  {
    key: 'admin-reward-settings',
    icon: 'solar:settings-minimalistic-broken',
    label: 'Reward Settings',
    route: { name: 'admin.reward-settings' },
  },
  {
    key: 'admin-invoices',
    icon: 'solar:bill-list-broken',
    label: 'Order Invoices',
    route: { name: 'admin.crm.invoices' },
  },
  {
    key: 'admin-stock',
    icon: 'solar:box-minimalistic-broken',
    label: 'Stock',
    route: { name: 'admin.stock' },
  },
  // —— Catalog ——
  { key: 'admin-group-catalog', label: 'Catalog', isTitle: true },
  {
    key: 'admin-catalog',
    icon: 'solar:box-broken',
    label: 'Catalog',
    children: [
      { key: 'admin-brands', label: 'Brands', route: { name: 'admin.catalog.brands' }, parentKey: 'admin-catalog' },
      { key: 'admin-categories', label: 'Categories', route: { name: 'admin.catalog.categories' }, parentKey: 'admin-catalog' },
      { key: 'admin-products', label: 'Products', route: { name: 'admin.catalog.products' }, parentKey: 'admin-catalog' },
      { key: 'admin-catalog-import', label: 'Import & templates', route: { name: 'admin.catalog.import' }, parentKey: 'admin-catalog' },
      { key: 'admin-media', label: 'Media', route: { name: 'admin.catalog.media' }, parentKey: 'admin-catalog' },
    ],
  },
  // —— Orders & Commerce ——
  { key: 'admin-group-orders', label: 'Orders & Commerce', isTitle: true },
  {
    key: 'admin-orders',
    icon: 'solar:cart-large-2-broken',
    label: 'Orders',
    route: { name: 'admin.orders' },
  },
  {
    key: 'admin-returns',
    icon: 'solar:refresh-broken',
    label: 'Returns',
    route: { name: 'admin.returns' },
  },
  // —— Promotions ——
  { key: 'admin-group-promotions', label: 'Promotions', isTitle: true },
  {
    key: 'admin-promotions',
    icon: 'solar:tag-price-broken',
    label: 'Promotions',
    route: { name: 'admin.promotions' },
  },
  {
    key: 'admin-ride-promotions',
    icon: 'solar:delivery-broken',
    label: 'Ride Promotions',
    route: { name: 'admin.ride-promotions' },
  },
  {
    key: 'admin-promotion-bundles',
    icon: 'solar:box-broken',
    label: 'Promotion Bundles',
    route: { name: 'admin.promotions.bundles' },
  },
  // —— Logistics ——
  { key: 'admin-group-logistics', label: 'Logistics', isTitle: true },
  {
    key: 'admin-logistics',
    icon: 'solar:delivery-broken',
    label: 'Drivers',
    route: { name: 'admin.logistics' },
  },
  {
    key: 'admin-logistics-zones',
    icon: 'solar:map-point-broken',
    label: 'Delivery Zones',
    route: { name: 'admin.logistics.zones' },
  },
  {
    key: 'admin-logistics-settings',
    icon: 'solar:settings-minimalistic-broken',
    label: 'Logistics Settings',
    route: { name: 'admin.logistics.settings' },
  },
  // —— Payments ——
  { key: 'admin-group-payments', label: 'Payments', isTitle: true },
  {
    key: 'admin-payouts',
    icon: 'solar:wallet-money-broken',
    label: 'Payouts',
    route: { name: 'admin.payouts' },
  },
  {
    key: 'admin-payout-methods',
    icon: 'solar:card-recive-broken',
    label: 'Payment Methods',
    route: { name: 'admin.payout-methods' },
  },
  {
    key: 'admin-regional-settings',
    icon: 'solar:global-broken',
    label: 'Currencies & Phone',
    route: { name: 'admin.regional-settings' },
  },
  // —— Users & Accounts ——
  { key: 'admin-group-users', label: 'Users & Accounts', isTitle: true },
  {
    key: 'admin-users',
    icon: 'solar:users-group-two-rounded-broken',
    label: 'Users',
    route: { name: 'admin.users' },
  },
  {
    key: 'admin-sellers',
    icon: 'solar:user-id-broken',
    label: 'Seller Management',
    route: { name: 'admin.sellers' },
  },
  {
    key: 'admin-kyc',
    icon: 'solar:document-broken',
    label: 'KYC Documents',
    route: { name: 'admin.kyc-documents' },
  },
  {
    key: 'admin-referral-stats',
    icon: 'solar:users-group-two-rounded-broken',
    label: 'Referral Stats',
    route: { name: 'admin.referral-stats' },
  },
  // —— CRM / Business (SME) ——
  { key: 'admin-group-crm', label: 'CRM / Business', isTitle: true },
  {
    key: 'admin-crm-dashboard',
    icon: 'solar:chart-2-broken',
    label: 'CRM Dashboard',
    route: { name: 'admin.crm.dashboard' },
  },
  {
    key: 'admin-crm-businesses',
    icon: 'solar:buildings-2-broken',
    label: 'Businesses',
    route: { name: 'admin.crm.businesses' },
  },
  {
    key: 'admin-crm-customers',
    icon: 'solar:users-group-two-rounded-broken',
    label: 'Customers',
    route: { name: 'admin.crm.customers' },
  },
  {
    key: 'admin-crm-products',
    icon: 'solar:box-broken',
    label: 'Products (Inventory)',
    route: { name: 'admin.crm.products' },
  },
  {
    key: 'admin-crm-invoices',
    icon: 'solar:bill-list-broken',
    label: 'CRM Invoices',
    route: { name: 'admin.crm.invoices' },
  },
  {
    key: 'admin-crm-debts',
    icon: 'solar:wallet-money-broken',
    label: 'Debts (Deni)',
    route: { name: 'admin.crm.debts' },
  },
  {
    key: 'admin-crm-expenses',
    icon: 'solar:card-recive-broken',
    label: 'Expenses',
    route: { name: 'admin.crm.expenses' },
  },
  {
    key: 'admin-crm-suppliers',
    icon: 'solar:box-minimalistic-broken',
    label: 'Suppliers',
    route: { name: 'admin.crm.suppliers' },
  },
  {
    key: 'admin-crm-purchase-orders',
    icon: 'solar:clipboard-list-broken',
    label: 'Purchase Orders',
    route: { name: 'admin.crm.purchase-orders' },
  },
  {
    key: 'admin-crm-employees',
    icon: 'solar:user-id-broken',
    label: 'Employees',
    route: { name: 'admin.crm.employees' },
  },
  // —— Support ——
  { key: 'admin-group-support', label: 'Support', isTitle: true },
  {
    key: 'admin-disputes',
    icon: 'solar:shield-warning-broken',
    label: 'Disputes',
    route: { name: 'admin.disputes' },
  },
  // —— Insights ——
  { key: 'admin-group-insights', label: 'Insights', isTitle: true },
  {
    key: 'admin-search-log',
    icon: 'solar:magnifer-broken',
    label: 'Search Log',
    route: { name: 'admin.search-log' },
  },
  {
    key: 'admin-missing-product-reports',
    icon: 'solar:box-minimalistic-broken',
    label: 'Missing Product Reports',
    route: { name: 'admin.catalog.missing-product-reports' },
  },
  {
    key: 'admin-analytics',
    icon: 'solar:chart-square-broken',
    label: 'Analytics',
    route: { name: 'admin.analytics' },
  },
  {
    key: 'admin-premium',
    icon: 'solar:crown-broken',
    label: 'Premium Programs',
    route: { name: 'admin.premium' },
  },
]

const sellerMenu: MenuItemType[] = [
  { key: 'seller-section', label: 'SELLER', isTitle: true },
  {
    key: 'seller-dashboard',
    icon: 'solar:home-2-broken',
    label: 'Seller dashboard',
    route: { name: 'seller.dashboard' },
  },
  // —— Verticals: shop, groceries, menu, hotel ——
  { key: 'seller-group-verticals', label: 'Verticals', isTitle: true },
  {
    key: 'seller-verticals',
    icon: 'solar:widget-5-broken',
    label: 'All verticals',
    children: [
      { key: 'seller-v-shop', label: 'Shop', route: { name: 'seller.verticals.shop' }, parentKey: 'seller-verticals' },
      { key: 'seller-v-groceries', label: 'Groceries', route: { name: 'seller.verticals.groceries' }, parentKey: 'seller-verticals' },
      { key: 'seller-v-menu', label: 'Menu (restaurant)', route: { name: 'seller.menu' }, parentKey: 'seller-verticals' },
      { key: 'seller-v-menu-screen', label: 'Menu screen (TV)', route: { name: 'seller.menu-screen' }, parentKey: 'seller-verticals' },
      { key: 'seller-v-hotel', label: 'Hotel', route: { name: 'seller.verticals.hotel' }, parentKey: 'seller-verticals' },
    ],
  },
  // —— Account ——
  { key: 'seller-group-account', label: 'Account', isTitle: true },
  {
    key: 'seller-profile',
    icon: 'solar:user-id-broken',
    label: 'Profile',
    route: { name: 'seller.profile' },
  },
  {
    key: 'seller-documents',
    icon: 'solar:document-broken',
    label: 'My Documents',
    route: { name: 'seller.documents' },
  },
  {
    key: 'seller-notification-preferences',
    icon: 'solar:bell-broken',
    label: 'Notification preferences',
    route: { name: 'seller.notification-preferences' },
  },
  // —— Commerce ——
  { key: 'seller-group-commerce', label: 'Commerce', isTitle: true },
  {
    key: 'seller-products',
    icon: 'solar:box-broken',
    label: 'My Products',
    route: { name: 'seller.products' },
  },
  {
    key: 'seller-products-import',
    icon: 'solar:upload-minimalistic-broken',
    label: 'Import products',
    route: { name: 'seller.products.import' },
  },
  {
    key: 'seller-orders',
    icon: 'solar:cart-large-2-broken',
    label: 'My Orders',
    route: { name: 'seller.orders' },
  },
  {
    key: 'seller-wholesale',
    icon: 'solar:cart-large-2-broken',
    label: 'Wholesale Tiers',
    route: { name: 'seller.wholesale' },
  },
  // —— CRM (all sellers) ——
  { key: 'seller-group-crm', label: 'CRM / Business', isTitle: true },
  {
    key: 'seller-crm-dashboard',
    icon: 'solar:chart-2-broken',
    label: 'CRM Dashboard',
    route: { name: 'seller.crm.dashboard' },
  },
  {
    key: 'seller-crm-business',
    icon: 'solar:users-group-two-rounded-broken',
    label: 'Team & Business',
    route: { name: 'seller.crm.business' },
  },
  {
    key: 'seller-crm-customers',
    icon: 'solar:users-group-two-rounded-broken',
    label: 'Customers',
    route: { name: 'seller.crm.customers' },
  },
  {
    key: 'seller-crm-products',
    icon: 'solar:box-broken',
    label: 'Products (Inventory)',
    route: { name: 'seller.crm.products' },
  },
  {
    key: 'seller-crm-invoices',
    icon: 'solar:bill-list-broken',
    label: 'Invoices',
    route: { name: 'seller.crm.invoices' },
  },
  {
    key: 'seller-crm-debts',
    icon: 'solar:wallet-money-broken',
    label: 'Debts (Deni)',
    route: { name: 'seller.crm.debts' },
  },
  {
    key: 'seller-crm-expenses',
    icon: 'solar:card-recive-broken',
    label: 'Expenses',
    route: { name: 'seller.crm.expenses' },
  },
  {
    key: 'seller-crm-suppliers',
    icon: 'solar:box-minimalistic-broken',
    label: 'Suppliers',
    route: { name: 'seller.crm.suppliers' },
  },
  {
    key: 'seller-crm-purchase-orders',
    icon: 'solar:clipboard-list-broken',
    label: 'Purchase Orders',
    route: { name: 'seller.crm.purchase-orders' },
  },
  {
    key: 'seller-crm-employees',
    icon: 'solar:user-id-broken',
    label: 'Employees',
    route: { name: 'seller.crm.employees' },
  },
  // —— Rewards & Growth ——
  { key: 'seller-group-rewards', label: 'Rewards & Growth', isTitle: true },
  {
    key: 'seller-referral-rewards',
    icon: 'solar:gift-broken',
    label: 'Referral & Rewards',
    route: { name: 'seller.referral-rewards' },
  },
  {
    key: 'seller-gift-vouchers',
    icon: 'solar:card-broken',
    label: 'Gift vouchers',
    route: { name: 'seller.gift-vouchers' },
  },
  {
    key: 'seller-share-earnings',
    icon: 'solar:share-broken',
    label: 'Share Earnings',
    route: { name: 'seller.share-earnings' },
  },
  // —— Insights ——
  { key: 'seller-group-insights', label: 'Insights', isTitle: true },
  {
    key: 'seller-search-insights',
    icon: 'solar:magnifer-broken',
    label: 'Search Insights',
    route: { name: 'seller.search-insights' },
  },
  {
    key: 'seller-missing-product-reports',
    icon: 'solar:box-minimalistic-broken',
    label: 'Missing Product Reports',
    route: { name: 'seller.missing-product-reports' },
  },
  {
    key: 'seller-analytics',
    icon: 'solar:chart-square-broken',
    label: 'Analytics',
    route: { name: 'seller.analytics' },
  },
]

/** Seller approve/reject requires superuser on the API; staff must not see Seller Management. */
export function canAccessSellerManagement(user?: User | null): boolean {
  return user?.is_superuser === true || user?.isSuperuser === true
}

function adminMenuForUser(user?: User | null): MenuItemType[] {
  if (canAccessSellerManagement(user)) return adminMenu
  return adminMenu.filter((item) => item.key !== 'admin-sellers')
}

function resolveEffectivePanelRole(
  role: string | null,
  panelRole: string | null | undefined,
  user?: User | null,
): string | null {
  if (panelRole === ROLES.ADMIN || panelRole === ROLES.STAFF || panelRole === ROLES.SELLER || panelRole === ROLES.CRM_MEMBER) {
    return panelRole
  }
  const isSuperuser = user?.is_superuser === true || user?.isSuperuser === true
  const isStaff = user?.is_staff === true || user?.isStaff === true
  if (isSuperuser) return ROLES.ADMIN
  if (isStaff) return ROLES.STAFF
  if (role) return role
  return null
}

/** When sellerVerified is false, seller sees limited nav + finalize registration link.
 * If role is null but user has is_staff/is_superuser, show admin menu so admin panel is never empty for staff.
 * Staff/superuser with seller flags get admin nav unless they explicitly switch to the seller role. */
export function getKkooMenuItems(
  role: string | null,
  sellerVerified: boolean = true,
  user?: User | null,
  panelRole?: string | null,
  crmPermissions?: CrmRolePermissions | null,
): MenuItemType[] {
  const effectiveRole = resolveEffectivePanelRole(role, panelRole, user)
  if (!effectiveRole) return base
  // Rider/driver flows are handled in the mobile rider app (not this panel).
  // CRM-only members: minimal menu (Dashboard = CRM, Team & Business, CRM list items only)
  if (effectiveRole === ROLES.CRM_MEMBER) {
    const crmItems: MenuItemType[] = [
      { key: 'kkoo-menu', label: 'KKOOAPP', isTitle: true },
      { key: 'dashboard', icon: 'solar:home-2-broken', label: 'Dashboard', route: { name: 'seller.crm.dashboard' } },
      { key: 'crm-section', label: 'CRM', isTitle: true },
      { key: 'seller-crm-business', icon: 'solar:users-group-two-rounded-broken', label: 'Team & Business', route: { name: 'seller.crm.business' } },
      { key: 'seller-crm-customers', icon: 'solar:users-group-two-rounded-broken', label: 'Customers', route: { name: 'seller.crm.customers' } },
      { key: 'seller-crm-products-cm', icon: 'solar:box-broken', label: 'Products (Inventory)', route: { name: 'seller.crm.products' } },
      { key: 'seller-crm-invoices', icon: 'solar:bill-list-broken', label: 'Invoices', route: { name: 'seller.crm.invoices' } },
      { key: 'seller-crm-debts', icon: 'solar:wallet-money-broken', label: 'Debts (Deni)', route: { name: 'seller.crm.debts' } },
      { key: 'seller-crm-expenses', icon: 'solar:card-recive-broken', label: 'Expenses', route: { name: 'seller.crm.expenses' } },
      { key: 'seller-crm-suppliers', icon: 'solar:box-minimalistic-broken', label: 'Suppliers', route: { name: 'seller.crm.suppliers' } },
      { key: 'seller-crm-purchase-orders', icon: 'solar:clipboard-list-broken', label: 'Purchase Orders', route: { name: 'seller.crm.purchase-orders' } },
      { key: 'seller-crm-employees', icon: 'solar:user-id-broken', label: 'Employees', route: { name: 'seller.crm.employees' } },
    ]
    return filterCrmMenuByPermissions(crmItems, crmPermissions)
  }
  // Sellers get Dashboard (main) + Seller dashboard (overview)
  const baseForSeller = [...base]
  if (effectiveRole === ROLES.SELLER) {
    // Admin/staff accounts may also have seller flags; hide restaurant menu screens in admin context.
    const isAdminOrStaff =
      user?.is_superuser === true ||
      user?.isSuperuser === true ||
      user?.is_staff === true ||
      user?.isStaff === true

    if (!sellerVerified) {
      return [
        ...baseForSeller,
        { key: 'seller-section-unv', label: 'SELLER', isTitle: true },
        {
          key: 'seller-finalize',
          icon: 'solar:clipboard-check-bold-duotone',
          label: 'Finalize registration',
          route: { name: 'seller.profile' },
        },
        {
          key: 'seller-documents-unv',
          icon: 'solar:document-broken',
          label: 'My Documents',
          route: { name: 'seller.documents' },
        },
        {
          key: 'seller-products-unverified',
          icon: 'solar:box-broken',
          label: 'My Products',
          route: { name: 'seller.products' },
        },
        {
          key: 'seller-products-import-unv',
          icon: 'solar:upload-minimalistic-broken',
          label: 'Import products',
          route: { name: 'seller.products.import' },
        },
        {
          key: 'seller-orders-unv',
          icon: 'solar:cart-large-2-broken',
          label: 'My Orders',
          route: { name: 'seller.orders' },
        },
        {
          key: 'seller-verticals-unv',
          icon: 'solar:widget-5-broken',
          label: 'Verticals',
          children: [
            { key: 'seller-v-shop-unv', label: 'Shop', route: { name: 'seller.verticals.shop' }, parentKey: 'seller-verticals-unv' },
            { key: 'seller-v-groceries-unv', label: 'Groceries', route: { name: 'seller.verticals.groceries' }, parentKey: 'seller-verticals-unv' },
            { key: 'seller-v-hotel-unv', label: 'Hotel', route: { name: 'seller.verticals.hotel' }, parentKey: 'seller-verticals-unv' },
          ],
        },
        {
          key: 'seller-referral-unv',
          icon: 'solar:gift-broken',
          label: 'Referral & Rewards',
          route: { name: 'seller.referral-rewards' },
        },
        {
          key: 'seller-gift-vouchers-unv',
          icon: 'solar:card-broken',
          label: 'Gift vouchers',
          route: { name: 'seller.gift-vouchers' },
        },
        {
          key: 'seller-share-unv',
          icon: 'solar:share-broken',
          label: 'Share Earnings',
          route: { name: 'seller.share-earnings' },
        },
        {
          key: 'seller-search-unv',
          icon: 'solar:magnifer-broken',
          label: 'Search Insights',
          route: { name: 'seller.search-insights' },
        },
        {
          key: 'seller-missing-unv',
          icon: 'solar:box-minimalistic-broken',
          label: 'Missing Product Reports',
          route: { name: 'seller.missing-product-reports' },
        },
        { key: 'seller-verify-unlock', label: 'Verify to unlock', isTitle: true },
        { key: 'seller-unlock-crm', icon: 'solar:chart-2-broken', label: 'CRM', disabled: true },
        { key: 'seller-unlock-invoicing', icon: 'solar:bill-list-broken', label: 'Invoicing', disabled: true },
        { key: 'seller-unlock-menu', icon: 'solar:restaurant-broken', label: 'Menu (restaurant)', disabled: true },
        { key: 'seller-unlock-analytics', icon: 'solar:chart-square-broken', label: 'Analytics', disabled: true },
        { key: 'seller-unlock-wholesale', icon: 'solar:cart-large-2-broken', label: 'Wholesale', disabled: true },
        { key: 'seller-unlock-notifications', icon: 'solar:bell-broken', label: 'Notification preferences', disabled: true },
      ]
    }
    if (!isAdminOrStaff) return [...baseForSeller, ...sellerMenu]
    // Filter out "Menu (restaurant)" + "Menu screen (TV)" from seller nav for admin/staff users.
    const filteredSellerMenu = sellerMenu.map((it) => {
      if (!it.children) return it
      return {
        ...it,
        children: it.children.filter((c) => c.route?.name !== 'seller.menu' && c.route?.name !== 'seller.menu-screen'),
      }
    })
    return [...baseForSeller, ...filteredSellerMenu]
  }
  if (effectiveRole === ROLES.ADMIN || effectiveRole === ROLES.STAFF) return [...base, ...adminMenuForUser(user)]
  return base
}

function filterCrmMenuByPermissions(items: MenuItemType[], perms?: CrmRolePermissions | null): MenuItemType[] {
  if (!perms) return items
  return items.filter((item) => {
    const routeName =
      item.route && typeof item.route === 'object' && 'name' in item.route
        ? String(item.route.name)
        : ''
    if (routeName === 'seller.crm.business' || routeName === 'seller.crm.employees') {
      return perms.can_manage_members === true
    }
    return true
  })
}
