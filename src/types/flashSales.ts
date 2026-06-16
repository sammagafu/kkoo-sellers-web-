export interface FlashSaleItem {
  id: number
  flash_sale_id: number
  product_id: number
  sku_id?: number
  discount_percent: number
  sale_price?: number
  original_price: number
  stock_limit: number
  sold_count: number
  display_order: number
}

export interface FlashSale {
  id: number
  name: string
  slug: string
  description?: string
  banner_image?: string
  start_at: string
  end_at: string
  is_active: boolean
  vertical: string
  created_by_id: number
  items?: FlashSaleItem[]
  created_at: string
  updated_at: string
}

export interface FlashSaleCreatePayload {
  name: string
  description?: string
  banner_image?: string
  start_at: string
  end_at: string
  vertical?: string
  is_active?: boolean
}
