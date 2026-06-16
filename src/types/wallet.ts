export interface KkooWallet {
  id: number
  user_id: number
  balance: number
  currency: string
  is_active: boolean
  is_frozen: boolean
  freeze_reason?: string
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: number
  wallet_id: number
  user_id: number
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'cashback' | 'bonus'
  amount: number
  balance_after: number
  reference?: string
  description?: string
  order_id?: number
  status: 'completed' | 'pending' | 'failed' | 'reversed'
  initiated_by?: number
  created_at: string
}
