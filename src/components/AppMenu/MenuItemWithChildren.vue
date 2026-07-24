<template>
  <li :class="className">
    <a
      class="menu-arrow"
      :class="`${isVisible && 'active'} ${linkClassName}`"
      role="button"
      :aria-expanded="isVisible"
      @click.prevent="toggleOpen"
    >
      <span v-if="item.icon" class="nav-icon">
        <Icon :icon="item.icon" />
      </span>
      <span class="nav-text">{{ menuLabel }}</span>
      <span v-if="item.badge" :class="`badge badge-pill text-end bg-${item.badge.variant}`">{{ item.badge.text }}</span>
    </a>
    <b-collapse :id="`menu-${item.key}`" v-model="isVisible">
      <ul :class="subMenuClassName">
        <template v-for="(link, idx) in item.children || []" :key="link.key || idx">
          <MenuItemWithChildren
            v-if="link.children"
            :item="link"
            className="sub-nav-item"
            subMenuClassName="nav sub-navbar-nav"
            linkClassName="sub-nav-link"
          />
          <MenuItem v-else :item="link" className="sub-nav-item" linkClassName="sub-nav-link" />
        </template>
      </ul>
    </b-collapse>
  </li>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MenuItem from '@/components/AppMenu/MenuItem.vue'
import type { MenuItemType, SubMenus } from '@/types/menu'
import { Icon } from '@iconify/vue'

const props = withDefaults(defineProps<SubMenus & { topLevel?: boolean }>(), {
  topLevel: false,
})

const route = useRoute()
const { t } = useI18n()
const menuLabel = computed(() => {
  const key = 'menu.' + props.item.key
  const translated = t(key)
  return translated && translated !== key ? translated : props.item.label
})

type AccordionCtl = {
  openKey: Ref<string>
  setOpen: (key: string | null) => void
}

const accordion = inject<AccordionCtl | null>('adminNavAccordion', null)

function routeInTree(item: MenuItemType, name: string | symbol | null | undefined): boolean {
  if (!name) return false
  if (item.route?.name === name) return true
  return (item.children || []).some((c) => routeInTree(c, name))
}

const isParentActive = computed(() => routeInTree(props.item, route.name))

/** Nested groups keep local expand state; top-level hubs use exclusive accordion. */
const localOpen = ref(false)

const isVisible = computed({
  get() {
    if (props.topLevel && accordion) {
      return accordion.openKey.value === props.item.key
    }
    return localOpen.value
  },
  set(v: boolean) {
    if (props.topLevel && accordion) {
      accordion.setOpen(v ? props.item.key : null)
    } else {
      localOpen.value = v
    }
  },
})

watch(
  isParentActive,
  (active) => {
    if (!active) return
    if (props.topLevel && accordion) {
      accordion.setOpen(props.item.key)
    } else {
      localOpen.value = true
    }
  },
  { immediate: true },
)

function toggleOpen() {
  isVisible.value = !isVisible.value
}
</script>
