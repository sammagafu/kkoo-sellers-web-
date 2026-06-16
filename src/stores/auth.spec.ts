import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'
import { ROLES } from '@/acl'
import type { User } from '@/types/auth'

describe('auth store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('inferRole / isPanelUser', () => {
    it('infers admin from roles array', () => {
      const store = useAuthStore()
      const user: User = { id: 1, email: 'a@b.com', roles: ['admin'] }
      store.setUser(user)
      expect(store.role).toBe(ROLES.ADMIN)
      expect(store.isPanelUser).toBe(true)
      expect(store.isAdmin).toBe(true)
    })

    it('infers admin from superuser', () => {
      const store = useAuthStore()
      store.setUser({ id: 1, is_superuser: true } as User)
      expect(store.role).toBe(ROLES.ADMIN)
      expect(store.isPanelUser).toBe(true)
    })

    it('infers staff from roles array', () => {
      const store = useAuthStore()
      store.setUser({ id: 1, roles: ['staff'] } as User)
      expect(store.role).toBe(ROLES.STAFF)
      expect(store.isPanelUser).toBe(true)
    })

    it('infers seller from roles array', () => {
      const store = useAuthStore()
      store.setUser({ id: 1, roles: ['seller'] } as User)
      expect(store.role).toBe(ROLES.SELLER)
      expect(store.isPanelUser).toBe(true)
    })

    it('infers role from single role string', () => {
      const store = useAuthStore()
      store.setUser({ id: 1, role: 'seller' } as User)
      expect(store.role).toBe(ROLES.SELLER)
    })

    it('returns null role for buyer-only or unknown', () => {
      const store = useAuthStore()
      store.setUser({ id: 1, roles: ['buyer'] } as User)
      expect(store.role).toBeNull()
      expect(store.isPanelUser).toBe(false)
    })

    it('clears role when user is null', () => {
      const store = useAuthStore()
      store.setUser({ id: 1, roles: ['admin'] } as User)
      store.setUser(null)
      expect(store.role).toBeNull()
      expect(store.isPanelUser).toBe(false)
    })
  })

  describe('token persistence', () => {
    it('persists tokens and user when setUser is called with tokens', () => {
      const store = useAuthStore()
      const user: User = { id: 1, email: 'a@b.com', roles: ['admin'] }
      store.setUser(user, { access: 'at', refresh: 'rt' })
      expect(store.accessToken).toBe('at')
      expect(store.refreshToken).toBe('rt')
      const raw = localStorage.getItem('kkoo_admin_auth')
      expect(raw).toBeTruthy()
      const data = JSON.parse(raw!)
      expect(data.access).toBe('at')
      expect(data.refresh).toBe('rt')
      expect(data.user).toEqual(user)
    })

    it('clearSession removes stored auth', async () => {
      const store = useAuthStore()
      store.setUser({ id: 1, roles: ['admin'] } as User, { access: 'a', refresh: 'r' })
      expect(localStorage.getItem('kkoo_admin_auth')).toBeTruthy()
      await store.clearSession()
      expect(localStorage.getItem('kkoo_admin_auth')).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
      expect(store.role).toBeNull()
    })
  })
})
