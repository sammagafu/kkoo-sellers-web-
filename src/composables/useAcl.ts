import { useAuthStore } from '@/stores/auth'
import type { Permission } from '@/acl'
import type { Role } from '@/acl'

export function useAcl() {
  const auth = useAuthStore()
  return {
    can: (permission: Permission) => auth.can(permission),
    hasRole: (role: Role) => auth.hasRole(role),
    role: auth.role,
    permissions: auth.permissions,
    isAdmin: auth.isAdmin,
    isStaff: auth.isStaff,
    isSeller: auth.isSeller,
    isAdminOrStaff: auth.isAdminOrStaff,
  }
}
