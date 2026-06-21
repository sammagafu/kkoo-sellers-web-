/**
 * Chat / Messaging API — SSE-based real-time conversations
 * Docs: https://kkooapp-backend-fiber/docs/INTEGRATION.md#17-chat
 */
import client from './client'
import { resolveApiBaseUrl } from '@/utils/apiBaseUrl'
import type { Conversation, Message } from '../types/chat'

export interface ChatStreamController {
  close: () => void
}

export async function createConversation(data: {
  other_user_id: number
  initial_message?: string
}): Promise<Conversation> {
  return client.post('/chat/conversations/', data).then((r) => r.data)
}

export async function listConversations(params?: {
  page?: number
  page_size?: number
  filter?: 'unread' | 'all'
}): Promise<{ results: Conversation[]; total: number }> {
  return client.get('/chat/conversations/', { params }).then((r) => r.data)
}

export async function getConversation(conversationId: number): Promise<Conversation> {
  return client.get(`/chat/conversations/${conversationId}/`).then((r) => r.data)
}

export async function listMessages(
  conversationId: number,
  params?: { page?: number; page_size?: number }
): Promise<{ results: Message[]; total: number }> {
  return client
    .get(`/chat/conversations/${conversationId}/messages/`, { params })
    .then((r) => r.data)
}

export async function sendMessage(data: {
  conversation_id: number
  text: string
}): Promise<Message> {
  return client
    .post(`/chat/conversations/${data.conversation_id}/messages/`, data)
    .then((r) => r.data)
}

export async function markConversationRead(conversationId: number): Promise<{
  message: string
}> {
  return client
    .post(`/chat/conversations/${conversationId}/read/`, {})
    .then((r) => r.data)
}

/**
 * Header-authenticated SSE stream for live messages in a conversation.
 */
export function openChatStream(
  conversationId: number,
  accessToken: string,
  handlers: {
    onMessage: (message: Message) => void
    onError?: (error: unknown) => void
    onOpen?: () => void
  }
): ChatStreamController {
  const baseURL = resolveApiBaseUrl()
  const url = `${baseURL}/chat/conversations/${conversationId}/stream/`
  const controller = new AbortController()
  const decoder = new TextDecoder()
  let closed = false

  void (async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed with status ${response.status}`)
      }

      handlers.onOpen?.()

      const reader = response.body.getReader()
      let buffer = ''

      while (!closed) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const rawEvent of events) {
          const payload = rawEvent
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.replace(/^data:\s?/, ''))
            .join('\n')

          if (!payload) continue
          handlers.onMessage(JSON.parse(payload) as Message)
        }
      }

      if (!closed) {
        handlers.onError?.(new Error('Chat stream closed unexpectedly'))
      }
    } catch (error) {
      if (!closed) handlers.onError?.(error)
    }
  })()

  return {
    close() {
      closed = true
      controller.abort()
    },
  }
}
