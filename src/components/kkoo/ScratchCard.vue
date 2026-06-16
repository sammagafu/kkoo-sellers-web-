<template>
  <div class="scratch-card-container">
    <div class="scratch-card-wrapper" v-if="!revealed">
      <canvas
        ref="canvas"
        class="scratch-canvas"
        :width="cardWidth"
        :height="cardHeight"
        @mousedown="startScratching"
        @mousemove="scratch"
        @mouseup="stopScratching"
        @mouseleave="stopScratching"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="stopScratching"
      />
      <div class="scratch-label">Scratch to reveal</div>
    </div>

    <div v-else class="revealed-card">
      <div class="reward-content">
        <div class="reward-icon">{{ rewardIcon }}</div>
        <div class="reward-title">{{ rewardTitle }}</div>
        <div class="reward-value">{{ rewardValue }}</div>
        <p class="reward-code">Code: {{ rewardCode }}</p>
        <b-button variant="primary" @click="reset"> Scratch Again </b-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const cardWidth = 300
const cardHeight = 200

const canvas = ref<HTMLCanvasElement>()
const isScratching = ref(false)
const revealed = ref(false)

const rewardIcon = ref('🎁')
const rewardTitle = ref('Daily Bonus')
const rewardValue = ref('500 Points')
const rewardCode = ref('DAILY500')

const rewards = [
  { icon: '🎁', title: 'Bonus Points', value: '500 Points', code: 'BONUS500' },
  { icon: '🎟️', title: 'Free Voucher', value: '$10 Off', code: 'VOUCHER10' },
  { icon: '⭐', title: 'Premium Badge', value: 'Exclusive', code: 'PREMIUM' },
  { icon: '💎', title: 'Gem Pack', value: '1000 Gems', code: 'GEMS1000' },
]

const revealPercentage = ref(0)
const scratchThreshold = 0.4 // 40% scratched to reveal

onMounted(() => {
  initializeCanvas()
})

const initializeCanvas = () => {
  if (!canvas.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  // Create gradient for scratch layer
  const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight)
  gradient.addColorStop(0, '#ffd700')
  gradient.addColorStop(0.5, '#ffed4e')
  gradient.addColorStop(1, '#ffc107')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, cardWidth, cardHeight)

  // Add texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  for (let i = 0; i < cardWidth; i += 20) {
    for (let j = 0; j < cardHeight; j += 20) {
      ctx.fillRect(i, j, 10, 10)
    }
  }

  // Add text
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('SCRATCH', cardWidth / 2, cardHeight / 2)
}

const startScratching = () => {
  isScratching.value = true
}

const stopScratching = () => {
  isScratching.value = false
}

const scratch = (event: MouseEvent) => {
  if (!isScratching.value || !canvas.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  scratchArea(ctx, x, y)
}

const handleTouchStart = (event: TouchEvent) => {
  isScratching.value = true
}

const handleTouchMove = (event: TouchEvent) => {
  if (!isScratching.value || !canvas.value) return

  event.preventDefault()

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  const touch = event.touches[0]
  const rect = canvas.value.getBoundingClientRect()
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top

  scratchArea(ctx, x, y)
}

const scratchArea = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  const brushSize = 30

  ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize)

  calculateRevealPercentage()
}

const calculateRevealPercentage = () => {
  if (!canvas.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  const imageData = ctx.getImageData(0, 0, cardWidth, cardHeight)
  const data = imageData.data

  let transparentPixels = 0
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 128) {
      transparentPixels++
    }
  }

  revealPercentage.value = transparentPixels / (cardWidth * cardHeight)

  if (revealPercentage.value > scratchThreshold) {
    reveal()
  }
}

const reveal = () => {
  revealed.value = true
  // Randomly select a reward
  const randomReward = rewards[Math.floor(Math.random() * rewards.length)]
  rewardIcon.value = randomReward.icon
  rewardTitle.value = randomReward.title
  rewardValue.value = randomReward.value
  rewardCode.value = randomReward.code
}

const reset = () => {
  revealed.value = false
  revealPercentage.value = 0
  initializeCanvas()
}
</script>

<style scoped lang="scss">
.scratch-card-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 2rem;

  .scratch-card-wrapper {
    position: relative;
    width: 300px;
    height: 200px;

    .scratch-canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: pointer;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      user-select: none;

      &:hover {
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
      }
    }

    .scratch-label {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.6);
      pointer-events: none;
      font-style: italic;
    }
  }

  .revealed-card {
    width: 300px;
    height: 200px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 2rem;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    animation: slideInUp 0.5s ease;

    .reward-content {
      text-align: center;
      width: 100%;

      .reward-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        animation: popIn 0.5s ease;
      }

      .reward-title {
        font-size: 1.2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .reward-value {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .reward-code {
        font-size: 0.85rem;
        opacity: 0.9;
        margin-bottom: 1rem;
        margin: 0.5rem 0 1rem;
        font-family: monospace;
        letter-spacing: 2px;
      }

      .btn {
        font-size: 0.9rem;
        padding: 0.5rem 1.5rem;
      }
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes popIn {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
}
</style>
