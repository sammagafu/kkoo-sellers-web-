/**
 * Group Orders API — friends build a shared cart using a share code
 * Docs: https://kkooapp-backend-fiber/docs/INTEGRATION.md#12-group-orders
 */
import client from './client'
import type {
  GroupOrder,
  GroupOrderDetail,
  GroupOrderCreatePayload,
} from '../types/groupOrders'

export async function createGroupOrder(
  data: GroupOrderCreatePayload
): Promise<GroupOrder> {
  return client.post('/group-orders/', data).then((r) => r.data)
}

export async function joinGroupOrder(data: {
  share_code: string
  guest_name?: string
}): Promise<GroupOrderDetail> {
  return client.post('/group-orders/join/', data).then((r) => r.data)
}

/** Fiber returns `{ group_order, members, items, seconds_remaining }`. */
function unwrapGroupOrderDetail(data: unknown): GroupOrderDetail {
  if (data && typeof data === 'object' && 'group_order' in data) {
    const raw = data as {
      group_order: GroupOrder
      members?: GroupOrderDetail['members']
      items?: GroupOrderDetail['items']
      seconds_remaining?: number
    }
    return {
      ...raw.group_order,
      members: raw.members ?? [],
      items: raw.items ?? [],
      seconds_remaining: raw.seconds_remaining,
    }
  }
  return data as GroupOrderDetail
}

export async function getGroupOrder(shareCode: string): Promise<GroupOrderDetail> {
  const code = encodeURIComponent(shareCode.trim())
  return client
    .get(`/group-orders/${code}/`)
    .then((r) => unwrapGroupOrderDetail(r.data))
}

export async function addGroupOrderItem(
  shareCode: string,
  data: {
    product_id: number
    quantity: number
    unit_price: number
    notes?: string
  }
): Promise<{ item_id: number; message: string }> {
  return client
    .post(`/group-orders/${shareCode}/items/`, data)
    .then((r) => r.data)
}

export async function removeGroupOrderItem(
  shareCode: string,
  itemId: number
): Promise<{ message: string }> {
  return client
    .delete(`/group-orders/${shareCode}/items/${itemId}/`)
    .then((r) => r.data)
}

export async function lockGroupOrder(shareCode: string): Promise<{
  message: string
}> {
  return client.post(`/group-orders/${shareCode}/lock/`, {}).then((r) => r.data)
}

export async function listMyGroupOrders(): Promise<{
  results: GroupOrder[]
  total: number
}> {
  const data = await client.get('/group-orders/mine/').then((r) => r.data)
  if (Array.isArray(data)) {
    return { results: data as GroupOrder[], total: data.length }
  }
  const results = (data?.results ?? []) as GroupOrder[]
  return { results, total: Number(data?.total ?? results.length) }
}
