<template>
  <img
    v-if="resolvedSrc"
    :src="resolvedSrc"
    :srcset="resolvedSrcset"
    :sizes="resolvedSizes"
    :alt="alt"
    :loading="resolvedLoading"
    :decoding="decoding"
    :fetchpriority="resolvedPriority"
    :width="width"
    :height="height"
    :class="imgClass"
    @error="emit('error', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  mediaSizes,
  mediaSrcset,
  sizedAssetUrl,
  type MediaImageSlot,
} from '@/utils/assetUrl'

const props = withDefaults(
  defineProps<{
    src?: string | null
    mediaSlot?: MediaImageSlot
    alt?: string
    sizes?: string
    loading?: 'lazy' | 'eager'
    decoding?: 'async' | 'sync' | 'auto'
    fetchpriority?: 'high' | 'low' | 'auto'
    width?: number | string
    height?: number | string
    imgClass?: string
    lcp?: boolean
  }>(),
  {
    mediaSlot: 'card',
    alt: '',
    loading: 'lazy',
    decoding: 'async',
    fetchpriority: 'auto',
    lcp: false,
  },
)

const emit = defineEmits<{ error: [Event] }>()

const activeSlot = computed<MediaImageSlot>(() => (props.lcp ? 'detail' : props.mediaSlot))
const resolvedSrc = computed(() => sizedAssetUrl(props.src, activeSlot.value))
const resolvedSrcset = computed(() =>
  activeSlot.value === 'original' ? undefined : mediaSrcset(props.src),
)
const resolvedSizes = computed(() => {
  if (props.sizes) return props.sizes
  if (props.lcp || activeSlot.value === 'detail') return mediaSizes.detail
  if (activeSlot.value === 'thumb') return mediaSizes.thumb
  return mediaSizes.card
})
const resolvedLoading = computed(() => (props.lcp ? 'eager' : props.loading))
const resolvedPriority = computed(() => (props.lcp ? 'high' : props.fetchpriority))
</script>
