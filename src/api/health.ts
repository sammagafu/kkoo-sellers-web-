import client from './client'

/** API.md: GET /health or GET /api/v1/health returns { status: "ok" }. Optional ?db=1 checks database (503 if unhealthy). */
export const healthApi = {
  getHealth(params?: { db?: number }) {
    return client.get<{ status?: string; error?: string }>('/health', { params })
  },
}
