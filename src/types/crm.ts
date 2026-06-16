/**
 * CRM entity types aligned with CRM_SME_DAR_SPEC and API.
 */

export interface CrmCustomer {
  id?: number
  business_id?: number
  name: string
  phone: string
  email?: string
  address?: string
  credit_balance?: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface CrmExpense {
  id?: number
  business_id?: number
  category: string
  amount: number
  description?: string
  date: string
  created_at?: string
}

export interface CrmSupplier {
  id?: number
  business_id?: number
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface CrmEmployee {
  id?: number
  business_id?: number
  user_id?: number
  name: string
  phone?: string
  role?: string
  salary?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

/** Extract per-field errors from API response (e.g. errors: { name: "Required" }). */
export function getApiFieldErrors(e: unknown): Record<string, string> {
  const err = e as { response?: { data?: { errors?: Record<string, string> } } }
  const errors = err.response?.data?.errors
  return typeof errors === 'object' && errors !== null ? { ...errors } : {}
}
