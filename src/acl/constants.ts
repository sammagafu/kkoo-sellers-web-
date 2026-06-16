/**
 * ACL for KKOO Admin Panel (sellers + administrators only).
 *
 * This panel is for sellers and admin/staff only. Buyers use the mobile app
 * and the customer-facing website — they must not access this panel.
 *
 * Roles: admin (full), staff (subset of admin), seller, crm_member (CRM-only, no seller profile).
 * Display order in UI: Seller, Staff, Admin, Buyer.
 *
 * Admin dashboard access is granted only when the user has is_superuser (or equivalent:
 * role "admin" / "superuser" / "all", or is_staff for staff access). Having multiple
 * roles (e.g. Seller + Staff + Rider) does not by itself grant admin; is_superuser is required.
 */

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
  SELLER: 'seller',
  CRM_MEMBER: 'crm_member', // business member only: access to CRM routes, no seller/admin
} as const)

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** Permission identifiers (resource.action or area) */
export const PERMISSIONS = Object.freeze({
  // —— Admin/Staff: Users ——
  USERS_ACTION: 'users.action', // ban / suspend / activate

  // —— Admin/Staff: Redemptions & rewards ——
  REDEMPTIONS_LIST: 'redemptions.list',
  REDEMPTIONS_APPROVE: 'redemptions.approve',
  REDEMPTIONS_REJECT: 'redemptions.reject',
  REDEMPTIONS_COMPLETE: 'redemptions.complete',
  REFERRALS_STATS: 'referrals.stats',
  REWARDS_SETTINGS: 'rewards.settings', // get/update reward settings

  // —— Admin/Staff: Catalog (verification & governance) ——
  CATALOG_BRANDS_LIST: 'catalog.brands.list',
  CATALOG_BRANDS_UPDATE: 'catalog.brands.update',
  CATALOG_BRANDS_VERIFY: 'catalog.brands.verify',
  CATALOG_PRODUCTS_LIST: 'catalog.products.list',
  CATALOG_PRODUCTS_VERIFY: 'catalog.products.verify',
  CATALOG_PRODUCTS_DEACTIVATE: 'catalog.products.deactivate',
  CATALOG_MEDIA_LIST: 'catalog.media.list',
  CATALOG_MEDIA_VERIFY: 'catalog.media.verify',
  CATALOG_BULK_ACTION: 'catalog.bulk_action',

  // —— Admin/Staff: Orders & returns ——
  ORDERS_REFUND: 'orders.refund',
  ORDERS_STATUS: 'orders.status',
  RETURNS_APPROVE: 'returns.approve',
  RETURNS_REJECT: 'returns.reject',
  RETURNS_ITEM_RECEIVED: 'returns.item_received',
  RETURNS_PROCESS_REFUND: 'returns.process_refund',
  DISPUTES_RESOLVE: 'disputes.resolve',

  // —— Admin/Staff: Promotions ——
  PROMOTIONS_LIST: 'promotions.list',
  PROMOTIONS_CREATE: 'promotions.create',
  PROMOTIONS_UPDATE: 'promotions.update',
  PROMOTIONS_DELETE: 'promotions.delete',
  PROMOTIONS_CODES: 'promotions.codes',
  PROMOTIONS_BUNDLES: 'promotions.bundles',

  // —— Admin/Staff: Payments & logistics ——
  PAYOUTS_LIST: 'payouts.list',
  PAYOUTS_CREATE: 'payouts.create',
  PAYOUTS_UPDATE: 'payouts.update',
  LOGISTICS_ASSIGNMENTS: 'logistics.assignments',
  LOGISTICS_SETTINGS: 'logistics.settings',
  LOGISTICS_RIDER_PAYOUTS: 'logistics.rider_payouts',

  // —— Admin/Staff: Analytics ——
  ANALYTICS_ADMIN: 'analytics.admin',

  // —— Seller only ——
  SELLER_PROFILE: 'seller.profile',
  SELLER_PRODUCTS_CREATE: 'seller.products.create',
  SELLER_PRODUCTS_UPDATE: 'seller.products.update',
  SELLER_PRODUCTS_DELETE: 'seller.products.delete',
  SELLER_WHOLESALE_TIERS: 'seller.wholesale.tiers',
  ANALYTICS_SELLER: 'analytics.seller',
} as const)

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Permissions per role. Staff has a subset of admin. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = Object.freeze({
  [ROLES.ADMIN]: [
    PERMISSIONS.USERS_ACTION,
    PERMISSIONS.REDEMPTIONS_LIST,
    PERMISSIONS.REDEMPTIONS_APPROVE,
    PERMISSIONS.REDEMPTIONS_REJECT,
    PERMISSIONS.REDEMPTIONS_COMPLETE,
    PERMISSIONS.REFERRALS_STATS,
    PERMISSIONS.REWARDS_SETTINGS,
    PERMISSIONS.CATALOG_BRANDS_LIST,
    PERMISSIONS.CATALOG_BRANDS_UPDATE,
    PERMISSIONS.CATALOG_BRANDS_VERIFY,
    PERMISSIONS.CATALOG_PRODUCTS_LIST,
    PERMISSIONS.CATALOG_PRODUCTS_VERIFY,
    PERMISSIONS.CATALOG_PRODUCTS_DEACTIVATE,
    PERMISSIONS.CATALOG_MEDIA_LIST,
    PERMISSIONS.CATALOG_MEDIA_VERIFY,
    PERMISSIONS.CATALOG_BULK_ACTION,
    PERMISSIONS.ORDERS_REFUND,
    PERMISSIONS.ORDERS_STATUS,
    PERMISSIONS.RETURNS_APPROVE,
    PERMISSIONS.RETURNS_REJECT,
    PERMISSIONS.RETURNS_ITEM_RECEIVED,
    PERMISSIONS.RETURNS_PROCESS_REFUND,
    PERMISSIONS.DISPUTES_RESOLVE,
    PERMISSIONS.PROMOTIONS_LIST,
    PERMISSIONS.PROMOTIONS_CREATE,
    PERMISSIONS.PROMOTIONS_UPDATE,
    PERMISSIONS.PROMOTIONS_DELETE,
    PERMISSIONS.PROMOTIONS_CODES,
    PERMISSIONS.PROMOTIONS_BUNDLES,
    PERMISSIONS.PAYOUTS_LIST,
    PERMISSIONS.PAYOUTS_CREATE,
    PERMISSIONS.PAYOUTS_UPDATE,
    PERMISSIONS.LOGISTICS_ASSIGNMENTS,
    PERMISSIONS.LOGISTICS_SETTINGS,
    PERMISSIONS.LOGISTICS_RIDER_PAYOUTS,
    PERMISSIONS.ANALYTICS_ADMIN,
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.REDEMPTIONS_LIST,
    PERMISSIONS.REDEMPTIONS_APPROVE,
    PERMISSIONS.REDEMPTIONS_REJECT,
    PERMISSIONS.REDEMPTIONS_COMPLETE,
    PERMISSIONS.REFERRALS_STATS,
    PERMISSIONS.CATALOG_BRANDS_LIST,
    PERMISSIONS.CATALOG_PRODUCTS_LIST,
    PERMISSIONS.CATALOG_PRODUCTS_VERIFY,
    PERMISSIONS.CATALOG_MEDIA_LIST,
    PERMISSIONS.CATALOG_MEDIA_VERIFY,
    PERMISSIONS.ORDERS_REFUND,
    PERMISSIONS.ORDERS_STATUS,
    PERMISSIONS.RETURNS_APPROVE,
    PERMISSIONS.RETURNS_REJECT,
    PERMISSIONS.RETURNS_ITEM_RECEIVED,
    PERMISSIONS.RETURNS_PROCESS_REFUND,
    PERMISSIONS.DISPUTES_RESOLVE,
    PERMISSIONS.PROMOTIONS_LIST,
    PERMISSIONS.LOGISTICS_ASSIGNMENTS,
    PERMISSIONS.LOGISTICS_SETTINGS,
    PERMISSIONS.LOGISTICS_RIDER_PAYOUTS,
    PERMISSIONS.ANALYTICS_ADMIN,
  ],
  [ROLES.SELLER]: [
    PERMISSIONS.SELLER_PROFILE,
    PERMISSIONS.SELLER_PRODUCTS_CREATE,
    PERMISSIONS.SELLER_PRODUCTS_UPDATE,
    PERMISSIONS.SELLER_PRODUCTS_DELETE,
    PERMISSIONS.SELLER_WHOLESALE_TIERS,
    PERMISSIONS.ANALYTICS_SELLER,
  ],
  [ROLES.CRM_MEMBER]: [], // CRM-only: access controlled by route; no extra permissions
})
