import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/acl'
import type { User } from '@/types/auth'
import { catalogImportUsesSellerFromToken, importCatalogProducts } from './catalogProductImport'

const sellerImport = vi.fn()
const adminImport = vi.fn()

vi.mock('@/api', () => ({
  catalogSellerApi: {
    importCatalog: (...args: unknown[]) => sellerImport(...args),
  },
  catalogAdminApi: {
    importCatalog: (...args: unknown[]) => adminImport(...args),
  },
}))

describe('importCatalogProducts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sellerImport.mockReset()
    adminImport.mockReset()
    sellerImport.mockResolvedValue({ data: { created: 1 } })
    adminImport.mockResolvedValue({ data: { created: 2 } })
  })

  it('uses seller endpoint for seller-only session', async () => {
    const store = useAuthStore()
    store.setUser({ id: 1, roles: ['seller'] } as User)
    expect(catalogImportUsesSellerFromToken()).toBe(true)

    const f = new File([''], 'p.csv')
    await importCatalogProducts(f)
    expect(sellerImport).toHaveBeenCalledWith(f, undefined)
    expect(adminImport).not.toHaveBeenCalled()
  })

  it('uses admin endpoint for admin session', async () => {
    const store = useAuthStore()
    store.setUser({ id: 1, roles: ['admin'] } as User)
    expect(catalogImportUsesSellerFromToken()).toBe(false)

    const f = new File([''], 'p.csv')
    await importCatalogProducts(f)
    expect(adminImport).toHaveBeenCalledWith(f, undefined)
    expect(sellerImport).not.toHaveBeenCalled()
  })

  it('uses admin endpoint when user is seller and staff', async () => {
    const store = useAuthStore()
    store.setUser({ id: 1, roles: [ROLES.STAFF, ROLES.SELLER] } as User)
    expect(catalogImportUsesSellerFromToken()).toBe(false)

    await importCatalogProducts(new File([''], 'p.csv'))
    expect(adminImport).toHaveBeenCalled()
    expect(sellerImport).not.toHaveBeenCalled()
  })
})
