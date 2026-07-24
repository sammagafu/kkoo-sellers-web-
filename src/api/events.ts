import client from './client'

export type PlatformEventRow = {
  id: number
  uuid?: string
  title: string
  slug: string
  summary?: string
  description?: string
  category?: string
  venue_name?: string
  city?: string
  starts_at: string
  ends_at?: string
  status?: string
  organizer_name?: string
  is_featured?: boolean
}

export const discoverEventsAdminApi = {
  list(params?: { status?: string }) {
    return client.get<{ results: PlatformEventRow[] }>('/discover/admin/events/', { params })
  },
  create(data: Record<string, unknown>) {
    return client.post<PlatformEventRow>('/discover/admin/events/', data)
  },
  update(ref: string, data: Record<string, unknown>) {
    return client.patch<PlatformEventRow>(`/discover/admin/events/${encodeURIComponent(ref)}/`, data)
  },
  createTicketClass(ref: string, data: Record<string, unknown>) {
    return client.post(`/discover/admin/events/${encodeURIComponent(ref)}/ticket-classes/`, data)
  },
  checkIn(ticket_code: string) {
    return client.post<{ message?: string; attendance_points_awarded?: number }>('/discover/admin/tickets/check-in/', {
      ticket_code,
    })
  },
}

export const discoverEventsPublicApi = {
  list(params?: { city?: string; category?: string; featured?: boolean }) {
    return client.get<{ results: PlatformEventRow[] }>('/discover/events/', {
      params: {
        ...(params?.city ? { city: params.city } : {}),
        ...(params?.category ? { category: params.category } : {}),
        ...(params?.featured ? { featured: '1' } : {}),
      },
    })
  },
}
