import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { normalizeSellerMenuVertical } from '@/assets/data/kkoo-menu'
import type { SellerMenuVertical } from '@/types/menu'

/** Catalog listing kinds that reuse the product create/edit wizard. */
export type ProductListingKind = SellerMenuVertical

/**
 * Vertical-aware copy for product create/edit so sellers know
 * whether they are adding food, a room, medicine, groceries, or a shop item.
 */
export function useProductListingKind() {
  const { t, te } = useI18n()
  const auth = useAuthStore()

  const kind = computed<ProductListingKind>(() => {
    return normalizeSellerMenuVertical(auth.sellerType) ?? 'marketplace'
  })

  function kindKey(key: string): string {
    return `catalog.addProduct.kinds.${kind.value}.${key}`
  }

  function copy(key: string, params?: Record<string, unknown>): string {
    const specific = kindKey(key)
    if (te(specific)) return String(t(specific, params ?? {}))
    return String(t(`catalog.addProduct.${key}`, params ?? {}))
  }

  const addingBanner = computed(() => copy('addingBanner'))
  const kindShort = computed(() => copy('kindShort'))

  return {
    kind,
    copy,
    addingBanner,
    kindShort,
  }
}
