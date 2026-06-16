<template>
  <component
    :is="AsyncApexChart"
    :height="chart.height"
    :type="chart.type"
    :series="chart.series"
    :options="chart.options"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent, type PropType } from 'vue'
import type {ApexChartType} from '@/types'

import 'apexcharts/dist/apexcharts.css'

const AsyncApexChart = defineAsyncComponent({
  loader: () => import('vue3-apexcharts').then((module) => module.default),
  suspensible: false
})

defineProps({
  chart: {
    type: Object as PropType<ApexChartType>,
    required: true
  }
})
</script>
