import { onMounted, onUnmounted, type Ref } from 'vue'
import type { Router } from 'vue-router'

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.closest('[role="combobox"]')) return true
  return false
}

function anyModalOpen(): boolean {
  return !!document.querySelector('.modal.show')
}

const G_SEQUENCE_MS = 1400

const goMap: Record<string, string> = {
  o: 'admin.orders',
  u: 'admin.users',
  p: 'admin.catalog.products',
  s: 'admin.sellers',
  c: 'admin.crm.dashboard',
  k: 'admin.kyc-documents',
  m: 'admin.promotions',
  h: 'dashboards.index',
  a: 'admin.analytics',
  r: 'admin.redemptions',
  v: 'admin.vouchers',
  l: 'admin.logistics',
  e: 'admin.catalog.categories',
  b: 'admin.catalog.brands',
}

/**
 * Keyboard shortcuts when the admin toolbar is active (/admin routes).
 * - Ctrl+/ or ⌘+/ : toggle shortcuts help
 * - Shift+? : toggle shortcuts help
 * - g then letter : go to a section (disabled while typing or when a modal is open)
 */
export function useAdminToolbarShortcuts(
  router: Router,
  showHelpRef: Ref<boolean>,
  isAdminPath: () => boolean,
  canManageSellers: Ref<boolean> | (() => boolean) = () => true,
) {
  let gArmed = false
  let gTimer: ReturnType<typeof setTimeout> | null = null

  function disarmG() {
    gArmed = false
    if (gTimer) {
      clearTimeout(gTimer)
      gTimer = null
    }
  }

  function armG() {
    disarmG()
    gArmed = true
    gTimer = setTimeout(disarmG, G_SEQUENCE_MS)
  }

  function go(name: string) {
    disarmG()
    router.push({ name }).catch(() => {})
  }

  function onKeydown(e: KeyboardEvent) {
    if (!isAdminPath()) return

    if (showHelpRef.value && e.key === 'Escape') {
      showHelpRef.value = false
      e.preventDefault()
      return
    }

    const helpChord = (e.ctrlKey || e.metaKey) && (e.key === '/' || e.code === 'Slash')
    if (helpChord) {
      e.preventDefault()
      showHelpRef.value = !showHelpRef.value
      return
    }
    if (e.shiftKey && e.key === '?') {
      e.preventDefault()
      showHelpRef.value = !showHelpRef.value
      return
    }

    if (isTypingTarget(e.target)) return
    if (anyModalOpen()) return

    const key = e.key.toLowerCase()

    if (gArmed) {
      if (key === 's' && !(typeof canManageSellers === 'function' ? canManageSellers() : canManageSellers.value)) {
        disarmG()
        return
      }
      const dest = goMap[key]
      if (dest) {
        e.preventDefault()
        go(dest)
      } else {
        disarmG()
      }
      return
    }

    if (key === 'g') {
      armG()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
    disarmG()
  })
}
