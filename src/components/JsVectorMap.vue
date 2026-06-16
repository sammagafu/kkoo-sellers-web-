<template>
  <div :id="id" :style="{ width: '100%', height: height + 'px' }"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

type VectorMapPropsType = {
  id: string
  height: number
  options: object
}
const props = defineProps<VectorMapPropsType>()

const loadVectorMapDependencies = async () => {
  const options = props.options as { map?: string }
  const mapName = options.map ?? 'world'

  const loaders: Array<Promise<unknown>> = [import('jsvectormap')]

  if (mapName === 'world') {
    loaders.push(import('jsvectormap/dist/maps/world'))
  } else {
    loaders.push(import('jsvectormap/dist/maps/world-merc'))
  }

  await Promise.all(loaders)
}

onMounted(async () => {
  await loadVectorMapDependencies()
  new (window as any)['jsVectorMap'](props.options)
})
</script>
