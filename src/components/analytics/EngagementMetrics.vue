<template>
  <div class="engagement-metrics">
    <!-- Header -->
    <div class="header">
      <h1>Engagement Metrics</h1>
      <div class="header-filters">
        <select v-model="selectedTimeframe" class="filter-select">
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <div class="kpi-summary">
      <div class="kpi-card">
        <div class="kpi-icon" style="background-color: rgba(80, 227, 194, 0.1); color: #50e3c2">
          <span>📊</span>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Daily Active Users</span>
          <span class="kpi-value">{{ formatNumber(metrics.dau) }}</span>
          <span class="kpi-change positive">{{ metrics.dauChange }}% vs period</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background-color: rgba(74, 144, 226, 0.1); color: #4a90e2">
          <span>🔄</span>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Session Frequency</span>
          <span class="kpi-value">{{ metrics.sessionFrequency }}</span>
          <span class="kpi-change positive">{{ metrics.sessionChange }}% increase</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background-color: rgba(80, 227, 194, 0.1); color: #50e3c2">
          <span>⏱️</span>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Avg Session Duration</span>
          <span class="kpi-value">{{ metrics.avgSessionDuration }}</span>
          <span class="kpi-change positive">{{ metrics.durationChange }}% vs period</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background-color: rgba(240, 173, 85, 0.1); color: #f0ad55">
          <span>🎯</span>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Engagement Score</span>
          <span class="kpi-value">{{ metrics.engagementScore }}/100</span>
          <span class="kpi-change positive">{{ metrics.scoreChange }}% vs period</span>
        </div>
      </div>
    </div>

    <!-- Main Charts -->
    <div class="charts-grid">
      <!-- DAU Trend -->
      <div class="chart-card">
        <h3>Daily Active Users Trend</h3>
        <canvas id="dau-chart"></canvas>
      </div>

      <!-- Session Distribution -->
      <div class="chart-card">
        <h3>Session Distribution</h3>
        <canvas id="session-chart"></canvas>
      </div>
    </div>

    <!-- Engagement Levels -->
    <div class="engagement-card">
      <h3>User Engagement Levels</h3>
      <div class="engagement-breakdown">
        <div v-for="level in engagementLevels" :key="level.id" class="engagement-level-item">
          <div class="level-header">
            <h4>{{ level.name }}</h4>
            <span class="user-count">{{ formatNumber(level.users) }} users</span>
          </div>
          <div class="level-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: level.percentage + '%', backgroundColor: level.color }"></div>
            </div>
            <span class="progress-percent">{{ level.percentage }}%</span>
          </div>
          <div class="level-stats">
            <div class="stat">
              <span class="stat-label">Monthly Sessions</span>
              <span class="stat-value">{{ level.monthlySessions }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Avg Duration</span>
              <span class="stat-value">{{ level.avgDuration }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Churn Risk</span>
              <span class="stat-value" :style="{ color: level.churnRisk === 'High' ? '#f56565' : level.churnRisk === 'Medium' ? '#ffa500' : '#48bb78' }">
                {{ level.churnRisk }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Usage -->
    <div class="feature-usage-card">
      <h3>Feature Usage Analysis</h3>
      <div class="feature-table">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Daily Users</th>
              <th>Adoption Rate</th>
              <th>Avg Uses/Day</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="feature in featureUsage" :key="feature.id">
              <td>{{ feature.name }}</td>
              <td>{{ formatNumber(feature.dailyUsers) }}</td>
              <td>
                <div class="adoption-bar">
                  <div class="adoption-fill" :style="{ width: feature.adoption + '%', backgroundColor: feature.color }"></div>
                </div>
                <span>{{ feature.adoption }}%</span>
              </td>
              <td>{{ feature.usesPerDay }}</td>
              <td>
                <span class="trend" :style="{ color: feature.trend > 0 ? '#48bb78' : '#f56565' }">
                  {{ feature.trend > 0 ? '📈' : '📉' }} {{ feature.trend > 0 ? '+' : '' }}{{ feature.trend }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Retention Cohorts -->
    <div class="retention-card">
      <h3>30-Day Rolling Retention</h3>
      <div class="retention-chart">
        <canvas id="retention-chart"></canvas>
      </div>
    </div>

    <!-- Time of Day Patterns -->
    <div class="time-patterns-card">
      <h3>Activity by Time of Day ({{ selectedTimeframe }})</h3>
      <div class="time-patterns">
        <div v-for="pattern in timePatterns" :key="pattern.hour" class="time-pattern-item">
          <div class="time-label">{{ pattern.hour }}</div>
          <div class="time-bar">
            <div
              class="time-fill"
              :style="{ width: (pattern.users / Math.max(...timePatterns.map((p) => p.users))) * 100 + '%' }"
            ></div>
          </div>
          <div class="time-users">{{ formatNumber(pattern.users) }}</div>
        </div>
      </div>
    </div>

    <!-- Platform Comparison -->
    <div class="platform-comparison-card">
      <h3>Engagement by Platform</h3>
      <div class="platform-grid">
        <div v-for="platform in platformComparison" :key="platform.id" class="platform-item">
          <div class="platform-header">
            <h4>{{ platform.name }}</h4>
            <span class="platform-icon" :style="{ color: platform.color }">{{ platform.emoji }}</span>
          </div>
          <div class="platform-metrics">
            <div class="metric-row">
              <span class="metric-name">DAU</span>
              <span class="metric-value">{{ formatNumber(platform.dau) }}</span>
            </div>
            <div class="metric-row">
              <span class="metric-name">Avg Session</span>
              <span class="metric-value">{{ platform.avgSession }}</span>
            </div>
            <div class="metric-row">
              <span class="metric-name">Retention (30d)</span>
              <span class="metric-value" :style="{ color: platform.retention30 > 60 ? '#48bb78' : '#ffa500' }">
                {{ platform.retention30 }}%
              </span>
            </div>
          </div>
          <div class="platform-rating">
            <span class="rating-label">Engagement Score:</span>
            <span class="rating-value" :style="{ color: platform.color }">{{ platform.engagementScore }}/100</span>
          </div>
        </div>
      </div>
    </div>

    <!-- User Actions Heatmap -->
    <div class="actions-card">
      <h3>Top User Actions</h3>
      <div class="actions-list">
        <div v-for="(action, index) in userActions" :key="index" class="action-item">
          <div class="action-rank">{{ index + 1 }}</div>
          <div class="action-info">
            <h4>{{ action.name }}</h4>
            <p>{{ action.description }}</p>
          </div>
          <div class="action-metrics">
            <span>{{ formatNumber(action.count) }} times</span>
            <span class="action-percentage">{{ action.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Engagement Recommendations -->
    <div class="recommendations-card">
      <h3>Engagement Recommendations</h3>
      <div class="recommendations-list">
        <div v-for="rec in recommendations" :key="rec.id" class="recommendation-item">
          <div class="rec-icon" :style="{ backgroundColor: rec.color + '20', color: rec.color }">
            {{ rec.icon }}
          </div>
          <div class="rec-content">
            <h4>{{ rec.title }}</h4>
            <p>{{ rec.description }}</p>
          </div>
          <span class="rec-impact" :style="{ color: rec.color }">{{ rec.impact }}% potential gain</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

const selectedTimeframe = ref('30days')

const metrics = ref({
  dau: 45230,
  dauChange: 8.3,
  sessionFrequency: 3.2,
  sessionChange: 12.5,
  avgSessionDuration: '12m 34s',
  durationChange: 5.2,
  engagementScore: 78,
  scoreChange: 4.1,
})

const engagementLevels = ref([
  {
    id: 1,
    name: 'Highly Engaged',
    color: '#50E3C2',
    users: 12450,
    percentage: 10.0,
    monthlySessions: 45,
    avgDuration: '2 hours',
    churnRisk: 'Low',
  },
  {
    id: 2,
    name: 'Engaged',
    color: '#4A90E2',
    users: 38920,
    percentage: 31.3,
    monthlySessions: 18,
    avgDuration: '45 mins',
    churnRisk: 'Low',
  },
  {
    id: 3,
    name: 'Moderately Engaged',
    color: '#FFA500',
    users: 52340,
    percentage: 42.1,
    monthlySessions: 6,
    avgDuration: '15 mins',
    churnRisk: 'Medium',
  },
  {
    id: 4,
    name: 'Low Engagement',
    color: '#CBD5E0',
    users: 20590,
    percentage: 16.6,
    monthlySessions: 2,
    avgDuration: '3 mins',
    churnRisk: 'High',
  },
])

const featureUsage = ref([
  {
    id: 1,
    name: 'Book Trip',
    dailyUsers: 42320,
    adoption: 93.5,
    usesPerDay: 2.3,
    color: '#50E3C2',
    trend: 5.2,
  },
  {
    id: 2,
    name: 'View Promotions',
    dailyUsers: 38450,
    adoption: 85.0,
    usesPerDay: 1.8,
    color: '#4A90E2',
    trend: 8.3,
  },
  {
    id: 3,
    name: 'Refer Friends',
    dailyUsers: 12680,
    adoption: 28.0,
    usesPerDay: 0.5,
    color: '#FFA500',
    trend: 12.1,
  },
  {
    id: 4,
    name: 'Premium Features',
    dailyUsers: 8230,
    adoption: 18.2,
    usesPerDay: 1.2,
    color: '#F0AD55',
    trend: 18.5,
  },
  {
    id: 5,
    name: 'In-App Messages',
    dailyUsers: 32540,
    adoption: 71.9,
    usesPerDay: 1.1,
    color: '#48BB78',
    trend: -2.1,
  },
])

const timePatterns = ref([
  { hour: '12 AM', users: 8230 },
  { hour: '3 AM', users: 4220 },
  { hour: '6 AM', users: 15430 },
  { hour: '9 AM', users: 32120 },
  { hour: '12 PM', users: 38940 },
  { hour: '3 PM', users: 35680 },
  { hour: '6 PM', users: 42310 },
  { hour: '9 PM', users: 38450 },
])

const platformComparison = ref([
  {
    id: 1,
    name: 'Buyers App',
    emoji: '🛍️',
    color: '#4A90E2',
    dau: 28450,
    avgSession: '14m 23s',
    retention30: 72,
    engagementScore: 82,
  },
  {
    id: 2,
    name: 'Riders App',
    emoji: '🚴',
    color: '#FFA500',
    dau: 12340,
    avgSession: '8m 15s',
    retention30: 65,
    engagementScore: 71,
  },
  {
    id: 3,
    name: 'Sellers App',
    emoji: '🏪',
    color: '#50E3C2',
    dau: 4440,
    avgSession: '18m 45s',
    retention30: 58,
    engagementScore: 68,
  },
])

const userActions = ref([
  {
    name: 'Search Products',
    description: 'Users searching for items in catalog',
    count: 234560,
    percentage: 28.2,
  },
  {
    name: 'View Product Details',
    description: 'Viewing full product information',
    count: 189340,
    percentage: 22.8,
  },
  {
    name: 'Add to Cart',
    description: 'Items added to shopping cart',
    count: 156780,
    percentage: 18.8,
  },
  {
    name: 'Checkout Process',
    description: 'Completing purchase',
    count: 98650,
    percentage: 11.9,
  },
  {
    name: 'View Promotions',
    description: 'Checking active deals and offers',
    count: 91230,
    percentage: 11.0,
  },
  {
    name: 'Contact Support',
    description: 'Reaching out support team',
    count: 38420,
    percentage: 4.6,
  },
])

const recommendations = ref([
  {
    id: 1,
    icon: '🎯',
    color: '#4A90E2',
    title: 'Increase Feature Discoverability',
    description: 'Premium features have low adoption (18.2%). Improve onboarding to increase awareness.',
    impact: 15,
  },
  {
    id: 2,
    icon: '🔔',
    color: '#50E3C2',
    title: 'Optimize Evening Hours',
    description: 'Peak activity 6-9 PM. Schedule promotions and notifications during these hours.',
    impact: 12,
  },
  {
    id: 3,
    icon: '💰',
    color: '#FFA500',
    title: 'Boost Referral Program',
    description: 'Referral feature only engages 28% of users. Incentivize more to share.',
    impact: 18,
  },
  {
    id: 4,
    icon: '📱',
    color: '#48BB78',
    title: 'Cross-Platform Engagement',
    description: 'Riders App lags in engagement. Create exclusive benefits to drive adoption.',
    impact: 22,
  },
])

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(Math.round(num))
}

const initCharts = () => {
  // DAU Chart
  const dauCtx = document.getElementById('dau-chart')
  if (dauCtx) {
    new Chart(dauCtx, {
      type: 'line',
      data: {
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
        datasets: [
          {
            label: 'Daily Active Users',
            data: [38200, 40500, 42300, 41800, 43200, 44800, 45230],
            borderColor: '#50E3C2',
            backgroundColor: 'rgba(80, 227, 194, 0.05)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#50E3C2',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    })
  }

  // Session Chart
  const sessionCtx = document.getElementById('session-chart')
  if (sessionCtx) {
    new Chart(sessionCtx, {
      type: 'bar',
      data: {
        labels: ['0-5 min', '5-15 min', '15-30 min', '30-60 min', '60+ min'],
        datasets: [
          {
            label: 'Sessions',
            data: [28450, 35620, 28340, 18950, 12340],
            backgroundColor: ['#CBD5E0', '#FFA500', '#4A90E2', '#50E3C2', '#48BB78'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true },
        },
      },
    })
  }

  // Retention Chart
  const retentionCtx = document.getElementById('retention-chart')
  if (retentionCtx) {
    new Chart(retentionCtx, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: '30-Day Retention',
            data: [82, 78, 75, 72],
            borderColor: '#4A90E2',
            backgroundColor: 'rgba(74, 144, 226, 0.05)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#4A90E2',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: { beginAtZero: false, max: 100 },
        },
      },
    })
  }
}

onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.engagement-metrics {
  padding: 2rem;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.filter-select {
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background-color: white;
}

.kpi-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.kpi-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.kpi-label {
  font-size: 0.813rem;
  color: #718096;
  font-weight: 500;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
}

.kpi-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.kpi-change.positive {
  color: #48bb78;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 1rem 0;
}

.chart-card canvas {
  max-height: 300px;
}

.engagement-card,
.feature-usage-card,
.retention-card,
.time-patterns-card,
.platform-comparison-card,
.actions-card,
.recommendations-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.engagement-card h3,
.feature-usage-card h3,
.retention-card h3,
.time-patterns-card h3,
.platform-comparison-card h3,
.actions-card h3,
.recommendations-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 1.5rem 0;
}

.engagement-breakdown {
  display: grid;
  gap: 1rem;
}

.engagement-level-item {
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.level-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #1a202c;
}

.user-count {
  font-size: 0.813rem;
  color: #718096;
}

.level-progress {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
}

.progress-percent {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4a5568;
  min-width: 35px;
  text-align: right;
}

.level-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #718096;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a202c;
}

.feature-table {
  overflow-x: auto;
}

.feature-table table {
  width: 100%;
  border-collapse: collapse;
}

.feature-table thead {
  background-color: #f7fafc;
  border-bottom: 2px solid #e2e8f0;
}

.feature-table th {
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  font-size: 0.813rem;
  color: #4a5568;
  text-transform: uppercase;
}

.feature-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #2d3748;
}

.feature-table tbody tr:hover {
  background-color: #f7fafc;
}

.adoption-bar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.adoption-fill {
  height: 6px;
  border-radius: 3px;
  min-width: 100px;
}

.trend {
  font-weight: 600;
}

.retention-chart {
  position: relative;
  height: 300px;
}

.time-patterns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}

.time-pattern-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 8px;
}

.time-label {
  font-size: 0.813rem;
  font-weight: 600;
  color: #4a5568;
}

.time-bar {
  width: 100%;
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.time-fill {
  height: 100%;
  background-color: #50e3c2;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.time-users {
  font-size: 0.75rem;
  color: #718096;
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.platform-item {
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.platform-header h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a202c;
}

.platform-icon {
  font-size: 1.5rem;
}

.platform-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.metric-name {
  color: #718096;
}

.metric-value {
  font-weight: 600;
  color: #1a202c;
}

.platform-rating {
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.rating-label {
  color: #718096;
}

.rating-value {
  font-weight: 600;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.action-rank {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #4a5568;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.action-info {
  flex: 1;
}

.action-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #1a202c;
}

.action-info p {
  margin: 0;
  font-size: 0.813rem;
  color: #718096;
}

.action-metrics {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  text-align: right;
}

.action-percentage {
  font-weight: 600;
  color: #4a5568;
}

.recommendations-list {
  display: grid;
  gap: 1rem;
}

.recommendation-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  align-items: flex-start;
}

.rec-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.rec-content {
  flex: 1;
}

.rec-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #1a202c;
}

.rec-content p {
  margin: 0;
  font-size: 0.813rem;
  color: #718096;
}

.rec-impact {
  font-weight: 600;
  font-size: 0.875rem;
  min-width: 100px;
  text-align: right;
}

@media (max-width: 768px) {
  .kpi-summary {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .platform-grid {
    grid-template-columns: 1fr;
  }

  .time-patterns {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
