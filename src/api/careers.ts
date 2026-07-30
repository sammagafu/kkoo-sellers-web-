import client from './client'

export type CareerPostingRow = {
  id: number
  uuid: string
  title: string
  slug: string
  description: string
  department?: string
  location?: string
  latitude?: number | null
  longitude?: number | null
  location_cell?: string
  employment_type?: string
  rate_amount?: number | null
  rate_currency?: string
  earning_potential_min?: number | null
  earning_potential_max?: number | null
  earning_period?: string
  requirements?: string
  application_deadline?: string | null
  status?: string
  published_at?: string | null
  seller_id?: number | null
}

export type CareerApplicationRow = {
  id: number
  uuid: string
  career_posting_id: number
  name: string
  email: string
  phone?: string
  cover_letter?: string
  resume_file?: string
  status?: string
  notes?: string
  created_at?: string
}

export type CareerPostingPayload = {
  title: string
  slug?: string
  description?: string
  department?: string
  location?: string
  latitude?: number | null
  longitude?: number | null
  location_cell?: string
  employment_type?: string
  rate_amount?: number | null
  rate_currency?: string
  earning_potential_min?: number | null
  earning_potential_max?: number | null
  earning_period?: string
  requirements?: string
  application_deadline?: string | null
  status?: string
  seller_id?: number | null
}

export const careersAdminApi = {
  list(params?: { status?: string; seller_id?: number }) {
    return client.get<{ results: CareerPostingRow[] }>('/careers/admin/postings/', { params })
  },
  create(data: CareerPostingPayload) {
    return client.post<CareerPostingRow>('/careers/admin/postings/', data)
  },
  update(ref: string, data: Partial<CareerPostingPayload>) {
    return client.patch<CareerPostingRow>(`/careers/admin/postings/${encodeURIComponent(ref)}/`, data)
  },
  remove(ref: string) {
    return client.delete(`/careers/admin/postings/${encodeURIComponent(ref)}/`)
  },
  listApplications(params?: { career_posting_id?: number; status?: string }) {
    return client.get<{ results: CareerApplicationRow[] }>('/careers/admin/applications/', { params })
  },
  updateApplication(ref: string, data: { status?: string; notes?: string }) {
    return client.patch<CareerApplicationRow>(`/careers/admin/applications/${encodeURIComponent(ref)}/`, data)
  },
}
