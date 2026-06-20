import { defineStore } from 'pinia'
import axios from 'axios'
import router from '@/router'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import { ROLES, ROLE_PERMISSIONS, type Role, type Permission } from '@/acl'
import type { User } from '@/types/auth'
import { clearOfflineData } from '@/utils/offlineStorage'
import {
  clearAdminAuthSession,
  readAdminAuthBlob,
  writeAdminAuthSession,
} from '@/utils/adminAuthSessionStorage'
import { jwtExpiresAtMs, refreshAccessTokenSingleFlight, startProactiveTokenRefresh, stopProactiveTokenRefresh } from '@/utils/tokenRefresh'
import { buyerWebPath } from '@/config/cross-app-links'

export const BUYER_ACCOUNT_ROLE = 'buyer' as const
export type AccountRole = Role | typeof BUYER_ACCOUNT_ROLE

function loadStored(): {
  access: string | null
  refresh: string | null
  user: User | null
  activeAccountRole: AccountRole | null
} {
  const data = readAdminAuthBlob()
  if (!data) return { access: null, refresh: null, user: null, activeAccountRole: null }
  const ar = data.activeAccountRole
  const activeAccountRole: AccountRole | null =
    ar === BUYER_ACCOUNT_ROLE ||
    ar === ROLES.ADMIN ||
    ar === ROLES.STAFF ||
    ar === ROLES.SELLER ||
    ar === ROLES.CRM_MEMBER
      ? (ar as AccountRole)
      : null
  return {
    access: data.access ?? data.accessToken ?? null,
    refresh: data.refresh ?? data.refreshToken ?? null,
    user: (data.user ?? null) as User | null,
    activeAccountRole,
  }
}

function saveStored(access: string, refresh: string, user: User | null, activeAccountRole: AccountRole | null) {
  writeAdminAuthSession({ access, refresh, user, activeAccountRole })
}

function clearStored() {
  clearAdminAuthSession()
}

/** Normalize to string array (backend may send roles[] or single role/user_type). */
function getRoleStrings(user: User): string[] {
  const list = user.roles
  if (Array.isArray(list) && list.length > 0) return list.map((x) => String(x).toLowerCase())
  const single =
    user.role ?? user.user_type ?? user.account_type ?? user.type ?? user.profile?.role
  if (typeof single === 'string' && single) return [single.toLowerCase()]
  return []
}

/** Infer role from GET /users/me/ or login response. Handles roles[], role, user_type, is_staff, is_seller, etc. */
function inferRole(user: User | null): Role | null {
  if (!user) return null

  const roles = getRoleStrings(user)
  if (roles.includes('all')) return ROLES.ADMIN
  if (roles.includes('admin') || roles.includes('superuser')) return ROLES.ADMIN
  if (roles.includes('staff')) return ROLES.STAFF
  if (roles.includes('seller')) return ROLES.SELLER
  const r = roles[0]
  if (r === ROLES.ADMIN || r === ROLES.STAFF || r === ROLES.SELLER) return r as Role

  if (user.is_superuser === true || user.isSuperuser === true) return ROLES.ADMIN
  if (user.is_staff === true || user.isStaff === true) return ROLES.STAFF
  if (user.is_seller === true || user.isSeller === true || user.profile?.is_seller === true)
    return ROLES.SELLER
  if ((user as User & { is_admin?: boolean }).is_admin === true) return ROLES.ADMIN

  const memberships = (user as User & { business_memberships?: unknown[] }).business_memberships
  if (Array.isArray(memberships) && memberships.length > 0) return ROLES.CRM_MEMBER

  return null
}

