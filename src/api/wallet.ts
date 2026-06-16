/**
 * KKOO Wallet API — in-app digital wallet for frictionless payments
 * Docs: https://kkooapp-backend-fiber/docs/INTEGRATION.md#8-kkoo-wallet
 */
import client from './client'
import type { KkooWallet, WalletTransaction } from '../types/wallet'

// User wallet endpoints
export async function getWalletBalance(): Promise<KkooWallet> {
  return client.get('/wallet/').then((r) => r.data)
}

export async function depositToWallet(amount: number): Promise<{
  deposit_url?: string
  payment_ref?: string
  message: string
}> {
  return client.post('/wallet/deposit/', { amount }).then((r) => r.data)
}

export async function withdrawFromWallet(amount: number): Promise<{
  withdrawal_id: number
  status: string
  message: string
}> {
  return client.post('/wallet/withdraw/', { amount }).then((r) => r.data)
}

export async function getWalletTransactions(params?: {
  page?: number
  page_size?: number
  type?: string
}): Promise<{ results: WalletTransaction[]; total: number; page: number }> {
  return client.get('/wallet/transactions/', { params }).then((r) => r.data)
}

// Admin endpoints
export async function adminListWallets(params?: {
  page?: number
  page_size?: number
}): Promise<{ results: KkooWallet[]; total: number }> {
  return client.get('/admin/wallets/', { params }).then((r) => r.data)
}

export async function adminCreditWallet(data: {
  user_id: number
  amount: number
  reason?: string
}): Promise<WalletTransaction> {
  return client.post('/admin/wallet/credit/', data).then((r) => r.data)
}

export async function adminFreezeWallet(data: {
  user_id: number
  reason?: string
}): Promise<{ message: string }> {
  return client.post('/admin/wallet/freeze/', data).then((r) => r.data)
}
