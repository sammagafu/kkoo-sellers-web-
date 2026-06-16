/**
 * Currencies (public + admin). API.md: list, rates, convert.
 */
import client from './client'

export type CurrencyRow = {
  id: number
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_active: boolean
  last_updated?: string
}

export type PhoneCountryRow = {
  id: number
  iso_code: string
  name: string
  dial_code: string
  flag_emoji?: string
  is_active: boolean
  is_default: boolean
  display_order: number
}

export const currenciesApi = {
  list() {
    return client.get('/currencies/')
  },
  getRates() {
    return client.get<Record<string, { name?: string; symbol?: string; exchange_rate?: number; last_updated?: string }>>('/currencies/rates/')
  },
  convert(amount: number, from: string, to: string) {
    return client.get<{
      original_amount?: number
      from_currency?: string
      to_currency?: string
      converted_amount?: number
    }>('/currencies/convert/', { params: { amount, from, to } })
  },
}

export const currenciesAdminApi = {
  list(params?: { include_inactive?: boolean }) {
    return client.get<{ results: CurrencyRow[] }>('/users/admin/currencies/', {
      params: params?.include_inactive ? { include_inactive: '1' } : undefined,
    })
  },
  create(data: Partial<CurrencyRow>) {
    return client.post<CurrencyRow>('/users/admin/currencies/', data)
  },
  patch(id: number, data: Partial<CurrencyRow>) {
    return client.patch<CurrencyRow>(`/users/admin/currencies/${id}/`, data)
  },
}

export const phoneCountriesAdminApi = {
  list(params?: { include_inactive?: boolean }) {
    return client.get<{ results: PhoneCountryRow[] }>('/users/admin/phone-countries/', {
      params: params?.include_inactive ? { include_inactive: '1' } : undefined,
    })
  },
  create(data: Partial<PhoneCountryRow>) {
    return client.post<PhoneCountryRow>('/users/admin/phone-countries/', data)
  },
  patch(id: number, data: Partial<PhoneCountryRow>) {
    return client.patch<PhoneCountryRow>(`/users/admin/phone-countries/${id}/`, data)
  },
}

export const phoneCountriesApi = {
  list() {
    return client.get<PhoneCountryRow[]>('/phone-countries/')
  },
}
