import client from './client'
import type { CommunityFeatureRequest, CommunityReply, CommunityThread } from '@/types/community'

export async function listCommunityThreads(): Promise<{ results: CommunityThread[] }> {
  return client.get('/community/threads/').then((response) => response.data)
}

export async function createCommunityThread(data: {
  name?: string
  role?: string
  title: string
  body: string
}): Promise<CommunityThread> {
  return client.post('/community/threads/', data).then((response) => response.data)
}

export async function createCommunityReply(
  threadId: number,
  data: {
    name?: string
    role?: string
    body: string
  }
): Promise<CommunityReply> {
  return client.post(`/community/threads/${threadId}/replies/`, data).then((response) => response.data)
}

export async function listCommunityFeatureRequests(): Promise<{ results: CommunityFeatureRequest[] }> {
  return client.get('/community/feature-requests/').then((response) => response.data)
}

export async function createCommunityFeatureRequest(data: {
  name?: string
  area?: string
  title: string
  summary: string
}): Promise<CommunityFeatureRequest> {
  return client.post('/community/feature-requests/', data).then((response) => response.data)
}

export async function supportCommunityFeatureRequest(featureRequestId: number): Promise<CommunityFeatureRequest> {
  return client.post(`/community/feature-requests/${featureRequestId}/support/`).then((response) => response.data)
}
