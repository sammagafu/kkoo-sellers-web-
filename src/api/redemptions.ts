import client from './client'

export const redemptionsAdminApi = {
  list(params?: { status?: string; page?: number; page_size?: number }) {
    return client.get('/users/admin/redemptions/', { params })
  },
  get(id: number) {
    return client.get(`/users/admin/redemptions/${id}/`)
  },
  approve(id: number, data?: { admin_notes?: string }) {
    return client.post(`/users/admin/redemptions/${id}/approve/`, data)
  },
  reject(id: number, data?: { admin_notes?: string }) {
    return client.post(`/users/admin/redemptions/${id}/reject/`, data)
  },
  complete(id: number, data?: { admin_notes?: string }) {
    return client.post(`/users/admin/redemptions/${id}/complete/`, data)
  },
}
