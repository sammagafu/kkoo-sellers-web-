<template>
  <VerticalLayout>
    <b-row>
      <b-col>
        <h4 class="mb-1">Notifications</h4>
        <p class="text-muted small mb-3">In-app notifications from the platform.</p>
      </b-col>
      <b-col cols="12" class="d-flex justify-content-end gap-2 mb-3">
        <b-button
          v-if="unreadCount > 0"
          variant="outline-primary"
          size="sm"
          :disabled="markingAll"
          @click="markAllRead"
        >
          Mark all read
        </b-button>
      </b-col>
    </b-row>
    <b-card v-if="loading" class="text-center py-5">
      <b-spinner small class="me-2" />
      Loading…
    </b-card>
    <b-card v-else-if="error" class="border-warning">
      <p class="mb-0 text-warning">{{ error }}</p>
    </b-card>
    <b-list-group v-else-if="items.length" flush>
      <b-list-group-item
        v-for="n in items"
        :key="n.id"
        :class="{ 'bg-light': !n.read_at }"
        class="d-flex align-items-start gap-3 py-3"
        @click="openNotification(n)"
      >
        <span class="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center bg-soft-primary text-primary" style="width: 40px; height: 40px;">
          <Icon icon="solar:bell-bing-broken" class="fs-20" />
        </span>
        <div class="flex-grow-1 min-w-0">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <strong class="text-body">{{ n.title || 'Notification' }}</strong>
            <small class="text-muted flex-shrink-0">{{ formatDate(n.created_at) }}</small>
          </div>
          <p v-if="n.message" class="mb-0 small text-muted">{{ n.message }}</p>
          <div v-if="n.data && (n.data.order_id || n.data.order_number)" class="mt-2">
            <router-link
              v-if="n.data.order_id && isPanelUser"
              :to="orderLink(n)"
              class="btn btn-sm btn-soft-primary"
              @click.stop
            >
              View order
            </router-link>
          </div>
        </div>
      </b-list-group-item>
    </b-list-group>
    <b-card v-else class="text-center py-5 text-muted">
      No notifications yet.
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { notificationsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const error = ref('')
const items = ref<{ id: number; title?: string; message?: string; created_at?: string; read_at?: string | null; data?: Record<string, unknown> }[]>([])
const unreadCount = ref(0)
const markingAll = ref(false)

const isPanelUser = computed(() => auth.isAdminOrStaff || auth.isSeller)

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function orderLink(n: { data?: Record<string, unknown> }) {
  const rawId = n.data?.order_id
  const id = typeof rawId === 'string' || typeof rawId === 'number' ? rawId : undefined
  if (id !== undefined && auth.isSeller) return { name: 'seller.orders.detail', params: { id } }
  if (id !== undefined && auth.isAdminOrStaff) return { name: 'admin.orders.detail', params: { id } }
  return { name: 'dashboards.index' }
}

async function openNotification(n: { id: number; read_at?: string | null }) {
  if (!n.read_at) {
    try {
      await notificationsApi.markRead(n.id)
      n.read_at = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (_) {}
  }
}

async function markAllRead() {
  markingAll.value = true
  try {
    await notificationsApi.markAllRead()
    items.value.forEach((n) => { n.read_at = n.read_at || new Date().toISOString() })
    unreadCount.value = 0
  } catch (_) {
    error.value = 'Failed to mark all as read'
  } finally {
    markingAll.value = false
  }
}

onMounted(async () => {
  try {
    const [listRes, countRes] = await Promise.all([
      notificationsApi.list({ unread_only: false }),
      notificationsApi.getUnreadCount().catch(() => ({ data: { unread_count: 0 } })),
    ])
    const raw = listRes.data
    const list = Array.isArray(raw) ? raw : (raw as { results?: unknown[] })?.results ?? []
    items.value = list as typeof items.value
    unreadCount.value = (countRes.data?.unread_count ?? 0) as number
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } }; message?: string }
    error.value = err.response?.data?.error ?? err.message ?? 'Failed to load notifications'
  } finally {
    loading.value = false
  }
})
</script>
