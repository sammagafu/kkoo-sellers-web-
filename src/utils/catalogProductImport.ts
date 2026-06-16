import type { AxiosRequestConfig } from 'axios'
import { catalogAdminApi, catalogSellerApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

export type CatalogImportResult = {
  message?: string
  created?: number
  errors?: string[]
}

/** Seller sessions use POST /catalog/seller/import/catalog/ (seller from JWT). Staff/admin use admin import. */
export function importCatalogProducts(file: File, config?: AxiosRequestConfig) {
  const auth = useAuthStore()
  if (auth.isSeller && !auth.isAdminOrStaff) {
    return catalogSellerApi.importCatalog(file, config)
  }
  return catalogAdminApi.importCatalog(file, config)
}

export function catalogImportUsesSellerFromToken(): boolean {
  const auth = useAuthStore()
  return auth.isSeller && !auth.isAdminOrStaff
}
