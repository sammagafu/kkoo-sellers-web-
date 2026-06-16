import client from './client'

export const documentTypesAdminApi = {
  list(params?: { role?: string; active?: boolean }) {
    return client.get('/users/admin/document-types/', { params })
  },
  create(data: Record<string, unknown>) {
    return client.post('/users/admin/document-types/', data)
  },
  patch(id: number, data: Record<string, unknown>) {
    return client.patch(`/users/admin/document-types/${id}/`, data)
  },
}

export const documentRequirementsAdminApi = {
  list(params?: { role?: string; country_code?: string }) {
    return client.get('/users/admin/document-requirements/', { params })
  },
  create(data: Record<string, unknown>) {
    return client.post('/users/admin/document-requirements/', data)
  },
  patch(id: number, data: Record<string, unknown>) {
    return client.patch(`/users/admin/document-requirements/${id}/`, data)
  },
  remove(id: number) {
    return client.delete(`/users/admin/document-requirements/${id}/`)
  },
}

export const documentRequirementsPublicApi = {
  list(params: { role: string; country_code?: string }) {
    return client.get('/users/document-requirements/', { params })
  },
  status(params: { role: string; country_code?: string }) {
    return client.get('/users/document-requirements/status/', { params })
  },
}

