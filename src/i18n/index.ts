import { createI18n } from 'vue-i18n'
import en from './locales/en'
import sw from './locales/sw'
import fr from './locales/fr'
import { mergeLocaleMessages } from './mergeLocaleMessages'
import landingFr from './landingOverrides/fr'
import landingSw from './landingOverrides/sw'

const LOCALE_KEY = 'kkoo_admin_locale'

function getSavedLocale(): string {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved && ['en', 'sw', 'fr'].includes(saved)) return saved
  } catch {
    // ignore
  }
  return 'en'
}

export const supportedLocales = [
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'fr', name: 'Français' },
] as const

export type LocaleCode = 'en' | 'sw' | 'fr'

export function setLocale(code: LocaleCode): void {
  // For vue-i18n with `legacy: false`, locale is a Ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localeRef = (i18n.global as any).locale
  if (localeRef && typeof localeRef === 'object' && 'value' in localeRef) {
    localeRef.value = code
  } else {
    // Fallback for older typings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(i18n.global as any).locale = code
  }
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = code === 'sw' ? 'sw' : code
  }
  try {
    localStorage.setItem(LOCALE_KEY, code)
  } catch {
    // ignore
  }
}

const initialLocale = getSavedLocale()
export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    fr: mergeLocaleMessages(mergeLocaleMessages(en, fr), landingFr),
    sw: mergeLocaleMessages(mergeLocaleMessages(en, sw), landingSw),
  },
})

if (typeof document !== 'undefined' && document.documentElement) {
  document.documentElement.lang = initialLocale === 'sw' ? 'sw' : initialLocale
}
