<template>
  <div class="revenue-analytics">
    <!-- Header -->
    <div class="header">
      <h1>Revenue Analytics</h1>
      <div class="header-controls">
        <select v-model="selectedPeriod" class="filter-select">
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
        <button @click="exportReport" class="btn-export">📥 Export Report</button>
      </div>
    </div>

    <!-- Revenue Summary Cards -->
    <div class="revenue-summary">
      <div class="revenue-card primary">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <span class="label">Total Revenue</span>
          <span class="value">KES {{ formatNumber(totalRevenue) }}</span>
          <span class="change positive">↑ {{ revenueGrowth }}% vs period</span>
        </div>
      </div>

      <div class="revenue-card accent">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <span class="label">Average Per User</span>
          <span class="value">KES {{ formatNumber(avgPerUser) }}</span>
          <span class="change positive">↑ 5.2% increase</span>
        </div>
      </div>

      <div class="revenue-card success">
        <div class="card-icon">🎯</div>
        <div class="card-content">
          <span class="label">Monthly Recurring</span>
          <span class="value">KES {{ formatNumber(mrrRevenue) }}</span>
          <span class="change positive">↑ 8.1% growth</span>
        </div>
      </div>

      <div class="revenue-card">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <span class="label">Avg Transaction</span>
          <span class="value">KES {{ formatNumber(avgTransaction) }}</span>
          <span class="change positive">↑ 2.8% higher</span>
        </div>
      </div>
    </div>

    <!-- Main Revenue Charts -->
    <div class="charts-section">
      <!-- Revenue Trend -->
      <div class="chart-card">
        <h3>Revenue Trend ({{ selectedPeriod }})</h3>
        <canvas id="revenue-trend-chart"></canvas>
      </div>

      <!-- Revenue by Source -->
      <div class="chart-card">
        <h3>Revenue by Source</h3>
        <canvas id="revenue-source-chart"></canvas>
      </div>
    </div>

    <!-- Revenue by Platform -->
    <div class="platform-revenue-card">
      <h3>Revenue by Platform</h3>
      <div class="platform-breakdown">
        <div v-for="platform in platformRevenue" :key="platform.id" class="platform-revenue-item">
          <div class="platform-info">
            <div class="platform-name-row">
              <span class="platform-name">{{ platform.name }}</span>
              <span class="platform-percentage">{{ platform.percentage }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: platform.percentage + '%', backgroundColor: platform.color }"></div>
            </div>
          </div>
          <div class="platform-stats">
            <div class="stat">
              <span class="stat-label">Revenue</span>
              <span class="stat-value">KES {{ formatNumber(platform.revenue) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Transactions</span>
              <span class="stat-value">{{ formatNumber(platform.transactions) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Growth</span>
              <span class="stat-value" :style="{ color: platform.growth > 0 ? '#48bb78' : '#f56565' }">
                {{ platform.growth > 0 ? '+' : '' }}{{ platform.growth }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Revenue by Category -->
    <div class="category-revenue-card">
      <h3>Top Revenue Categories</h3>
      <div class="category-table">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Revenue</th>
              <th>% of Total</th>
              <th>Transactions</th>
              <th>Avg Value</th>
              <th>Growth</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in topCategories" :key="category.id">
              <td>
                <div class="category-name">
                  <span class="category-icon">{{ category.icon }}</span>
                  <span>{{ category.name }}</span>
                </div>
              </td>
              <td>KES {{ formatNumber(category.revenue) }}</td>
              <td>
                <div class="percentage-bar">
                  <div class="percentage-fill" :style="{ width: category.percentage + '%' }"></div>
                </div>
                {{ category.percentage }}%
              </td>
              <td>{{ formatNumber(category.transactions) }}</td>
              <td>KES {{ formatNumber(category.avgValue) }}</td>
              <td>
                <span class="growth-badge" :class="category.growth > 0 ? 'positive' : 'negative'">
                  {{ category.growth > 0 ? '+' : '' }}{{ category.growth }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Revenue by Payment Method -->
    <div class="payment-method-card">
      <h3>Payment Methods</h3>
      <div class="payment-methods">
        <div v-for="method in paymentMethods" :key="method.id" class="payment-item">
          <div class="payment-header">
            <div class="payment-name">
              <span class="payment-icon" :style="{ backgroundColor: method.color + '20', color: method.color }">{{ method.icon }}</span>
              <div class="payment-info">
                <h4>{{ method.name }}</h4>
                <p>{{ method.users }} users</p>
              </div>
            </div>
            <span class="payment-percentage">{{ method.percentage }}%</span>
          </div>
          <div class="payment-stats">
            <div class="metric">
              <span>Revenue</span>
              <span class="value">KES {{ formatNumber(method.revenue) }}</span>
            </div>
            <div class="metric">
              <span>Transactions</span>
              <span class="value">{{ formatNumber(method.transactions) }}</span>
            </div>
            <div class="metric">
              <span>Avg</span>
              <span class="value">KES {{ formatNumber(method.avgValue) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cohort Analysis -->
    <div class="cohort-card">
      <h3>Monthly Cohorts - Revenue Per User Trend</h3>
      <div class="cohort-table">
        <table>
          <thead>
            <tr>
              <th>Cohort</th>
              <th v-for="month in [1, 2, 3, 4, 5, 6]" :key="month">Month {{ month }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cohort in cohortData" :key="cohort.id">
              <td class="cohort-name">{{ cohort.name }}</td>
              <td v-for="(val, idx) in cohort.months" :key="idx" :class="val > 0 ? 'positive' : ''">
                {{ val > 0 ? 'KES ' + formatNumber(val) : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Revenue by Geography -->
    <div class="geography-card">
      <h3>Revenue by Geographic Location</h3>
      <div class="geo-grid">
        <div v-for="geo in geoRevenue" :key="geo.id" class="geo-item">
          <div class="geo-header">
            <h4>{{ geo.name }}</h4>
            <span class="geo-rank" :style="{ backgroundColor: geo.rankColor }">{{ geo.rank }}</span>
          </div>
          <div class="geo-metrics">
            <div class="metric-row">
              <span>Revenue</span>
              <span class="metric-value">KES {{ formatNumber(geo.revenue) }}</span>
            </div>
            <div class="metric-row">
              <span>Users</span>
              <span class="metric-value">{{ formatNumber(geo.users) }}</span>
            </div>
            <div class="metric-row">
              <span>Per User</span>
              <span class="metric-value">KES {{ formatNumber(geo.revenuePerUser) }}</span>
            </div>
            <div class="metric-row">
              <span>Growth</span>
              <span class="metric-value" :style="{ color: geo.growth > 0 ? '#48bb78' : '#f56565' }">
                {{ geo.growth > 0 ? '+' : '' }}{{ geo.growth }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Premium vs Standard -->
    <div class="premium-comparison-card">
      <h3>Premium vs Standard Revenue</h3>
      <div class="premium-grid">
        <div class="premium-item">
          <div class="premium-header">
            <span class="premium-label">Premium Users</span>
            <span class="premium-badge premium">PRO</span>
          </div>
          <div class="premium-stats">
            <div class="stat-row">
              <span class="stat-name">Users</span>
              <span class="stat-val">{{ formatNumber(premiumStats.users) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Revenue</span>
              <span class="stat-val">KES {{ formatNumber(premiumStats.revenue) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Per User</span>
              <span class="stat-val">KES {{ formatNumber(premiumStats.revenuePerUser) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Share</span>
              <span class="stat-val">{{ premiumStats.sharePercentage }}%</span>
            </div>
          </div>
        </div>

        <div class="premium-item">
          <div class="premium-header">
            <span class="premium-label">Standard Users</span>
            <span class="premium-badge standard">FREE</span>
          </div>
          <div class="premium-stats">
            <div class="stat-row">
              <span class="stat-name">Users</span>
              <span class="stat-val">{{ formatNumber(standardStats.users) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Revenue</span>
              <span class="stat-val">KES {{ formatNumber(standardStats.revenue) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Per User</span>
              <span class="stat-val">KES {{ formatNumber(standardStats.revenuePerUser) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Share</span>
              <span class="stat-val">{{ standardStats.sharePercentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Revenue Insights -->
    <div class="insights-card">
      <h3>Revenue Insights & Recommendations</h3>
      <div class="insights-list">
        <div v-for="insight in insights" :key="insight.id" class="insight-item">
          <div class="insight-icon" :style="{ backgroundColor: insight.color + '20', color: insight.color }">
            {{ insight.emoji }}
          </div>
          <div class="insight-content">
            <h4>{{ insight.title }}</h4>
            <p>{{ insight.description }}</p>
          </div>
          <span class="insight-impact">+{{ insight.potentialGain }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

const selectedPeriod = ref('month')

const totalRevenue = ref(8450000)
const revenueGrowth = ref(24.8)
const avgPerUser = ref(67.8)
const mrrRevenue = ref(2450000)
const avgTransaction = ref(950)

const platformRevenue = ref([
  {
    id: 1,
    name: 'Buyers App',
    revenue: 4200000,
    percentage: 49.7,
    transactions: 4423,
    growth: 18.2,
    color: '#4A90E2',
  },
  {
    id: 2,
    name: 'Riders App',
    revenue: 2800000,
    percentage: 33.1,
    transactions: 2935,
    growth: 22.5,
    color: '#FFA500',
  },
  {
    id: 3,
    name: 'Sellers App',
    revenue: 1450000,
    percentage: 17.2,
    transactions: 1525,
    growth: 12.3,
    color: '#50E3C2',
  },
])

const topCategories = ref([
  { id: 1, icon: '🛍️', name: 'Fresh Produce', revenue: 2480000, percentage: 29.3, transactions: 2604, avgValue: 952, growth: 28.5 },
  { id: 2, icon: '💼', name: 'Business Services', revenue: 1850000, percentage: 21.9, transactions: 1848, avgValue: 1001, growth: 15.3 },
  { id: 3, icon: '🚚', name: 'Delivery', revenue: 1620000, percentage: 19.2, transactions: 3240, avgValue: 500, growth: 32.1 },
  { id: 4, icon: '🏪', name: 'Retail', revenue: 1120000, percentage: 13.3, transactions: 1120, avgValue: 1000, growth: 8.4 },
  { id: 5, icon: '🎁', name: 'Premium Features', revenue: 380000, percentage: 4.5, transactions: 412, avgValue: 923, growth: 45.2 },
])

const paymentMethods = ref([
  {
    id: 1,
    icon: '💳',
    name: 'Credit/Debit Card',
    revenue: 3420000,
    percentage: 40.5,
    transactions: 3602,
    users: 42300,
    avgValue: 950,
    color: '#4A90E2',
  },
  {
    id: 2,
    icon: '📱',
    name: 'M-Pesa',
    revenue: 3100000,
    percentage: 36.7,
    transactions: 3265,
    users: 38450,
    avgValue: 950,
    color: '#50E3C2',
  },
  {
    id: 3,
    icon: '🏦',
    name: 'Bank Transfer',
    revenue: 1340000,
    percentage: 15.9,
    transactions: 1412,
    users: 12680,
    avgValue: 948,
    color: '#FFA500',
  },
  {
    id: 4,
    icon: '💰',
    name: 'Cash',
    revenue: 590000,
    percentage: 6.9,
    transactions: 620,
    users: 5430,
    avgValue: 952,
    color: '#48BB78',
  },
])

const cohortData = ref([
  { id: 1, name: 'Jan 2024', months: [450, 520, 485, 520, 510, 495] },
  { id: 2, name: 'Feb 2024', months: [0, 480, 520, 510, 545, 520] },
  { id: 3, name: 'Mar 2024', months: [0, 0, 490, 530, 525, 548] },
  { id: 4, name: 'Apr 2024', months: [0, 0, 0, 510, 535, 555] },
  { id: 5, name: 'May 2024', months: [0, 0, 0, 0, 520, 565] },
])

const geoRevenue = ref([
  { id: 1, name: 'Nairobi', revenue: 4200000, users: 68420, revenuePerUser: 61.4, growth: 18.2, rank: '1st', rankColor: '#FFD700' },
  { id: 2, name: 'Mombasa', revenue: 1820000, users: 24350, revenuePerUser: 74.7, growth: 12.5, rank: '2nd', rankColor: '#C0C0C0' },
  { id: 3, name: 'Kisumu', revenue: 1120000, users: 18690, revenuePerUser: 59.9, growth: 8.3, rank: '3rd', rankColor: '#CD7F32' },
  { id: 4, name: 'Nakuru', revenue: 310000, users: 12680, revenuePerUser: 24.4, growth: -5.2, rank: '4th', rankColor: '#A9A9A9' },
])

const premiumStats = ref({
  users: 12450,
  revenue: 3920000,
  revenuePerUser: 315.0,
  sharePercentage: 46,
})

const standardStats = ref({
  users: 111630,
  revenue: 4530000,
  revenuePerUser: 40.6,
  sharePercentage: 54,
})

const insights = ref([
  {
    id: 1,
    emoji: '📈',
    color: '#50E3C2',
    title: 'Premium Growth Opportunity',
    description: 'Premium users generate 7.7x more revenue. Converting 5% more users could add KES 200K monthly.',
    potentialGain: 12,
  },
  {
    id: 2,
    emoji: '🎯',
    color: '#4A90E2',
    title: 'M-Pesa Adoption',
    description: 'M-Pesa provides 36.7% of revenue with slightly higher transaction volume. Optimize payment flow.',
    potentialGain: 8,
  },
  {
    id: 3,
    emoji: '🌍',
    color: '#FFA500',
    title: 'Geographic Expansion',
    description: 'Nairobi users spend 2.5x more per user. Expand to tier-2 cities with targeted campaigns.',
    potentialGain: 15,
  },
  {
    id: 4,
    emoji: '💡',
    color: '#48BB78',
    title: 'Cross-Sell Strategy',
    description: 'Fresh Produce leads at 29.3%. Bundle with Premium Features to increase basket size.',
    potentialGain: 6,
  },
])

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(Math.round(num))
}

const exportReport = () => {
  // Simulate export
  alert('Revenue report exported to your downloads folder')
}

const initCharts = () => {
  // Revenue Trend Chart
  const trendCtx = document.getElementById('revenue-trend-chart')
  if (trendCtx) {
    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        datasets: [
          {
            label: 'Revenue (KES M)',
            data: [1.8, 2.1, 2.4, 2.8, 2.6],
            borderColor: '#FFA500',
            backgroundColor: 'rgba(255, 165, 0, 0.05)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#FFA500',
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

  // Revenue by Source Chart
  const sourceCtx = document.getElementById('revenue-source-chart')
  if (sourceCtx) {
    new Chart(sourceCtx, {
      type: 'doughnut',
      data: {
        labels: ['Buyers', 'Riders', 'Sellers'],
        datasets: [
          {
            data: [4200000, 2800000, 1450000],
            backgroundColor: ['#4A90E2', '#FFA500', '#50E3C2'],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true, position: 'bottom' },
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
.revenue-analytics {
  padding: 2rem;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background-color: white;
}

.btn-export {
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-export:hover {
  background-color: #2d3748;
}

.revenue-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.revenue-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e2e8f0;
}

.revenue-card.primary {
  border-left-color: #4a5568;
}

.revenue-card.accent {
  border-left-color: #ffa500;
}

.revenue-card.success {
  border-left-color: #50e3c2;
}

.card-icon {
  font-size: 2rem;
  min-width: 56px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.813rem;
  color: #718096;
  font-weight: 500;
}

.value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
}

.change {
  font-size: 0.75rem;
  font-weight: 500;
}

.change.positive {
  color: #48bb78;
}

.charts-section {
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

.platform-revenue-card,
.category-revenue-card,
.payment-method-card,
.cohort-card,
.geography-card,
.premium-comparison-card,
.insights-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.platform-revenue-card h3,
.category-revenue-card h3,
.payment-method-card h3,
.cohort-card h3,
.geography-card h3,
.premium-comparison-card h3,
.insights-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 1.5rem 0;
}

.platform-breakdown {
  display: grid;
  gap: 1rem;
}

.platform-revenue-item {
  padding: 1.25rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.platform-info {
  margin-bottom: 1rem;
}

.platform-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.platform-name {
  font-weight: 600;
  color: #1a202c;
}

.platform-percentage {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.platform-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
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

.category-table {
  overflow-x: auto;
}

.category-table table {
  width: 100%;
  border-collapse: collapse;
}

.category-table thead {
  background-color: #f7fafc;
  border-bottom: 2px solid #e2e8f0;
}

.category-table th {
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  font-size: 0.813rem;
  color: #4a5568;
  text-transform: uppercase;
}

.category-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #2d3748;
}

.category-table tbody tr:hover {
  background-color: #f7fafc;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-icon {
  font-size: 1.2rem;
}

.percentage-bar {
  display: inline-block;
  width: 100px;
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-right: 0.5rem;
}

.percentage-fill {
  height: 100%;
  background-color: #50e3c2;
}

.growth-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.growth-badge.positive {
  background-color: #c6f6d5;
  color: #22543d;
}

.growth-badge.negative {
  background-color: #fed7d7;
  color: #742a2a;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.payment-item {
  padding: 1.25rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.payment-name {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.payment-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.payment-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #1a202c;
}

.payment-info p {
  margin: 0;
  font-size: 0.75rem;
  color: #718096;
}

.payment-percentage {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1a202c;
}

.payment-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  font-size: 0.75rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric span:first-child {
  color: #718096;
}

.value {
  font-weight: 600;
  color: #1a202c;
}

.cohort-table {
  overflow-x: auto;
}

.cohort-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.cohort-table thead {
  background-color: #f7fafc;
  border-bottom: 2px solid #e2e8f0;
}

.cohort-table th {
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
}

.cohort-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  color: #718096;
}

.cohort-table td.positive {
  color: #48bb78;
  font-weight: 600;
}

.cohort-name {
  font-weight: 600;
  color: #1a202c;
}

.geo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.geo-item {
  padding: 1.25rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.geo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.geo-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #1a202c;
  font-weight: 600;
}

.geo-rank {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1a202c;
}

.geo-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.metric-row span:first-child {
  color: #718096;
}

.metric-value {
  font-weight: 600;
  color: #1a202c;
}

.premium-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.premium-item {
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.premium-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.premium-label {
  font-weight: 600;
  color: #1a202c;
}

.premium-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.premium-badge.premium {
  background-color: #ffd700;
  color: #1a202c;
}

.premium-badge.standard {
  background-color: #e2e8f0;
  color: #4a5568;
}

.premium-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.stat-name {
  color: #718096;
}

.stat-val {
  font-weight: 600;
  color: #1a202c;
}

.insights-list {
  display: grid;
  gap: 1rem;
}

.insight-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  align-items: flex-start;
}

.insight-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.insight-content {
  flex: 1;
}

.insight-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #1a202c;
}

.insight-content p {
  margin: 0;
  font-size: 0.813rem;
  color: #718096;
}

.insight-impact {
  font-weight: 600;
  font-size: 0.95rem;
  min-width: 80px;
  text-align: right;
}

@media (max-width: 768px) {
  .revenue-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .payment-methods,
  .platform-breakdown,
  .geo-grid,
  .premium-grid {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
