/** Matches KKOO API GET /users/me/ and login response. Supports snake_case and common variants. */
export type User = {
  id?: number | string
  email?: string
  username?: string
  phone_number?: string
  first_name?: string
  last_name?: string
  full_name?: string
  /** Backend may return roles array: e.g. ["buyer", "seller"] or ["buyer", "staff"] */
  roles?: string[]
  /** Single role string (e.g. "seller", "admin", "staff") */
  role?: string
  /** Alternative field names some backends use */
  user_type?: string
  account_type?: string
  type?: string
  token?: string
  is_staff?: boolean
  is_superuser?: boolean
  is_seller?: boolean
  is_verified?: boolean
  /** CamelCase variants (if API returns camelCase) */
  isStaff?: boolean
  isSuperuser?: boolean
  isSeller?: boolean
  account_status?: string
  language_preference?: string
  referral_code?: string
  loyalty_points_balance?: number
  created_at?: string
  last_login?: string
  date_of_birth?: string | null
  avatar_url?: string
  avatar?: string
  /** Nested profile.role (some backends) */
  profile?: { role?: string; is_seller?: boolean }
  /** CRM businesses the user is owner or member of (GET /users/me/ may include this) */
  business_memberships?: { business_id: number; business_name?: string; role?: string }[]
}
