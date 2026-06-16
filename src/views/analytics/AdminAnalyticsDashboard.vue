<template>
  <div class="analytics-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>Analytics Dashboard</h1>
      <div class="header-controls">
        <div class="date-range-selector">
          <input type="date" v-model="dateRange.start" />
          <span>to</span>
          <input type="date" v-model="dateRange.end" />
        </div>
        <button @click="refreshData" class="btn-refresh">
          <i class="icon-refresh"></i> Refresh
        </button>
      </div>
    </div>

    <!-- KPI Cards Row 1 -->
    <div class="kpi-grid">
      <div class="kpi-card primary">
        <div class="kpi-icon">
          <i class="icon-users"></i>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Total Users</p>
          <p class="kpi-value">{{ formatNumber(metrics.totalUsers) }}</p>
          <p class="kpi-change positive">↑ 12.5% vs last month</p>
        </div>
      </div>

      <div class="kpi-card accent">
        <div class="kpi-icon">
          <i class="icon-activity"></i>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Daily Active Users</p>
          <p class="kpi-value">{{ formatNumber(metrics.dailyActiveUsers) }}</p>
          <p class="kpi-change positive">↑ 8.3% vs yesterday</p>
        </div>
      </div>

      <div class="kpi-card success">
        <div class="kpi-icon">
          <i class="icon-trending-up"></i>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Revenue</p>
          <p class="kpi-value">KES {{ formatNumber(metrics.totalRevenue) }}</p>
          <p class="kpi-change positive">↑ 24.8% vs last month</p>
        </div>
      </div>

      <div class="kpi-card info">
        <div class="kpi-icon">
          <i class="icon-target"></i>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Conversion Rate</p>
          <p class="kpi-value">{{ metrics.conversionRate }}%</p>
          <p class="kpi-change positive">↑ 2.1% vs last month</p>
        </div>
      </div>
    </div>

    <!-- KPI Cards Row 2 -->
    <div class="kpi-grid">
      <div class="kpi-card warning">
        <div class="kpi-icon">
          <i class="icon-alert"></i>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Churn Rate</p>
          <p class="kpi-value">{{ metrics.churnRate }}%</p>
          <p class="kpi-change negative">↓ -3.2% retention</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="icon-star"></i>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Avg. Rating</p>
          <p class="kpi-value">{{ metrics.avgRating }}</p>
          <p class="kpi-change positive">↑ 0.2 pts vs last month</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="icon-award"></i>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Premium Users</p>
          <p class="kpi-value">{{ formatNumber(metrics.premiumUsers) }}</p>
          <p class="kpi-change positive">↑ 34.2% vs last month</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="icon-location"></i>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Active Cities</p>
          <p class="kpi-value">{{ metrics.activeCities }}</p>
          <p class="kpi-change positive">↑ 3 new cities</p>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Revenue Trend -->
      <div class="chart-container">
        <h3>Revenue Trend</h3>
        <div class="chart-wrapper">
          <canvas id="revenue-chart"></canvas>
        </div>
      </div>

      <!-- User Growth -->
      <div class="chart-container">
        <h3>User Growth</h3>
        <div class="chart-wrapper">
          <canvas id="user-growth-chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Secondary Charts -->
    <div class="charts-section">
      <!-- Platform Distribution -->
      <div class="chart-container">
        <h3>Platform Distribution</h3>
        <div class="chart-wrapper">
          <canvas id="platform-chart"></canvas>
        </div>
      </div>

      <!-- User Segmentation -->
      <div class="chart-container">
        <h3>User Tier Distribution</h3>
        <div class="chart-wrapper">
          <canvas id="tier-chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Platform Stats Table -->
    <div class="stats-table-container">
      <h3>Platform Performance by Category</h3>
      <table class="stats-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Users</th>
            <th>Revenue</th>
            <th>Growth</th>
            <th>Avg Rating</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in platformStats" :key="stat.id">
            <td>{{ stat.category }}</td>
            <td>{{ formatNumber(stat.users) }}</td>
            <td>KES {{ formatNumber(stat.revenue) }}</td>
            <td class="growth-stat" :class="stat.growth > 0 ? 'positive' : 'negative'">
              {{ stat.growth > 0 ? '+' : '' }}{{ stat.growth }}%
            </td>
            <td>{{ stat.avgRating }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

const dateRange = ref({
  start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0],
})

const metrics = ref({
  totalUsers: 124530,
  dailyActiveUsers: 45230,
  totalRevenue: 8450000,
  conversionRate: 3.24,
  churnRate: 2.1,
  avgRating: 4.7,
  premiumUsers: 12450,
  activeCities: 24,
})

