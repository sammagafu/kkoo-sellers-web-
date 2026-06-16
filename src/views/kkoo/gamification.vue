<template>
  <VerticalLayout>
    <b-container fluid class="py-4">
      <!-- Header -->
      <b-row class="mb-4">
        <b-col>
          <h1 class="mb-1">Gamification Components</h1>
          <p class="text-muted">Interactive UI elements for enhanced user engagement</p>
        </b-col>
      </b-row>

      <!-- Badges Gallery Section -->
      <b-row class="mb-4">
        <b-col>
          <UIComponentCard title="🎖️ Badges Gallery" id="badges-section">
            <p class="text-muted mb-3">Collect and display achievement badges with different rarity tiers.</p>
            <BadgesGallery />
          </UIComponentCard>
        </b-col>
      </b-row>

      <!-- Streak Counter & Leaderboard Row -->
      <b-row class="mb-4">
        <b-col lg="6" class="mb-3 mb-lg-0">
          <UIComponentCard title="🔥 Streak Counter" id="streak-section">
            <p class="text-muted mb-3">Track your daily engagement streak with milestone rewards.</p>
            <StreakCounter />
          </UIComponentCard>
        </b-col>
        <b-col lg="6">
          <UIComponentCard title="🏆 Leaderboard" id="leaderboard-section">
            <p class="text-muted mb-3">Compete with other users and climb the rankings.</p>
            <Leaderboard />
          </UIComponentCard>
        </b-col>
      </b-row>

      <!-- Scratch Card Section -->
      <b-row class="mb-4">
        <b-col>
          <UIComponentCard title="🎁 Scratch Card Animation" id="scratch-section">
            <p class="text-muted mb-3">Interactive scratch card for revealing daily rewards.</p>
            <ScratchCard />
          </UIComponentCard>
        </b-col>
      </b-row>

      <!-- Feature Overview -->
      <b-row class="mb-4">
        <b-col>
          <UIComponentCard title="📋 Component Features" id="features-section">
            <b-row>
              <b-col md="6" class="mb-3">
                <h5>
                  <b-badge variant="primary">BadgesGallery</b-badge>
                </h5>
                <ul class="text-muted small">
                  <li>Responsive grid layout</li>
                  <li>Locked/Unlocked states</li>
                  <li>Rarity classification (Common to Legendary)</li>
                  <li>Hover animations</li>
                  <li>Achievement tracking</li>
                </ul>
              </b-col>
              <b-col md="6" class="mb-3">
                <h5>
                  <b-badge variant="success">StreakCounter</b-badge>
                </h5>
                <ul class="text-muted small">
                  <li>Animated fire icon</li>
                  <li>Weekly progress tracking</li>
                  <li>Milestone rewards</li>
                  <li>Best streak history</li>
                  <li>Activity timeline</li>
                </ul>
              </b-col>
              <b-col md="6" class="mb-3">
                <h5>
                  <b-badge variant="info">Leaderboard</b-badge>
                </h5>
                <ul class="text-muted small">
                  <li>Ranked user display</li>
                  <li>Medal icons for top 3</li>
                  <li>Time period filters</li>
                  <li>Score display & changes</li>
                  <li>User tier indicators</li>
                </ul>
              </b-col>
              <b-col md="6" class="mb-3">
                <h5>
                  <b-badge variant="warning">ScratchCard</b-badge>
                </h5>
                <ul class="text-muted small">
                  <li>Canvas-based scratching</li>
                  <li>Touch & mouse support</li>
                  <li>Auto-reveal at 40%</li>
                  <li>Random rewards</li>
                  <li>Smooth animations</li>
                </ul>
              </b-col>
            </b-row>
          </UIComponentCard>
        </b-col>
      </b-row>

      <!-- Integration Guide -->
      <b-row>
        <b-col>
          <UIComponentCard title="📖 Integration Guide" id="integration-section">
            <div class="code-example">
              <p class="text-muted mb-3">Import and use components in your pages:</p>
              <pre><code>&lt;template&gt;
  &lt;div&gt;
    &lt;BadgesGallery /&gt;
    &lt;StreakCounter /&gt;
    &lt;Leaderboard /&gt;
    &lt;ScratchCard /&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
import BadgesGallery from '@/components/kkoo/BadgesGallery.vue'
import StreakCounter from '@/components/kkoo/StreakCounter.vue'
import Leaderboard from '@/components/kkoo/Leaderboard.vue'
import ScratchCard from '@/components/kkoo/ScratchCard.vue'
&lt;/script&gt;</code></pre>
            </div>

            <div class="mt-4">
              <h5>Component Locations</h5>
              <ul class="text-muted">
                <li><code>src/components/kkoo/BadgesGallery.vue</code> - Badge gallery component</li>
                <li><code>src/components/kkoo/StreakCounter.vue</code> - Streak tracking component</li>
                <li><code>src/components/kkoo/Leaderboard.vue</code> - Leaderboard display</li>
                <li><code>src/components/kkoo/ScratchCard.vue</code> - Interactive scratch card</li>
              </ul>
            </div>

            <div class="mt-4">
              <p class="text-muted">
                📚 For detailed documentation, see:
                <br />
                <code>docs/FRONTEND_UI_COMPONENTS.md</code>
              </p>
            </div>
          </UIComponentCard>
        </b-col>
      </b-row>
    </b-container>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import UIComponentCard from '@/components/UIComponentCard.vue'
import BadgesGallery from '@/components/kkoo/BadgesGallery.vue'
import StreakCounter from '@/components/kkoo/StreakCounter.vue'
import Leaderboard from '@/components/kkoo/Leaderboard.vue'
import ScratchCard from '@/components/kkoo/ScratchCard.vue'
</script>

<style scoped lang="scss">
.code-example {
  pre {
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;

    code {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.85rem;
      color: #333;
      line-height: 1.5;
    }
  }
}

ul {
  padding-left: 1.5rem;

  li {
    margin-bottom: 0.5rem;
  }
}

code {
  background: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
}
</style>
