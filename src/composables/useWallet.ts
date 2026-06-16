/**
 * Composable: useWallet
 * Manages wallet balance, transactions, and deposit/withdrawal operations
 */
import { ref } from 'vue'
import * as api from '../api/wallet'
import type { KkooWallet, WalletTransaction } from '../types/wallet'

// State
const wallet = ref<KkooWallet | null>(null)
const transactions = ref<{ results: WalletTransaction[]; total: number; page: number }>({
  results: [],
  total: 0,
  page: 1,
})
const isLoading = ref(false)
const error = ref<string | null>(null)

/**
 * Fetch wallet balance
 */
export async function fetchWalletBalance() {
  isLoading.value = true
  error.value = null
  try {
    wallet.value = await api.getWalletBalance()
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch wallet'
    console.error('fetchWalletBalance error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Initiate wallet deposit (via Selcom)
 */
export async function deposit(amount: number) {
  error.value = null
  try {
    const result = await api.depositToWallet(amount)
    // Refresh wallet balance after deposit
    await fetchWalletBalance()
    return result
  } catch (err: any) {
    error.value = err.message || 'Failed to initiate deposit'
    console.error('deposit error:', err)
    throw err
  }
}

/**
 * Withdraw from wallet
 */
export async function withdraw(amount: number) {
  error.value = null
  try {
    const result = await api.withdrawFromWallet(amount)
    // Refresh wallet balance after withdrawal
    await fetchWalletBalance()
    return result
  } catch (err: any) {
    error.value = err.message || 'Failed to initiate withdrawal'
    console.error('withdraw error:', err)
    throw err
  }
}

/**
 * Fetch transaction history (paginated)
 */
export async function fetchTransactions(page = 1, type?: string) {
  isLoading.value = true
  error.value = null
  try {
    transactions.value = await api.getWalletTransactions({ page, page_size: 20, type })
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch transactions'
    console.error('fetchTransactions error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Composable export
 */
export function useWallet() {
  return {
    // State
    wallet,
    transactions,
    isLoading,
    error,
    // Methods
    fetchWalletBalance,
    deposit,
    withdraw,
    fetchTransactions,
  }
}
