<template>
  <ul class="navbar-nav">
    <template v-for="(item, idx) in menuItems || []" :key="item.key || idx">
      <li v-if="item.isTitle" class="menu-title" :class="idx && 'mt-2'">{{ titleLabel(item) }}</li>
      <template v-else>
        <MenuItemWithChildren
          v-if="item.children"
          :item="item"
          top-level
          className="nav-item"
          linkClassName="nav-link"
          subMenuClassName="nav sub-navbar-nav"
        />
        <MenuItem v-else :item="item" linkClassName="nav-link" className="nav-item" />
      </template>
    </template>
  </ul>
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import type { MenuItemType } from '@/types/menu'
import { useI18n } from 'vue-i18n'
import MenuItemWithChildren from '@/components/AppMenu/MenuItemWithChildren.vue'
import MenuItem from '@/components/AppMenu/MenuItem.vue'

const STORAGE_KEY = 'kkoo-admin-nav-open'

type AppMenuProps = {
  menuItems: Array<MenuItemType>
}

defineProps<AppMenuProps>()

const { t } = useI18n()
function titleLabel(item: MenuItemType) {
  const key = 'menu.' + item.key
  const translated = t(key)
  return translated && translated !== key ? translated : item.label
}

function readStoredHub(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

const openKey = ref(readStoredHub())

function setOpen(key: string | null) {
  openKey.value = key || ''
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore quota / private mode */
  }
}

watch(openKey, (k) => {
  if (!k) return
  try {
    localStorage.setItem(STORAGE_KEY, k)
  } catch {
    /* ignore */
  }
})

provide('adminNavAccordion', { openKey, setOpen })
</script>
