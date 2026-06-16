export interface GroupOrderMember {
  id: number
  group_order_id: number
  user_id?: number
  guest_name?: string
  is_creator: boolean
  created_at: string
}

export interface GroupOrderItem {
  id: number
  group_order_id: number
  member_user_id?: number
  member_guest_name?: string
  product_id: number
  sku_id?: number
  quantity: number
  unit_price: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface GroupOrder {
  id: number
  creator_user_id: number
  seller_user_id: number
  share_code: string
  cutoff_at: string
  status: 'open' | 'locked' | 'placed' | 'cancelled'
  order_id?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface GroupOrderDetail extends GroupOrder {
  members?: GroupOrderMember[]
  items?: GroupOrderItem[]
  seconds_remaining?: number
}

export interface GroupOrderCreatePayload {
  seller_user_id: number
  cutoff_at?: string
  notes?: string
}