function inferAvailableAccountRoles(user: User | null): AccountRole[] {
  if (!user) return []

  const roles = new Set<AccountRole>([BUYER_ACCOUNT_ROLE])
  const roleStrings = getRoleStrings(user)

  if (roleStrings.includes('all')) roles.add(ROLES.ADMIN)
  if (roleStrings.includes('admin') || roleStrings.includes('superuser')) roles.add(ROLES.ADMIN)
  if (roleStrings.includes('staff')) roles.add(ROLES.STAFF)
  if (roleStrings.includes('seller')) roles.add(ROLES.SELLER)
  if (roleStrings.includes(ROLES.CRM_MEMBER)) roles.add(ROLES.CRM_MEMBER)

  if (user.is_seller === true || user.isSeller === true || user.profile?.is_seller === true) {
    roles.add(ROLES.SELLER)
  }
  if (user.is_superuser === true || user.isSuperuser === true || (user as User & { is_admin?: boolean }).is_admin === true) {
    roles.add(ROLES.ADMIN)
  }
  if (user.is_staff === true || user.isStaff === true) {
    roles.add(ROLES.STAFF)
  }

  const memberships = (user as User & { business_memberships?: unknown[] }).business_memberships
  if (Array.isArray(memberships) && memberships.length > 0) {
    roles.add(ROLES.CRM_MEMBER)
  }

  return Array.from(roles)
}

function pickActiveAccountRole(user: User | null, preferred: AccountRole | null): AccountRole | null {
  const availableRoles = inferAvailableAccountRoles(user)
  if (!availableRoles.length) return null
  if (preferred && availableRoles.includes(preferred)) return preferred
  const inferredPanelRole = inferRole(user)
  if (inferredPanelRole && availableRoles.includes(inferredPanelRole)) return inferredPanelRole
  return availableRoles.includes(BUYER_ACCOUNT_ROLE) ? BUYER_ACCOUNT_ROLE : availableRoles[0]
}

type AuthTokensPayload = {
  user?: User
  access?: string
  refresh?: string
  tokens?: { access: string; refresh: string }
  access_token?: string
  refresh_token?: string
}

function extractAuthTokens(data: AuthTokensPayload): { access: string; refresh: string } {
  const access =
    data.tokens?.access ?? data.access ?? data.access_token
  const refresh =
    data.tokens?.refresh ?? data.refresh ?? data.refresh_token
  if (!access || !refresh) throw new Error('No tokens in response')
  return { access, refresh }
}

/** Panel roles + buyer account hub (not CRM-only without seller). */
function sessionAllowedForApp(
  user: User | null,
  activeRole: AccountRole | null,
  panelRole: Role | null,
): boolean {
  if (panelRole === ROLES.ADMIN || panelRole === ROLES.STAFF || panelRole === ROLES.SELLER) {
    return true
  }
  if (activeRole === BUYER_ACCOUNT_ROLE) return true
  if (panelRole === ROLES.CRM_MEMBER) return true
  return inferAvailableAccountRoles(user).includes(BUYER_ACCOUNT_ROLE)
}

