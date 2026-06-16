<template>
  <div class="auth-field" :class="{ 'auth-field--otp': otp }">
    <label v-if="label" class="auth-field__label">{{ label }}</label>
    <div class="auth-field__box">
      <i v-if="icon" class="auth-field__icon bi" :class="icon" aria-hidden="true" />
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
type Props = {
  label?: string
  icon?: string
  otp?: boolean
}

withDefaults(defineProps<Props>(), {
  label: '',
  icon: '',
  otp: false,
})
</script>