const platformStats = ref([
  {
    id: 1,
    category: 'Buyers App',
    users: 68320,
    revenue: 4200000,
    growth: 15.3,
    avgRating: 4.8,
  },
  {
    id: 2,
    category: 'Riders App',
    users: 38450,
    revenue: 2800000,
    growth: 22.1,
    avgRating: 4.6,
  },
  {
    id: 3,
    category: 'Sellers App',
    users: 17760,
    revenue: 1450000,
    growth: 8.9,
    avgRating: 4.5,
  },
])

let revenueChart = null
let userGrowthChart = null
let platformChart = null
let tierChart = null

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(Math.round(num))
}

const initCharts = () => {
  // Revenue Trend Chart
  const revenueCtx = document.getElementById('revenue-chart')
  if (revenueCtx) {
    revenueChart = new Chart(revenueCtx, {
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
            pointRadius: 4,
            pointBackgroundColor: '#FFA500',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    })
  }

  // User Growth Chart
  const userGrowthCtx = document.getElementById('user-growth-chart')
  if (userGrowthCtx) {
    userGrowthChart = new Chart(userGrowthCtx, {
      type: 'bar',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        datasets: [
          {
            label: 'New Users',
            data: [2400, 3200, 2800, 3500, 4100],
            backgroundColor: '#4A90E2',
          },
          {
            label: 'Active Users',
            data: [8200, 10200, 12100, 14300, 15200],
            backgroundColor: '#50E3C2',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
    })
  }

  // Platform Distribution Chart
  const platformCtx = document.getElementById('platform-chart')
  if (platformCtx) {
    platformChart = new Chart(platformCtx, {
      type: 'doughnut',
      data: {
        labels: ['Buyers App', 'Riders App', 'Sellers App'],
        datasets: [
          {
            label: 'Users by Platform',
            data: [68320, 38450, 17760],
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
          legend: {
            display: true,
            position: 'bottom',
          },
        },
      },
    })
  }

  // Tier Distribution Chart
  const tierCtx = document.getElementById('tier-chart')
  if (tierCtx) {
    tierChart = new Chart(tierCtx, {
      type: 'pie',
      data: {
        labels: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        datasets: [
          {
            label: 'Users by Tier',
            data: [45200, 38100, 32500, 8730],
            backgroundColor: ['#D4A574', '#C0C0C0', '#FFD700', '#E5E4E2'],
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

const refreshData = () => {
  // Simulate data refresh
  metrics.value.totalUsers += Math.floor(Math.random() * 100)
  metrics.value.dailyActiveUsers += Math.floor(Math.random() * 50)
}

onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.analytics-dashboard {
  padding: 2rem;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
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

.date-range-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.date-range-selector input {
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.875rem;
}

.btn-refresh {
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-refresh:hover {
  background-color: #2d3748;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kpi-card.primary {
  border-left: 4px solid #4a5568;
}

.kpi-card.accent {
  border-left: 4px solid #ffa500;
}

.kpi-card.success {
  border-left: 4px solid #50e3c2;
}

.kpi-card.info {
  border-left: 4px solid #4a90e2;
}

.kpi-card.warning {
  border-left: 4px solid #f6ad55;
}

.kpi-icon {
  font-size: 2rem;
  color: rgba(74, 85, 104, 0.5);
}

.kpi-content {
  flex: 1;
}

.kpi-label {
  font-size: 0.875rem;
  color: #718096;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.kpi-change {
  font-size: 0.813rem;
  margin: 0;
  font-weight: 500;
}

.kpi-change.positive {
  color: #48bb78;
}

.kpi-change.negative {
  color: #f56565;
}

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-container h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 1rem 0;
}

.chart-wrapper {
  position: relative;
  height: 300px;
}

/* Stats Table */
.stats-table-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.stats-table-container h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 1rem 0;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table thead {
  background-color: #f7fafc;
  border-bottom: 2px solid #e2e8f0;
}

.stats-table th {
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: #4a5568;
  text-transform: uppercase;
}

.stats-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.95rem;
  color: #2d3748;
}

.stats-table tbody tr:hover {
  background-color: #f7fafc;
}

.growth-stat.positive {
  color: #48bb78;
  font-weight: 600;
}

.growth-stat.negative {
  color: #f56565;
  font-weight: 600;
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-controls {
    flex-direction: column;
    width: 100%;
  }

  .date-range-selector {
    width: 100%;
  }

  .date-range-selector input {
    flex: 1;
  }
}
</style>
