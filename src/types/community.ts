export type CommunityFeatureStatus = 'listening' | 'planned' | 'shipped'

export interface CommunityReply {
  id: number
  thread_id: number
  author_name: string
  author_role: string
  body: string
  is_team_reply: boolean
  created_at: string
  updated_at: string
}

export interface CommunityThread {
  id: number
  author_name: string
  author_role: string
  title: string
  body: string
  status: string
  created_at: string
  updated_at: string
  replies: CommunityReply[]
}

export interface CommunityFeatureRequest {
  id: number
  author_name: string
  area: string
  title: string
  summary: string
  status: CommunityFeatureStatus | string
  votes: number
  created_at: string
  updated_at: string
}
