<template>
  <div class="auth-field" :class="{ 'auth-field--otp': otp }">
    <label v-if="label" class="auth-field__label">{{ label }}</label>
    <div class="auth-field__box" :class="{ 'auth-field__box--trailing': iconTrailing }">
      <i v-if="icon && !iconTrailing" class="auth-field__icon auth-field__icon--leading bi" :class="icon" aria-hidden="true" />
      <slot />
      <i v-if="icon && iconTrailing" class="auth-field__icon auth-field__icon--trailing bi" :class="icon" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
type Props = {
  label?: string
  icon?: string
  otp?: boolean
  iconTrailing?: boolean
}

withDefaults(defineProps<Props>(), {
  label: '',
  icon: '',
  otp: false,
  iconTrailing: false,
})
</script>
