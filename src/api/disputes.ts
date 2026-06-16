import client from './client'

/** Admin disputes. API.md: GET /disputes/admin/ (status, subject_type: order | rider_payment), POST /disputes/:id/resolve/ */
export const disputesAdminApi = {
  list(params?: { page?: number; page_size?: number; status?: string; subject_type?: 'order' | 'rider_payment' }) {
    return client.get<{ results: unknown[] }>('/disputes/admin/', { params })
  },
  resolve(id: number, data: { resolution: string; admin_notes?: string }) {
    return client.post(`/disputes/${id}/resolve/`, data)
  },
}
