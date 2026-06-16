import { ref, watch } from 'vue'

/**
 * Animates a number from 0 (or fromValue) to the target value over a duration.
 * Uses easeOutQuart for a smooth deceleration at the end.
 * Returns displayValue (ref) so the component can format with prefix/suffix.
 */
export function useCountUp(
  target: () => number,
  options: { duration?: number; from?: number; decimals?: number } = {}
) {
  const { duration = 1200, from = 0, decimals = 0 } = options
  const displayValue = ref(from)

  function easeOutQuart(t: number): number {
    return 1 - (1 - t) ** 4
  }

  let rafId = 0
  let startTime = 0
  let startValue = from

  function tick(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutQuart(progress)
    const current = startValue + (target() - startValue) * eased
    displayValue.value = current
    if (progress < 1) {
      rafId = requestAnimationFrame(tick)
    } else {
      displayValue.value = target()
    }
  }

  function start() {
    cancel()
    startValue = displayValue.value
    startTime = performance.now()
    rafId = requestAnimationFrame(tick)
  }

  function cancel() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  watch(target, (newVal) => {
    if (displayValue.value !== newVal) {
      start()
    }
  }, { immediate: true })

  return { displayValue, start, cancel }
}
