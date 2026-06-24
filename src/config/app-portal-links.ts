/**
 * Cross-portal URLs — buyer marketing, biz seller tools, admin panel.
 * Resolves via cross-app-links (localhost ports or production subdomains).
 */
import { adminWebPath, bizWebPath, buyerWebPath } from '@/config/cross-app-links'

export const buyerShopUrl = buyerWebPath('/')
export const buyerAccountUrl = buyerWebPath('/account')
export const buyerBusinessUrl = buyerWebPath('/business')
export const buyerMerchantUrl = buyerWebPath('/merchant')
export const buyerMarketplaceUrl = buyerWebPath('/marketplace')

export const bizSellerDashboardUrl = bizWebPath('/seller')
export const bizCrmUrl = bizWebPath('/seller/crm')
export const bizSellerRegisterUrl = bizWebPath('/join')
export const bizSignInUrl = bizWebPath('/auth/sign-in')
export const bizSellerAccountUrl = bizWebPath('/account')

export const adminDashboardUrl = adminWebPath('/dashboard')

export type AppSwitcherItem = {
  key: string
  label: string
  icon: string
  href: string
}

/** Switch between KKOO web apps from biz, admin, or buyer. */
export const kkooAppSwitcherItems: AppSwitcherItem[] = [
  { key: 'buyer', label: 'KKOO Shop', icon: 'solar:cart-large-2-bold', href: buyerShopUrl },
  { key: 'business', label: 'For business', icon: 'solar:shop-2-bold', href: buyerBusinessUrl },
  { key: 'merchant', label: 'For merchants', icon: 'solar:bag-5-bold', href: buyerMerchantUrl },
  { key: 'seller', label: 'Seller portal', icon: 'solar:widget-5-bold', href: bizSellerDashboardUrl },
  { key: 'seller-account', label: 'Seller account', icon: 'solar:user-circle-bold', href: bizSellerAccountUrl },
  { key: 'crm', label: 'Business CRM', icon: 'solar:buildings-3-bold', href: bizCrmUrl },
  { key: 'admin', label: 'Admin panel', icon: 'solar:shield-user-bold', href: adminDashboardUrl },
]

export const kkooWebFooterLinks: AppSwitcherItem[] = [
  { key: 'shop', label: 'Shop', icon: 'solar:cart-large-2-bold', href: buyerMarketplaceUrl },
  { key: 'business', label: 'Business', icon: 'solar:shop-2-bold', href: buyerBusinessUrl },
  { key: 'merchant', label: 'Merchants', icon: 'solar:bag-5-bold', href: buyerMerchantUrl },
  { key: 'seller', label: 'Seller tools', icon: 'solar:widget-5-bold', href: bizSellerDashboardUrl },
  { key: 'seller-account', label: 'Seller account', icon: 'solar:user-circle-bold', href: bizSellerAccountUrl },
  { key: 'admin', label: 'Admin', icon: 'solar:shield-user-bold', href: adminDashboardUrl },
]
