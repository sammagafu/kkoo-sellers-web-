<template>
  <div class="dashboard-command mb-4">
    <div class="dashboard-command__scene" aria-hidden="true">
      <span class="dashboard-command__aura" />
      <span
        v-for="n in 6"
        :key="n"
        class="dashboard-command__spark"
        :class="`dashboard-command__spark--${n}`"
      />
      <span class="dashboard-command__orb dashboard-command__orb--gold" />
      <span class="dashboard-command__orb dashboard-command__orb--purple" />
    </div>

    <span class="dashboard-command__live">
      <span class="dashboard-command__live-dot" aria-hidden="true" />
      {{ t('dashboardHome.live') }}
    </span>

    <b-row class="dashboard-greeting-row g-0 align-items-center">
      <b-col class="d-flex align-items-center gap-3">
        <div class="dashboard-greeting-avatar flex-shrink-0">
          <img v-if="userAvatar" :src="userAvatar" alt="" class="rounded-circle" width="52" height="52" />
          <div
            v-else
            class="dashboard-greeting-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
          >
            <Icon icon="solar:user-circle-bold-duotone" class="dashboard-greeting-icon" />
          </div>
        </div>
        <div class="flex-grow-1 min-w-0">
          <p class="dashboard-command__eyebrow mb-1">{{ t('auth.brandKicker') }}</p>
          <h5 class="dashboard-greeting-title mb-0">
            {{ timeGreeting }}{{ greetingName ? `, ${greetingName}` : '' }}
          </h5>
          <p class="dashboard-greeting-subtitle mb-0">{{ tagline }}</p>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'

type Props = {
  greetingName?: string
  userAvatar?: string
}

withDefaults(defineProps<Props>(), {
  greetingName: '',
  userAvatar: '',
})

const { t } = useI18n()

const taglineKeys = [
  'dashboardHome.tagline1',
  'dashboardHome.tagline2',
  'dashboardHome.tagline3',
  'dashboardHome.tagline4',
] as const

const tagline = ref('')

const timeGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return t('dashboardHome.goodMorning')
  if (hour < 17) return t('dashboardHome.goodAfternoon')
  return t('dashboardHome.goodEvening')
})

onMounted(() => {
  const key = taglineKeys[Math.floor(Math.random() * taglineKeys.length)]
  tagline.value = t(key)
})
</script>
