<template>
  <div class="chat-interface">
    <!-- Header -->
    <div class="header-section mb-4">
      <h2 class="mb-2">💬 Chat & Messaging Platform</h2>
      <p class="text-muted">Real-time support and user communications</p>
    </div>

    <!-- Stats Row -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="stat-card card shadow-sm bg-primary text-white">
          <div class="card-body">
            <small>Active Conversations</small>
            <h3 class="mt-2">{{ activeConversations }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card card shadow-sm bg-success text-white">
          <div class="card-body">
            <small>Unread Messages</small>
            <h3 class="mt-2">{{ unreadCount }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card card shadow-sm bg-warning text-dark">
          <div class="card-body">
            <small>Avg Response Time</small>
            <h3 class="mt-2">{{ avgResponseTime }}m</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card card shadow-sm bg-info text-white">
          <div class="card-body">
            <small>Satisfaction Rate</small>
            <h3 class="mt-2">{{ satisfactionRate }}%</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Chat Interface -->
    <div class="row g-3">
      <!-- Conversations List -->
      <div class="col-md-4">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-light">
            <input
              v-model="searchConversation"
              type="text"
              class="form-control form-control-sm"
              placeholder="Search conversations..."
            />
          </div>
          <div class="conversation-list" style="max-height: 600px; overflow-y: auto">
            <div
              v-for="conv in filteredConversations"
              :key="conv.id"
              class="conversation-item p-3 border-bottom cursor-pointer"
              :class="{ 'bg-light': selectedConversation?.id === conv.id }"
              @click="selectConversation(conv)"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <strong>{{ conv.user_name }}</strong><br />
                  <small class="text-muted">{{ conv.user_phone }}</small>
                </div>
                <span
                  v-if="conv.unread_count > 0"
                  class="badge bg-danger"
                  >{{ conv.unread_count }}</span
                >
              </div>
              <small class="d-block mt-2">{{ conv.last_message }}</small>
              <small class="text-muted">{{ formatTime(conv.last_message_time) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Window -->
      <div class="col-md-8">
        <div class="card shadow-sm h-100">
          <div v-if="selectedConversation" class="d-flex flex-column h-100">
            <!-- Chat Header -->
            <div class="card-header bg-light">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-0">{{ selectedConversation.user_name }}</h5>
                  <small class="text-muted">{{ selectedConversation.user_phone }}</small>
                </div>
                <div>
                  <button class="btn btn-sm btn-outline-secondary me-2">
                    📞 Call
                  </button>
                  <button class="btn btn-sm btn-outline-secondary">
                    ℹ️ Info
                  </button>
                </div>
              </div>
            </div>

            <!-- Messages Thread -->
            <div class="messages-container flex-grow-1 p-3" style="overflow-y: auto">
              <div v-for="msg in selectedConversation.messages" :key="msg.id" class="mb-3">
                <div
                  class="d-flex"
                  :class="{ 'justify-content-end': msg.sender === 'admin', 'justify-content-start': msg.sender === 'user' }"
                >
                  <div
                    class="message-bubble p-2 rounded"
                    :class="{ 'bg-primary text-white': msg.sender === 'admin', 'bg-light': msg.sender === 'user' }"
                    style="max-width: 70%"
                  >
                    <p class="mb-1">{{ msg.content }}</p>
                    <small class="opacity-75">{{ formatTime(msg.timestamp) }}</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message Input -->
            <div class="card-footer bg-light">
              <div class="input-group">
                <input
                  v-model="newMessage"
                  type="text"
                  class="form-control"
                  placeholder="Type your message..."
                  @keyup.enter="sendMessage"
                />
                <button class="btn btn-primary" @click="sendMessage">
                  Send
                </button>
              </div>
            </div>
          </div>
          <div v-else class="card-body d-flex align-items-center justify-content-center" style="height: 600px">
            <p class="text-muted">Select a conversation to start chatting</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Broadcast Messages Section -->
    <div class="row mt-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-light">
            <h5 class="mb-0">📢 Broadcast Messages</h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-9">
                <textarea
                  v-model="broadcastMessage"
                  class="form-control"
                  placeholder="Compose message to send to all users..."
                  rows="3"
                ></textarea>
              </div>
              <div class="col-md-3">
                <button class="btn btn-warning w-100 mb-2">
                  📝 Save as Template
                </button>
                <button class="btn btn-success w-100" @click="sendBroadcast">
                  📢 Send to All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Message {
  id: number
  content: string
  sender: 'user' | 'admin'
  timestamp: string
}

interface Conversation {
  id: number
  user_name: string
  user_phone: string
  last_message: string
  last_message_time: string
  unread_count: number
  messages: Message[]
}

const conversations = ref<Conversation[]>([
  {
    id: 1,
    user_name: 'John Doe',
    user_phone: '+255712999001',
    last_message: 'Thanks for the help!',
    last_message_time: '2026-03-30T14:30:00Z',
    unread_count: 0,
    messages: [
      { id: 1, content: 'Hi, I have a question about my order', sender: 'user', timestamp: '2026-03-30T14:15:00Z' },
      { id: 2, content: 'Hello! How can I help you?', sender: 'admin', timestamp: '2026-03-30T14:16:00Z' },
      { id: 3, content: 'Thanks for the help!', sender: 'user', timestamp: '2026-03-30T14:30:00Z' }
    ]
  },
  {
    id: 2,
    user_name: 'Alice Smith',
    user_phone: '+255715234567',
    last_message: 'When will my delivery arrive?',
    last_message_time: '2026-03-30T13:45:00Z',
    unread_count: 2,
    messages: [
      { id: 4, content: 'When will my delivery arrive?', sender: 'user', timestamp: '2026-03-30T13:45:00Z' }
    ]
  }
])

const selectedConversation = ref<Conversation | null>(null)
const searchConversation = ref('')
const newMessage = ref('')
const broadcastMessage = ref('')

const filteredConversations = computed(() => {
  if (!searchConversation.value) return conversations.value
  return conversations.value.filter(
    conv =>
      conv.user_name.toLowerCase().includes(searchConversation.value.toLowerCase()) ||
      conv.user_phone.includes(searchConversation.value)
  )
})

const activeConversations = computed(() => conversations.value.length)
const unreadCount = computed(
  () =>
    conversations.value.reduce((sum, conv) => sum + conv.unread_count, 0)
)
const avgResponseTime = computed(() => 2)
const satisfactionRate = computed(() => 96)

const formatTime = (date: string) => {
  const d = new Date(date)
  return d.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })
}

const selectConversation = (conv: Conversation) => {
  selectedConversation.value = conv
  conv.unread_count = 0 // Mark as read
}

const sendMessage = async () => {
  if (!newMessage.value || !selectedConversation.value) return

  const msg: Message = {
    id: (selectedConversation.value.messages?.length || 0) + 1,
    content: newMessage.value,
    sender: 'admin',
    timestamp: new Date().toISOString()
  }

  selectedConversation.value.messages.push(msg)
  selectedConversation.value.last_message = newMessage.value
  selectedConversation.value.last_message_time = new Date().toISOString()

  newMessage.value = ''
}

const sendBroadcast = () => {
  if (!broadcastMessage.value) return
  alert('Broadcast message sent to all users')
  broadcastMessage.value = ''
}

onMounted(() => {
  console.log('Chat interface loaded')
})
</script>

<style scoped>
.chat-interface {
  padding: 1.5rem 0;
}

.conversation-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background-color: #f8f9fa;
}

.message-bubble {
  word-break: break-word;
}

.messages-container {
  background-color: #f8f9fa;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
