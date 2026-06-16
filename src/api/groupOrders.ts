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

export async function getGroupOrder(shareCode: string): Promise<GroupOrderDetail> {
  return client.get(`/group-orders/${shareCode}/`).then((r) => r.data)
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

export async function listMyGroupOrders(params?: {
  page?: number
  page_size?: number
}): Promise<{ results: GroupOrder[]; total: number }> {
  return client.get('/group-orders/mine/', { params }).then((r) => r.data)
}
