import client from './client'

export type PartnerRecord = {
  id: number
  uuid?: string
  company_name: string
  status?: string
}

export type PartnerOAuthClientResponse = {
  client_id: string
  client_secret: string
  name: string
  redirect_uris: string[]
  scopes: string[]
  warning?: string
}

export const partnersAdminApi = {
  listPartners() {
    return client.get<{ results: PartnerRecord[] }>('/partners/admin/partners/')
  },
  createOAuthClient(payload: {
    partner_id: number
    name?: string
    redirect_uris: string[]
    scopes?: string[]
  }) {
    return client.post<PartnerOAuthClientResponse>('/partners/admin/oauth-clients/', payload)
  },
}
