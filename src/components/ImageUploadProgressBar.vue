<template>
  <div v-if="visible" class="image-upload-progress border rounded-3 p-3 bg-body-secondary bg-opacity-50 mb-3">
    <div class="small text-muted mb-2">{{ subtitle }}</div>
    <b-progress :max="100" class="mb-0" style="height: 10px">
      <b-progress-bar
        :value="barValue"
        variant="success"
        :striped="pulseStriped"
        :animated="pulseStriped"
      />
    </b-progress>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  subtitle: string
  percent: number
  pulseStriped?: boolean
}>()

const barValue = computed(() => Math.max(0, Math.min(100, Math.round(props.percent))))
</script>
