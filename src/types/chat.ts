export interface Conversation {
  id: number
  user_id: number
  other_user_id: number
  other_user_display_name: string
  other_user_avatar?: string
  last_message?: string
  last_message_at?: string
  unread_count: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  text: string
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

export interface SSEMessage {
  event: 'message' | 'read' | 'typing' | 'error'
  data: Partial<Message> | { message: string }
}
