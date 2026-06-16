<template>
  <div class="auth-scene" aria-hidden="true">
    <div class="auth-scene__sky" />
    <span class="auth-scene__aura" />
    <div class="auth-scene__clouds" />
    <span
      v-for="n in 12"
      :key="n"
      class="auth-scene__spark"
      :class="`auth-scene__spark--${n}`"
    />
    <div class="auth-scene__glow auth-scene__glow--gold" />
    <div class="auth-scene__glow auth-scene__glow--purple" />
    <div class="auth-scene__glow auth-scene__glow--soft" />
  </div>
</template>
