/** KKOO CRM team roles — company owners assign these to employees. */
export const KKOO_CRM_ROLES = {
  STEWARD: 'kkoo_steward',
  RUNNER: 'kkoo_runner',
  WATCHER: 'kkoo_watcher',
} as const

export type KkooCrmRole = (typeof KKOO_CRM_ROLES)[keyof typeof KKOO_CRM_ROLES] | 'owner'

export type CrmRolePermissions = {
  can_manage_members?: boolean
  can_edit_settings?: boolean
  can_create_invoices?: boolean
  can_view_analytics?: boolean
  can_edit_inventory?: boolean
  can_record_payments?: boolean
  can_export_reports?: boolean
  can_delete?: boolean
  can_edit_data?: boolean
}

export const CRM_ROLE_OPTIONS = [
  {
    value: KKOO_CRM_ROLES.STEWARD,
    text: 'KKOO Steward',
    description: 'Trust lead — manage team, settings, and all business records.',
  },
  {
    value: KKOO_CRM_ROLES.RUNNER,
    text: 'KKOO Runner',
    description: 'Market hand — daily sales, stock, invoices, and payments.',
  },
  {
    value: KKOO_CRM_ROLES.WATCHER,
    text: 'KKOO Watcher',
    description: 'Read-only plus reports — cannot change records.',
  },
] as const

const LEGACY_MAP: Record<string, KkooCrmRole> = {
  admin: KKOO_CRM_ROLES.STEWARD,
  manager: KKOO_CRM_ROLES.RUNNER,
  member: KKOO_CRM_ROLES.RUNNER,
  editor: KKOO_CRM_ROLES.RUNNER,
  cashier: KKOO_CRM_ROLES.RUNNER,
  viewer: KKOO_CRM_ROLES.WATCHER,
  accountant: KKOO_CRM_ROLES.WATCHER,
}

export function normalizeCrmRole(role: string | null | undefined): KkooCrmRole {
  const r = String(role ?? '').trim().toLowerCase()
  if (r === 'owner') return 'owner'
  if (r === KKOO_CRM_ROLES.STEWARD || r === KKOO_CRM_ROLES.RUNNER || r === KKOO_CRM_ROLES.WATCHER) {
    return r
  }
  return LEGACY_MAP[r] ?? KKOO_CRM_ROLES.WATCHER
}

export function crmRoleLabel(role: string | null | undefined): string {
  switch (normalizeCrmRole(role)) {
    case 'owner':
      return 'Business Owner'
    case KKOO_CRM_ROLES.STEWARD:
      return 'KKOO Steward'
    case KKOO_CRM_ROLES.RUNNER:
      return 'KKOO Runner'
    case KKOO_CRM_ROLES.WATCHER:
      return 'KKOO Watcher'
    default:
      return String(role ?? 'Team member')
  }
}

export function defaultCrmPermissions(role: string | null | undefined): CrmRolePermissions {
  const n = normalizeCrmRole(role)
  if (n === 'owner' || n === KKOO_CRM_ROLES.STEWARD) {
    return {
      can_manage_members: true,
      can_edit_settings: true,
      can_create_invoices: true,
      can_view_analytics: true,
      can_edit_inventory: true,
      can_record_payments: true,
      can_export_reports: true,
      can_delete: true,
      can_edit_data: true,
    }
  }
  if (n === KKOO_CRM_ROLES.RUNNER) {
    return {
      can_manage_members: false,
      can_edit_settings: false,
      can_create_invoices: true,
      can_view_analytics: false,
      can_edit_inventory: true,
      can_record_payments: true,
      can_export_reports: false,
      can_delete: false,
      can_edit_data: true,
    }
  }
  return {
    can_manage_members: false,
    can_edit_settings: false,
    can_create_invoices: false,
    can_view_analytics: true,
    can_edit_inventory: false,
    can_record_payments: false,
    can_export_reports: true,
    can_delete: false,
    can_edit_data: false,
  }
}

export function canAccessCrmRoute(
  routeName: string,
  perms: CrmRolePermissions,
): boolean {
  if (routeName === 'seller.crm.business') return perms.can_manage_members === true
  if (routeName.includes('.employees')) return perms.can_manage_members === true
  if (routeName.includes('analytics')) return perms.can_view_analytics === true
  return perms.can_edit_data !== false || perms.can_export_reports === true
}
