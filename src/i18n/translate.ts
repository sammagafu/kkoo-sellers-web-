import { i18n } from './index'

/** Translate outside Vue setup (utils, composables). */
export function tt(key: string, values?: Record<string, string | number>): string {
  const out = i18n.global.t(key, values ?? {})
  return typeof out === 'string' ? out : String(out)
}
