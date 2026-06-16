<template>
  <template v-if="item.disabled">
    <span :class="[linkClassName, 'nav-link-disabled']">
      <span v-if="item.icon" class="nav-icon">
        <Icon :icon="item.icon" />
      </span>
      <span class="nav-text">{{ menuLabel }}</span>
      <b-badge v-if="item.badge" :variant="null" class="text-end" :class="`bg-${item.badge.variant}`">
        {{ item.badge.text }}
      </b-badge>
    </span>
  </template>
  <router-link
    v-else-if="item.route?.name"
    :class="[currentRouteName === item.route?.name ? 'active' : '', linkClassName]"
    :to="{ name: item.route.name, params: item.route?.params }"
  >
    <span v-if="item.icon" class="nav-icon">
      <Icon :icon="item.icon" />
    </span>
    <span class="nav-text">{{ menuLabel }}</span>
    <b-badge v-if="item.badge" :variant="null" class="text-end" :class="`bg-${item.badge.variant}`">
      {{ item.badge.text }}
    </b-badge>
  </router-link>
  <a v-else-if="item.url" :href="item.url" :class="linkClassName" :target="item.target || '_self'">
    <span v-if="item.icon" class="nav-icon">
      <Icon :icon="item.icon" />
    </span>
    <span class="nav-text">{{ menuLabel }}</span>
  </a>
</template>

<script setup lang="ts">
import type { SubMenus } from '@/types/menu'
import { Icon } from '@iconify/vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const props = defineProps<SubMenus>()
const route = useRoute()
const { t } = useI18n()
const currentRouteName = computed(() => route.name)
const linkClassName = computed(() => props.linkClassName ?? props.className ?? '')
const menuLabel = computed(() => {
  const key = 'menu.' + props.item.key
  const translated = t(key)
  return translated && translated !== key ? translated : props.item.label
})
</script>

<style scoped>
.nav-link-disabled {
  cursor: not-allowed;
  pointer-events: none;
  opacity: 0.65;
}
</style>