export const useAuthStore = defineStore('auth_store', () => {
  const stored = loadStored()
  const accessToken = ref<string | null>(stored.access)
  const refreshToken = ref<string | null>(stored.refresh)
  const user = ref<User | null>(stored.user)
  const role = ref<Role | null>(inferRole(stored.user))
  const activeAccountRole = ref<AccountRole | null>(pickActiveAccountRole(stored.user, stored.activeAccountRole))
  const availableAccountRoles = computed(() => inferAvailableAccountRoles(user.value))
  const activePanelRole = computed<Role | null>(() =>
    activeAccountRole.value && activeAccountRole.value !== BUYER_ACCOUNT_ROLE ? activeAccountRole.value : null
  )

  // When backend returns backup_codes on first login, show them once in UI.
  const pendingBackupCodes = ref<string[] | null>(null)

  const permissions = computed(() => {
    const r = activePanelRole.value
    if (!r || !ROLE_PERMISSIONS[r]) return []
    return [...ROLE_PERMISSIONS[r]]
  })

  function setUser(u: User | null, tokens?: { access?: string; refresh?: string }) {
    user.value = u
    if (tokens?.access) accessToken.value = tokens.access
    if (tokens?.refresh) refreshToken.value = tokens.refresh
    role.value = inferRole(u)
    activeAccountRole.value = pickActiveAccountRole(u, activeAccountRole.value)
    if (accessToken.value && refreshToken.value) {
      saveStored(accessToken.value, refreshToken.value, u, activeAccountRole.value)
      startProactiveTokenRefresh()
    }
  }

  /**
   * If role is still unknown after GET /users/me/, probe role-specific endpoints.
   * This prevents blindly fetching the wrong profile (seller vs admin).
   */
  async function inferRolesFromProfileEndpoints() {
    if (role.value != null) return
    const u = user.value
    if (!u) return

    let next: User | null = null

    // Seller: 200 → seller profile exists/allowed
    try {
      await authApi.getSellerProfile()
      next = { ...(next ?? u), is_seller: true }
    } catch {
      // not a seller or endpoint not available
    }

    if (next) setUser(next)
  }

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    saveStored(access, refresh, user.value, activeAccountRole.value)
    startProactiveTokenRefresh()
  }

  function setActiveAccountRole(nextRole: AccountRole) {
    if (!availableAccountRoles.value.includes(nextRole)) return
    activeAccountRole.value = nextRole
    if (accessToken.value && refreshToken.value) {
      saveStored(accessToken.value, refreshToken.value, user.value, activeAccountRole.value)
    }
  }

  function can(permission: Permission): boolean {
    return permissions.value.includes(permission)
  }

  function hasRole(r: Role): boolean {
    return availableAccountRoles.value.includes(r)
  }

  async function establishSession(
    data: AuthTokensPayload,
    options?: { allowBuyer?: boolean },
  ): Promise<User> {
    const { access, refresh } = extractAuthTokens(data)
    setTokens(access, refresh)
    const res = await authApi.getMe()
    const me = res.data as User
    setUser(me, { access, refresh })
    if (role.value == null) await inferRolesFromProfileEndpoints()
    const allowed =
      sessionAllowedForApp(user.value, activeAccountRole.value, activePanelRole.value) ||
      (options?.allowBuyer === true &&
        inferAvailableAccountRoles(user.value).includes(BUYER_ACCOUNT_ROLE))
    if (!allowed) {
      await clearSession()
      throw new Error('not_allowed')
    }
    return user.value as User
  }

  async function loginWithOtp(phone_number: string, otp_code: string) {
    const { data } = await authApi.verifyOtp(phone_number, otp_code)
    const rawCodes = (data as { backup_codes?: unknown }).backup_codes
    if (Array.isArray(rawCodes)) {
      const list = rawCodes.map((x) => String(x)).filter((s) => s.trim().length > 0)
      pendingBackupCodes.value = list.length ? list : null
    } else {
      pendingBackupCodes.value = null
    }
    return establishSession(data as AuthTokensPayload)
  }

  /** Apply tokens from POST /users/register/ and load the current user. */
  async function completeRegistration(data: AuthTokensPayload) {
    pendingBackupCodes.value = null
    const me = await establishSession(data, { allowBuyer: true })
    return me
  }

  function defaultRouteAfterAuth(): { name: string; query?: Record<string, string> } {
    if (isAdminOrStaff.value) return { name: 'dashboards.index' }
    if (isSeller.value) return { name: 'seller.dashboard' }
    if (typeof window !== 'undefined') {
      window.location.href = buyerWebPath('/marketplace')
    }
    return { name: 'account.home' }
  }

  function clearPendingBackupCodes() {
    pendingBackupCodes.value = null
  }

  async function initialize() {
    const { access, refresh, user: u, activeAccountRole: storedActiveAccountRole } = loadStored()
    if (!access || !refresh) return
    let activeAccess = access
    let activeRefresh = refresh
    const accessExp = jwtExpiresAtMs(access)
    const refreshExp = jwtExpiresAtMs(refresh)
    const now = Date.now()
    // Rotate before API calls when access JWT expired but refresh is still valid (avoids OTP re-login).
    if (refreshExp == null || refreshExp > now) {
      if (accessExp != null && accessExp <= now + 60_000) {
        const rotated = await refreshAccessTokenSingleFlight()
        if (rotated?.access) {
          activeAccess = rotated.access
          activeRefresh = rotated.refresh
        }
      }
    }
    accessToken.value = activeAccess
    refreshToken.value = activeRefresh
    if (u) {
      user.value = u
      role.value = inferRole(u)
      activeAccountRole.value = pickActiveAccountRole(u, storedActiveAccountRole)
      if (role.value == null) await inferRolesFromProfileEndpoints()
      if (!sessionAllowedForApp(user.value, activeAccountRole.value, activePanelRole.value)) {
        await clearSession()
      } else {
        startProactiveTokenRefresh()
      }
      return
    }
    try {
      const res = await authApi.getMe()
      const me = res.data as User
      // Interceptor may have rotated tokens on 401+retry — merge from disk, not closure.
      const latest = loadStored()
      setUser(me, {
        access: latest.access ?? access,
        refresh: latest.refresh ?? refresh,
      })
      if (role.value == null) await inferRolesFromProfileEndpoints()
      if (!sessionAllowedForApp(user.value, activeAccountRole.value, activePanelRole.value)) {
        await clearSession()
      } else {
        startProactiveTokenRefresh()
      }
    } catch (e) {
      // Network / server blips: do not wipe refresh token (avoids unnecessary OTP).
      const status = axios.isAxiosError(e) ? e.response?.status : undefined
      const transient =
        status == null || status === 408 || status === 429 || (typeof status === 'number' && status >= 500)
      if (transient) {
        const latest = loadStored()
        accessToken.value = latest.access
        refreshToken.value = latest.refresh
        return
      }
      clearStored()
      accessToken.value = null
      refreshToken.value = null
      user.value = null
      role.value = null
      activeAccountRole.value = null
    }
  }

  /** Clear session only (no redirect). Use when guard redirects with query, e.g. notAllowed. */
  async function clearSession() {
    stopProactiveTokenRefresh()
    clearStored()
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    role.value = null
    activeAccountRole.value = null
    await clearOfflineData()
  }

  /**
   * Called from axios when refresh fails: clear persisted auth + in-memory refs.
   * Does not clear offline IndexedDB (unlike full [clearSession]).
   */
  async function resetAuthIdentityFromHttpClient() {
    stopProactiveTokenRefresh()
    clearStored()
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    role.value = null
    activeAccountRole.value = null
  }

  async function logout() {
    const refresh = refreshToken.value
    try {
      await authApi.logout(refresh ? { refresh } : undefined)
    } catch {
      // ignore
    }
    await clearSession()
    await router.push('/auth/sign-in')
  }

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  /** True only for roles allowed in this panel (admin, staff, seller). */
  const isPanelUser = computed(
    () =>
      activePanelRole.value === ROLES.ADMIN ||
      activePanelRole.value === ROLES.STAFF ||
      activePanelRole.value === ROLES.SELLER
  )
  const isBuyer = computed(() => activeAccountRole.value === BUYER_ACCOUNT_ROLE)
  const isAdmin = computed(() => activePanelRole.value === ROLES.ADMIN)
  const isStaff = computed(() => activePanelRole.value === ROLES.STAFF)
  const isSeller = computed(() => activePanelRole.value === ROLES.SELLER)
  const isSuperuser = computed(
    () => user.value?.is_superuser === true || user.value?.isSuperuser === true,
  )
  const isAdminOrStaff = computed(() => {
    if (activeAccountRole.value === BUYER_ACCOUNT_ROLE) return false
    return (
      activePanelRole.value === ROLES.ADMIN ||
      activePanelRole.value === ROLES.STAFF ||
      isSuperuser.value ||
      user.value?.is_staff === true ||
      user.value?.isStaff === true
    )
  })
  /** True when role is seller and user is verified (seller can use full navigation). */
  const isSellerVerified = computed(() => activePanelRole.value === ROLES.SELLER && user.value?.is_verified === true)

  return {
    user,
    accessToken,
    refreshToken,
    role,
    activeAccountRole,
    activePanelRole,
    availableAccountRoles,
    permissions,
    isAuthenticated,
    isPanelUser,
    isBuyer,
    isAdmin,
    isStaff,
    isSeller,
    isSuperuser,
    isAdminOrStaff,
    isSellerVerified,
    pendingBackupCodes,
    clearPendingBackupCodes,
    setUser,
    setTokens,
    setActiveAccountRole,
    clearSession,
    resetAuthIdentityFromHttpClient,
    can,
    hasRole,
    loginWithOtp,
    establishSession,
    completeRegistration,
    defaultRouteAfterAuth,
    initialize,
    logout,
  }
})
