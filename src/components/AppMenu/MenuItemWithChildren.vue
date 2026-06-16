<template>
  <li :class="className">
    <a
      class="menu-arrow"
      :class="`${isVisible && 'active'} ${linkClassName}`"
      role="button"
      @click="toggleOpen"
    >
      <span v-if="item.icon" class="nav-icon">
        <Icon :icon="item.icon" />
      </span>
      <span class="nav-text">{{ menuLabel }}</span>
      <span v-if="item.badge" :class="`badge badge-pill text-end bg-${item.badge.variant}`">{{ item.badge.text }}</span>
    </a>
    <b-collapse :id="`menu-${item.key}`" v-model="isVisible">
      <ul :class="subMenuClassName">
        <template v-for="(link, idx) in item.children || []" :key="idx">
          <MenuItemWithChildren v-if="link.children" :item="link" className="sub-nav-item" subMenuClassName="nav sub-navbar-nav" linkClassName="sub-nav-link" />
          <MenuItem v-else :item="link" className="sub-nav-item" linkClassName="sub-nav-link" />
        </template>
      </ul>
    </b-collapse>
  </li>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MenuItem from '@/components/AppMenu/MenuItem.vue'
import type { SubMenus } from '@/types/menu'
import { Icon } from '@iconify/vue'

const props = defineProps<SubMenus>()
const route = useRoute()
const { t } = useI18n()
const menuLabel = computed(() => {
  const key = 'menu.' + props.item.key
  const translated = t(key)
  return translated && translated !== key ? translated : props.item.label
})

const isOpen = ref(false)
const isParentActive = computed(() => {
  const name = route.name
  if (!name) return false
  const children = props.item.children || []
  return children.some((c) => c.route?.name === name)
})
const isVisible = ref(false)
watch(isParentActive, (v) => { isVisible.value = v }, { immediate: true })
function toggleOpen() { isVisible.value = !isVisible.value }
</script>
