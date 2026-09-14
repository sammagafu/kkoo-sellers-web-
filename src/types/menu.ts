import type {RouteType} from '@/types/index'

/** Seller business types used by product create/edit copy. */
export type SellerMenuVertical =
    | 'marketplace'
    | 'grocery'
    | 'restaurant'
    | 'hotel'
    | 'pharmacy'

export type MenuItemType = {
    key: string
    label: string
    isTitle?: boolean
    icon?: string
    route?: RouteType
    url?: string
    badge?: {
        variant: string
        text: string
    }
    parentKey?: string
    target?: string
    disabled?: boolean
    children?: MenuItemType[]
}

export type SubMenus = {
    item: MenuItemType
    linkClassName?: string
    subMenuClassName?: string
    activeMenuItems?: Array<string>
    toggleMenu?: (item: MenuItemType, status: boolean) => void
    className?: string
}
