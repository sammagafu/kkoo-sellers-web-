<template>
  <div class="user-segmentation">
    <!-- Header -->
    <div class="header">
      <h1>User Segmentation</h1>
      <div class="header-filters">
        <select v-model="selectedPeriod" class="filter-select">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>

    <!-- Activity Level Segmentation -->
    <div class="segment-card">
      <h2>Users by Activity Level</h2>
      <div class="segment-grid">
        <div v-for="segment in activitySegments" :key="segment.id" class="segment-item">
          <div class="segment-header">
            <h3>{{ segment.name }}</h3>
            <span class="user-count">{{ formatNumber(segment.users) }} users</span>
          </div>
          <div class="segment-body">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: segment.percentage + '%', backgroundColor: segment.color }"></div>
            </div>
            <div class="segment-stats">
              <div class="stat">
                <span class="stat-label">Percentage</span>
                <span class="stat-value" :style="{ color: segment.color }">{{ segment.percentage }}%</span>
              </div>
              <div class="stat">
                <span class="stat-label">Avg. Monthly Trips</span>
                <span class="stat-value">{{ segment.avgTrips }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Lifetime Value</span>
                <span class="stat-value">KES {{ formatNumber(segment.ltv) }}</span>
              </div>
            </div>
            <p class="segment-description">{{ segment.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Revenue Contribution -->
    <div class="segment-card">
      <h2>Revenue Contribution by Segment</h2>
      <div class="chart-container">
        <canvas id="revenue-segment-chart"></canvas>
      </div>
      <div class="revenue-breakdown">
        <div v-for="item in revenueSegments" :key="item.id" class="revenue-item">
          <div class="revenue-info">
            <span class="revenue-name">{{ item.name }}</span>
            <span class="revenue-percentage">{{ item.percentage }}% of total</span>
          </div>
          <span class="revenue-amount">KES {{ formatNumber(item.revenue) }}</span>
        </div>
      </div>
    </div>

    <!-- Retention by Segment -->
    <div class="segment-card">
      <h2>30-Day Retention Rate</h2>
      <div class="retention-grid">
        <div v-for="item in retentionData" :key="item.id" class="retention-item">
          <div class="retention-header">
            <h4>{{ item.cohort }}</h4>
            <span class="retention-rate" :class="item.retention > 60 ? 'good' : item.retention > 40 ? 'fair' : 'poor'">
              {{ item.retention }}%
            </span>
          </div>
          <div class="retention-bar">
            <div class="retention-fill" :style="{ width: item.retention + '%' }"></div>
          </div>
          <div class="retention-details">
            <span>{{ formatNumber(item.retained) }} of {{ formatNumber(item.total) }} retained</span>
          </div>
        </div>
      </div>
    </div>

    <!-- User Tier Distribution -->
    <div class="segment-card">
      <h2>User Distribution by Tier</h2>
      <div class="tier-distribution">
        <div v-for="tier in tierDistribution" :key="tier.id" class="tier-item">
          <div class="tier-badge" :style="{ backgroundColor: tier.color }">
            <span class="tier-icon">{{ tier.icon }}</span>
          </div>
          <div class="tier-info">
            <h4>{{ tier.name }}</h4>
            <span class="tier-count">{{ formatNumber(tier.users) }} users</span>
          </div>
          <div class="tier-metrics">
            <div class="metric">
              <span class="metric-label">Avg Rating</span>
              <span class="metric-value">{{ tier.avgRating }}/5</span>
            </div>
            <div class="metric">
              <span class="metric-label">Growth</span>
              <span class="metric-value" :style="{ color: tier.growth > 0 ? '#48bb78' : '#f56565' }">
                {{ tier.growth > 0 ? '+' : '' }}{{ tier.growth }}%
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Revenue/User</span>
              <span class="metric-value">KES {{ formatNumber(tier.revenuePerUser) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Geographic Segmentation -->
    <div class="segment-card">
      <h2>Geographic Distribution</h2>
      <div class="geo-grid">
        <div v-for="region in geoSegments" :key="region.id" class="geo-item">
          <div class="geo-header">
            <h4>{{ region.name }}</h4>
            <span class="users-badge">{{ formatNumber(region.users) }}</span>
          </div>
          <div class="geo-stats">
            <div class="geo-stat">
              <span class="label">Active Users</span>
              <span class="value">{{ region.activePercentage }}%</span>
            </div>
            <div class="geo-stat">
              <span class="label">Revenue</span>
              <span class="value">KES {{ formatNumber(region.revenue) }}</span>
            </div>
            <div class="geo-stat">
              <span class="label">Growth</span>
              <span class="value" :style="{ color: region.growth > 0 ? '#48bb78' : '#f56565' }">
                {{ region.growth > 0 ? '+' : '' }}{{ region.growth }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Behavior Patterns -->
    <div class="segment-card">
      <h2>User Behavior Patterns</h2>
      <div class="behavior-list">
        <div v-for="behavior in behaviorPatterns" :key="behavior.id" class="behavior-item">
          <div class="behavior-icon" :style="{ backgroundColor: behavior.color + '20' }">
            <span :style="{ color: behavior.color }">{{ behavior.emoji }}</span>
          </div>
          <div class="behavior-content">
            <h4>{{ behavior.name }}</h4>
            <p>{{ behavior.description }}</p>
            <div class="behavior-stats">
              <span>{{ formatNumber(behavior.users) }} users</span>
              <span>•</span>
              <span>Avg {{ behavior.value }}</span>
            </div>
          </div>
          <span class="behavior-percentage">{{ behavior.percentage }}%</span>
        </div>
      </div>
    </div>

    <!-- Engagement Bucketing -->
    <div class="segment-card">
      <h2>Engagement Buckets</h2>
      <div class="bucket-table">
        <table>
          <thead>
            <tr>
              <th>Engagement Level</th>
              <th>Users</th>
              <th>Avg Monthly Revenue</th>
              <th>Churn Risk</th>
              <th>Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bucket in engagementBuckets" :key="bucket.id">
              <td>
                <span class="bucket-name" :style="{ color: bucket.color }">{{ bucket.name }}</span>
              </td>
              <td>{{ formatNumber(bucket.users) }}</td>
              <td>KES {{ formatNumber(bucket.avgRevenue) }}</td>
              <td>
                <span class="risk-badge" :class="bucket.churnRisk.toLowerCase()">
                  {{ bucket.churnRisk }}
                </span>
              </td>
              <td>{{ bucket.action }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

const selectedPeriod = ref('month')

const activitySegments = ref([
  {
    id: 1,
    name: 'Super Active',
    users: 8945,
    percentage: 7.2,
    color: '#50E3C2',
    avgTrips: 45,
    ltv: 28500,
    description: 'Daily active users, strong engagement, high lifetime value',
  },
  {
    id: 2,
    name: 'Active',
    users: 34210,
    percentage: 27.5,
    color: '#4A90E2',
    avgTrips: 18,
    ltv: 12400,
    description: 'Regular weekly usage, consistent engagement',
  },
  {
    id: 3,
    name: 'Moderate',
    users: 52340,
    percentage: 42.0,
    color: '#FFA500',
    avgTrips: 6,
    ltv: 4200,
    description: 'Monthly or occasional usage',
  },
  {
    id: 4,
    name: 'Inactive',
    users: 28035,
    percentage: 22.5,
    color: '#CBD5E0',
    avgTrips: 1,
    ltv: 800,
    description: 'Minimal or no recent activity, at-risk users',
  },
])

const revenueSegments = ref([
  { id: 1, name: 'Super Active (7.2%)', percentage: 34, revenue: 2872000 },
  { id: 2, name: 'Active (27.5%)', percentage: 42, revenue: 3556000 },
  { id: 3, name: 'Moderate (42.0%)', percentage: 20, revenue: 1692000 },
  { id: 4, name: 'Inactive (22.5%)', percentage: 4, revenue: 338000 },
])

const retentionData = ref([
  { id: 1, cohort: 'Jan 2024 Cohort', retention: 85, total: 12500, retained: 10625 },
  { id: 2, cohort: 'Feb 2024 Cohort', retention: 78, total: 14200, retained: 11076 },
  { id: 3, cohort: 'Mar 2024 Cohort', retention: 71, total: 15800, retained: 11218 },
  { id: 4, cohort: 'Apr 2024 Cohort', retention: 64, total: 13600, retained: 8704 },
  { id: 5, cohort: 'May 2024 Cohort', retention: 52, total: 16400, retained: 8528 },
])

const tierDistribution = ref([
  {
    id: 1,
    name: 'Bronze',
    icon: '🥉',
    color: '#D4A574',
    users: 45200,
    avgRating: 4.2,
    growth: 5.3,
    revenuePerUser: 450,
  },
  {
    id: 2,
    name: 'Silver',
    icon: '🥈',
    color: '#C0C0C0',
    users: 38100,
    avgRating: 4.5,
    growth: 8.2,
    revenuePerUser: 850,
  },
  {
    id: 3,
    name: 'Gold',
    icon: '🥇',
    color: '#FFD700',
    users: 32500,
    avgRating: 4.7,
    growth: 12.1,
    revenuePerUser: 1450,
  },
  {
    id: 4,
    name: 'Platinum',
    icon: '👑',
    color: '#E5E4E2',
    users: 8730,
    avgRating: 4.9,
    growth: 18.5,
    revenuePerUser: 3200,
  },
])

const geoSegments = ref([
  {
    id: 1,
    name: 'Nairobi',
    users: 68420,
    activePercentage: 72,
    revenue: 3450000,
    growth: 14.2,
  },
  {
    id: 2,
    name: 'Mombasa',
    users: 24350,
    activePercentage: 65,
    revenue: 1120000,
    growth: 9.8,
  },
  {
    id: 3,
    name: 'Kisumu',
    users: 18690,
    activePercentage: 58,
    revenue: 820000,
    growth: 6.5,
  },
  {
    id: 4,
    name: 'Nakuru',
    users: 12680,
    activePercentage: 52,
    revenue: 560000,
    growth: -2.1,
  },
])

const behaviorPatterns = ref([
  {
    id: 1,
    name: 'Morning Commuters',
    emoji: '🌅',
    color: '#FF6B6B',
    description: 'Peak activity between 6-9 AM, averaging 2.3 trips',
    users: 34200,
    percentage: 27.5,
    value: '2.3 trips/day',
  },
  {
    id: 2,
    name: 'Evening Surge Users',
    emoji: '🌆',
    color: '#FFA500',
    description: 'High activity 4-7 PM, averaging 1.8 trips',
    users: 28900,
    percentage: 23.2,
    value: '1.8 trips/day',
  },
  {
    id: 3,
    name: 'Weekend Warriors',
    emoji: '🎉',
    color: '#4A90E2',
    description: 'Primarily weekend users, averaging 3.2 trips',
    users: 18450,
    percentage: 14.8,
    value: '3.2 trips/weekend',
  },
  {
    id: 4,
    name: 'Business Frequent Users',
    emoji: '💼',
    color: '#50E3C2',
    description: 'Weekday focused, averaging 4.5 trips',
    users: 42080,
    percentage: 33.8,
    value: '4.5 trips/week',
  },
])

const engagementBuckets = ref([
  {
    id: 1,
    name: 'Highly Engaged',
    color: '#50E3C2',
    users: 12340,
    avgRevenue: 3200,
    churnRisk: 'Low',
    action: 'Maintain engagement, explore upsell opportunities',
  },
  {
    id: 2,
    name: 'Engaged',
    color: '#4A90E2',
    users: 45210,
    avgRevenue: 1450,
    churnRisk: 'Low',
    action: 'Nurture growth, enable premium features',
  },
  {
    id: 3,
    name: 'Moderately Engaged',
    color: '#FFA500',
    users: 52890,
    avgRevenue: 680,
    churnRisk: 'Medium',
    action: 'Re-engagement campaigns, personalized offers',
  },
  {
    id: 4,
    name: 'Low Engagement',
    color: '#F56565',
    users: 14090,
    avgRevenue: 200,
    churnRisk: 'High',
    action: 'Win-back campaigns, understand pain points',
  },
])

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(Math.round(num))
}

const initCharts = () => {
  const ctx = document.getElementById('revenue-segment-chart')
  if (ctx) {
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: revenueSegments.value.map((s) => s.name),
        datasets: [
          {
            data: revenueSegments.value.map((s) => s.revenue),
            backgroundColor: ['#50E3C2', '#4A90E2', '#FFA500', '#CBD5E0'],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
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
.user-segmentation {
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
  cursor: pointer;
}

.segment-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.segment-card h2 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 1.5rem 0;
}

.segment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.segment-item {
  background: linear-gradient(135deg, #f5f7fa 0%, #edf2f7 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.segment-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.user-count {
  font-size: 0.813rem;
  color: #718096;
  font-weight: 500;
}

.progress-bar {
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.segment-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #718096;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
}

.segment-description {
  font-size: 0.813rem;
  color: #718096;
  margin: 0;
}

.chart-container {
  position: relative;
  height: 300px;
  margin-bottom: 1.5rem;
}

.revenue-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.revenue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f7fafc;
  border-radius: 4px;
}

.revenue-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.revenue-name {
  font-weight: 600;
  color: #1a202c;
}

.revenue-percentage {
  font-size: 0.813rem;
  color: #718096;
}

.revenue-amount {
  font-weight: 600;
  color: #1a202c;
}

.retention-grid {
  display: grid;
  gap: 1rem;
}

.retention-item {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.retention-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.retention-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #1a202c;
}

.retention-rate {
  font-weight: 600;
  font-size: 1.1rem;
}

.retention-rate.good {
  color: #48bb78;
}

.retention-rate.fair {
  color: #ffa500;
}

.retention-rate.poor {
  color: #f56565;
}

.retention-bar {
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.retention-fill {
  height: 100%;
  background-color: #4a90e2;
  border-radius: 3px;
}

.retention-details {
  font-size: 0.813rem;
  color: #718096;
}

.tier-distribution {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
}

.tier-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.tier-badge {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.tier-info {
  flex: 1;
}

.tier-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #1a202c;
}

.tier-count {
  font-size: 0.813rem;
  color: #718096;
}

.tier-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.75rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  color: #718096;
}

.metric-value {
  font-weight: 600;
  color: #1a202c;
}

.geo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.geo-item {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.geo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.geo-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #1a202c;
}

.users-badge {
  background-color: #4a5568;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.geo-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  font-size: 0.75rem;
}

.geo-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.geo-stat .label {
  color: #718096;
}

.geo-stat .value {
  font-weight: 600;
  color: #1a202c;
}

.behavior-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.behavior-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.behavior-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.behavior-content {
  flex: 1;
}

.behavior-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #1a202c;
}

.behavior-content p {
  margin: 0 0 0.5rem 0;
  font-size: 0.813rem;
  color: #718096;
}

.behavior-stats {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #718096;
}

.behavior-percentage {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1a202c;
  min-width: 50px;
  text-align: right;
}

.bucket-table {
  overflow-x: auto;
}

.bucket-table table {
  width: 100%;
  border-collapse: collapse;
}

.bucket-table thead {
  background-color: #f7fafc;
  border-bottom: 2px solid #e2e8f0;
}

.bucket-table th {
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  font-size: 0.813rem;
  color: #4a5568;
  text-transform: uppercase;
}

.bucket-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #2d3748;
}

.bucket-table tbody tr:hover {
  background-color: #f7fafc;
}

.bucket-name {
  font-weight: 600;
}

.risk-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.risk-badge.low {
  background-color: #c6f6d5;
  color: #22543d;
}

.risk-badge.medium {
  background-color: #feebc8;
  color: #7c2d12;
}

.risk-badge.high {
  background-color: #fed7d7;
  color: #742a2a;
}

@media (max-width: 768px) {
  .segment-grid {
    grid-template-columns: 1fr;
  }

  .tier-distribution,
  .geo-grid {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
