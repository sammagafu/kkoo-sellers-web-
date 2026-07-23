/** Parse SKU variant_attributes whether API returns an object or a JSON string. */
export function parseVariantAttributes(raw: unknown): Record<string, string> {
  if (raw == null || raw === '') return {}
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed || trimmed === '{}' || trimmed === 'null') return {}
    try {
      return parseVariantAttributes(JSON.parse(trimmed))
    } catch {
      return {}
    }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const k = key.trim()
    if (!k || value == null) continue
    const v = String(value).trim()
    if (!v) continue
    out[k] = v
  }
  return out
}

function titleCaseKey(key: string): string {
  const spaced = key.replace(/_/g, ' ').trim()
  if (!spaced) return key
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** Build "Color: Red · Size: 42" from attributes that exist. Empty when none. */
export function formatSkuLabel(sku: {
  label?: string | null
  sku_code?: string | null
  variant_attributes?: unknown
  id?: number | null
}): string {
  const attrs = parseVariantAttributes(sku.variant_attributes)
  const parts = Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${titleCaseKey(k)}: ${v}`)
  if (parts.length) return parts.join(' · ')
  // Explicit API label only if it looks like real variant text (not a bare sku code).
  const explicit = String(sku.label ?? '').trim()
  if (explicit && explicit !== String(sku.sku_code ?? '').trim() && !/^SKU #\d+$/i.test(explicit)) {
    return explicit
  }
  return ''
}

/** True when the SKU has at least one non-empty variant label/value. */
export function skuHasVariantDisplay(sku: {
  label?: string | null
  sku_code?: string | null
  variant_attributes?: unknown
}): boolean {
  return formatSkuLabel(sku).length > 0
}

/** Format attributes for tables: blank when empty (do not show — or {}). */
export function formatVariantAttributesDisplay(raw: unknown): string {
  const attrs = parseVariantAttributes(raw)
  const parts = Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${titleCaseKey(k)}: ${v}`)
  return parts.join(' · ')
}
