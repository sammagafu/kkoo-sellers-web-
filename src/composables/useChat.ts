/**
 * Composable: useChat
 * Manages conversations, messages, and SSE real-time updates
 */
import { ref } from 'vue'
import * as api from '../api/chat'
import type { Conversation, Message } from '../types/chat'
import { readAdminAuthTokens } from '@/utils/adminAuthSessionStorage'

// State
const conversations = ref<{ results: Conversation[]; total: number }>({
  results: [],
  total: 0,
})
const activeConversation = ref<Conversation | null>(null)
const messages = ref<{ results: Message[]; total: number }>({
  results: [],
  total: 0,
})
const isLoading = ref(false)
const isStreamActive = ref(false)
const error = ref<string | null>(null)
let streamController: api.ChatStreamController | null = null
let reconnectTimer: number | null = null
let shouldReconnect = false

/**
 * Fetch conversations list
 */
export async function fetchConversations(page = 1) {
  isLoading.value = true
  error.value = null
  try {
    conversations.value = await api.listConversations({ page, page_size: 20 })
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch conversations'
    console.error('fetchConversations error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Create a new conversation
 */
export async function startConversation(
  otherUserId: number,
  initialMessage?: string
): Promise<Conversation> {
  error.value = null
  try {
    const conv = await api.createConversation({
      other_user_id: otherUserId,
      initial_message: initialMessage,
    })
    // Add to conversations list
    conversations.value.results.unshift(conv)
    activeConversation.value = conv
    // Reset messages for new conversation
    messages.value = { results: [], total: 0 }
    return conv
  } catch (err: any) {
    error.value = err.message || 'Failed to start conversation'
    console.error('startConversation error:', err)
    throw err
  }
}

/**
 * Set active conversation and fetch its messages
 */
export async function selectConversation(conversationId: number) {
  error.value = null
  try {
    // Fetch conversation details
    activeConversation.value = await api.getConversation(conversationId)
    // Fetch messages
    await fetchMessages(conversationId, 1)
    // Start SSE stream for live updates
    startSSEStream(conversationId)
    // Mark as read
    await api.markConversationRead(conversationId)
  } catch (err: any) {
    error.value = err.message || 'Failed to select conversation'
    console.error('selectConversation error:', err)
  }
}

/**
 * Fetch messages for current conversation
 */
export async function fetchMessages(conversationId: number, page = 1) {
  isLoading.value = true
  error.value = null
  try {
    messages.value = await api.listMessages(conversationId, {
      page,
      page_size: 30,
    })
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch messages'
    console.error('fetchMessages error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Send a message to active conversation
 */
export async function sendMessage(text: string): Promise<Message> {
  if (!activeConversation.value) {
    throw new Error('No conversation selected')
  }
  error.value = null
  try {
    const msg = await api.sendMessage({
      conversation_id: activeConversation.value.id,
      text,
    })
    // Append to messages list
    messages.value.results.push(msg)
    return msg
  } catch (err: any) {
    error.value = err.message || 'Failed to send message'
    console.error('sendMessage error:', err)
    throw err
  }
}

/**
 * Start SSE stream for live messages
 */
export function startSSEStream(conversationId: number) {
  // Close existing stream
  stopSSEStream()

  const token = readAdminAuthTokens().access

  if (!token) {
    console.warn('No token available for SSE stream')
    return
  }

  try {
    shouldReconnect = true
    streamController = api.openChatStream(conversationId, token, {
      onOpen: () => {
        isStreamActive.value = true
      },
      onMessage: (data) => {
        if (!data.id) return
        const msgExists = messages.value.results.some((m) => m.id === data.id)
        if (!msgExists) {
          messages.value.results.push(data as Message)
        }
      },
      onError: (streamError) => {
        console.warn('SSE stream error, will retry in 5s', streamError)
        isStreamActive.value = false
        if (streamController) {
          streamController.close()
          streamController = null
        }
        if (shouldReconnect) {
          reconnectTimer = window.setTimeout(() => startSSEStream(conversationId), 5000)
        }
      },
    })
  } catch (err) {
    console.error('Failed to start SSE stream:', err)
    isStreamActive.value = false
  }
}

/**
 * Stop SSE stream
 */
export function stopSSEStream() {
  shouldReconnect = false
  if (reconnectTimer != null) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (streamController) {
    streamController.close()
    streamController = null
  }
  isStreamActive.value = false
}

/**
 * Cleanup on unmount
 */
export function cleanup() {
  stopSSEStream()
}

/**
 * Composable export
 */
export function useChat() {
  return {
    // State
    conversations,
    activeConversation,
    messages,
    isLoading,
    isStreamActive,
    error,
    // Methods
    fetchConversations,
    startConversation,
    selectConversation,
    fetchMessages,
    sendMessage,
    startSSEStream,
    stopSSEStream,
    cleanup,
  }
}
