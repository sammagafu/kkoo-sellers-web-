/**
 * Format an API error (e.g. axios error) into a user-readable string.
 * API.md: 4xx/5xx return { "error": "..." }; 403 may include error_code (seller_profile_required, admin_use_admin_endpoints).
 */
export function formatApiError(
  e: unknown,
  fallback = 'Something went wrong'
): string {
  const err = e as {
    response?: { data?: Record<string, unknown>; status?: number };
    message?: string;
  }
  let data: Record<string, unknown> | null = null
  const raw = err.response?.data
  if (raw != null) {
    if (typeof raw === 'object' && !Array.isArray(raw)) data = raw as Record<string, unknown>
    else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        if (parsed && typeof parsed === 'object') data = parsed
      } catch {
        // not JSON
      }
    }
  }
  if (!data) {
    const msg = String(err.message || fallback)
    if (msg.toLowerCase().includes('promotion') && msg.toLowerCase().includes('not found')) return "This promotion doesn't exist or was deleted."
    if (msg.trim().startsWith('{') && msg.includes('error') && msg.includes('not found')) return "This promotion doesn't exist or was deleted."
    return msg || fallback
  }
  const parts: string[] = []
  // API.md § Handling 403: error_code for role redirects
  const code = data.error_code
  if (code === 'admin_use_admin_endpoints') {
    parts.push('Use the admin dashboard for this action.')
  } else if (code === 'otp_required') {
    parts.push('OTP-only sign-in. Request a code and sign in with OTP.')
  } else if (code === 'password_auth_disabled') {
    parts.push('Password login is disabled. Use OTP to sign in.')
  } else if (code === 'phone_number_already_registered') {
    parts.push('Phone number already registered.')
  } else if (code === 'otp_delivery_not_configured') {
    parts.push('OTP delivery is not configured. Please try again later.')
  } else if (code === 'otp_delivery_failed') {
    parts.push('Unable to deliver the verification code. Please try again later.')
  } else if (code === 'superuser_required') {
    parts.push('Only a superuser can grant or remove superuser access for this account.')
  } else if (code === 'last_superuser') {
    parts.push('You cannot remove the last superuser. Promote another user first.')
  } else if (code === 'invalid_admin_role') {
    parts.push('Invalid role selection. Use none, staff, admin, or superuser.')
  }
  // API.md: error is the primary human-readable message
  if (data.error !== undefined && data.error !== null && String(data.error).trim()) {
    parts.push(String(data.error).trim())
  }
  if (data.detail !== undefined && data.detail !== null) {
    const d =
      typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((d: unknown) => String(d)).join(' ')
          : JSON.stringify(data.detail)
    if (d && !parts.includes(d)) parts.push(d)
  }
  const rest = { ...data }
  delete rest.error
  delete rest.detail
  delete rest.error_code
  if (Object.keys(rest).length > 0) {
    const fieldErrors = Object.entries(rest)
      .map(([k, v]) => {
        const msg = Array.isArray(v) ? v.join(', ') : String(v)
        return `${k}: ${msg}`
      })
      .join('; ')
    if (fieldErrors) parts.push(fieldErrors)
  }
  let message = parts.length ? parts.join(' — ') : err.message || fallback
  // Friendly message for promotion not found (avoid showing raw API text or JSON)
  const lower = String(message).toLowerCase()
  if (lower.includes('promotion') && lower.includes('not found')) {
    message = 'This promotion doesn’t exist or was deleted.'
  } else if (String(message).trim().startsWith('{') && lower.includes('error') && lower.includes('not found')) {
    message = "This promotion doesn't exist or was deleted."
  }
  return message
}
