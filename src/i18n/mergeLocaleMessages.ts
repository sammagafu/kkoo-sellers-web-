/** Deep-merge locale messages: patch overrides base; nested objects merge recursively. */
export function mergeLocaleMessages<T extends Record<string, unknown>>(
  base: T,
  patch: Record<string, unknown>,
): T {
  const out = { ...base } as Record<string, unknown>
  for (const key of Object.keys(patch)) {
    const baseVal = base[key]
    const patchVal = patch[key]
    if (
      patchVal != null &&
      typeof patchVal === 'object' &&
      !Array.isArray(patchVal) &&
      baseVal != null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      out[key] = mergeLocaleMessages(
        baseVal as Record<string, unknown>,
        patchVal as Record<string, unknown>,
      )
    } else if (patchVal !== undefined) {
      out[key] = patchVal
    }
  }
  return out as T
}
