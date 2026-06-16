import client from './client'

export const weeklyPassApi = {
  // Buyer/user endpoints (auth required)
  getActive() {
    return client.get('/weekly-pass/active/')
  },
  claim(id: number) {
    return client.post(`/weekly-pass/${id}/claim/`, {})
  },

  // Admin endpoints
  adminList() {
    return client.get('/admin/weekly-pass/')
  },
  adminGet(id: number) {
    return client.get(`/admin/weekly-pass/${id}/`)
  },
  adminCreate(data: {
    title: string
    description?: string
    start_at: string
    end_at: string
    is_active?: boolean
    reward_type?: string
    reward_value?: number
  }) {
    return client.post('/admin/weekly-pass/', data)
  },
  adminPatch(id: number, data: Record<string, unknown>) {
    return client.patch(`/admin/weekly-pass/${id}/`, data)
  },
  adminDelete(id: number) {
    return client.delete(`/admin/weekly-pass/${id}/`)
  },
  adminAddTask(passId: number, data: {
    title: string
    description?: string
    task_type: string
    target_count?: number
    is_required?: boolean
    sort_order?: number
    meta?: unknown
  }) {
    return client.post(`/admin/weekly-pass/${passId}/tasks/`, data)
  },
  adminPatchTask(passId: number, taskId: number, data: Record<string, unknown>) {
    return client.patch(`/admin/weekly-pass/${passId}/tasks/${taskId}/`, data)
  },
  adminDeleteTask(passId: number, taskId: number) {
    return client.delete(`/admin/weekly-pass/${passId}/tasks/${taskId}/`)
  },
  adminLeaderboard(passId: number, params?: { limit?: number }) {
    return client.get(`/admin/weekly-pass/${passId}/leaderboard/`, { params })
  },
}

