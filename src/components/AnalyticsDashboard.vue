<template>
  <div class="analytics-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>📊 Platform Analytics Dashboard</h1>
      <div class="header-controls">
        <select v-model="selectedPeriod" @change="updateData" class="period-select">
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card blue">
        <div class="metric-label">Total Orders</div>
        <div class="metric-value">12,847</div>
        <div class="metric-change">↑ +18% vs previous</div>
      </div>
      <div class="metric-card green">
        <div class="metric-label">Total Revenue</div>
        <div class="metric-value">TSH 42.5M</div>
        <div class="metric-change">↑ +24% vs previous</div>
      </div>
      <div class="metric-card purple">
        <div class="metric-label">Active Users</div>
        <div class="metric-value">8,324</div>
        <div class="metric-change">↑ +12% vs previous</div>
      </div>
      <div class="metric-card amber">
        <div class="metric-label">Avg Order Value</div>
        <div class="metric-value">TSH 3,310</div>
        <div class="metric-change">↑ +5% vs previous</div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Revenue Trend -->
      <div class="chart-container">
        <h2>💰 Revenue Trend</h2>
        <div class="chart-placeholder">
          <div class="mini-bars" aria-label="Revenue trend preview">
            <span
              v-for="point in revenueSeries"
              :key="point.label"
              class="mini-bars__bar"
              :style="{ height: `${point.height}%` }"
              :title="`${point.label}: ${point.valueLabel}`"
            ></span>
          </div>
        </div>
        <div class="chart-stats">
          <span>Peak: TSH 2.1M (Day 15)</span>
          <span>Avg: TSH 1.4M/day</span>
          <span>Min: TSH 800K (Day 22)</span>
        </div>
      </div>

      <!-- Orders Distribution -->
      <div class="chart-container">
        <h2>📦 Orders by Platform</h2>
        <div class="pie-chart">
          <div class="pie-item" style="width: 45%; background: #1976d2;">
            <span>Buyers: 45% (5,781)</span>
          </div>
          <div class="pie-item" style="width: 30%; background: #388e3c;">
            <span>Riders: 30% (3,854)</span>
          </div>
          <div class="pie-item" style="width: 25%; background: #f57c00;">
            <span>Sellers: 25% (3,212)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Insights -->
    <div class="insights-section">
      <!-- User Metrics -->
      <div class="insight-card">
        <h2>👥 User Analytics</h2>
        <table class="metric-table">
          <tr>
            <td>Total Users</td>
            <td class="value">24,856</td>
            <td class="change">↑ +15%</td>
          </tr>
          <tr>
            <td>New Users</td>
            <td class="value">2,145</td>
            <td class="change">↑ +28%</td>
          </tr>
          <tr>
            <td>Active Today</td>
            <td class="value">8,324</td>
            <td class="change">↑ +12%</td>
          </tr>
          <tr>
            <td>Retention Rate</td>
            <td class="value">68.5%</td>
            <td class="change">↑ +3.2%</td>
          </tr>
        </table>
      </div>

      <!-- Restaurant/Seller Metrics -->
      <div class="insight-card">
        <h2>🍽️ Seller Metrics</h2>
        <table class="metric-table">
          <tr>
            <td>Total Sellers</td>
            <td class="value">342</td>
            <td class="change">↑ +8%</td>
          </tr>
          <tr>
            <td>Active Sellers</td>
            <td class="value">285</td>
            <td class="change">→ 83% Active</td>
          </tr>
          <tr>
            <td>Avg Orders/Seller</td>
            <td class="value">37.5</td>
            <td class="change">↑ +6%</td>
          </tr>
          <tr>
            <td>Top Seller Revenue</td>
            <td class="value">TSH 2.8M</td>
            <td class="change">↑ +18%</td>
          </tr>
        </table>
      </div>

      <!-- Delivery Metrics -->
      <div class="insight-card">
        <h2>🚴 Rider Metrics</h2>
        <table class="metric-table">
          <tr>
            <td>Total Riders</td>
            <td class="value">1,847</td>
            <td class="change">↑ +22%</td>
          </tr>
          <tr>
            <td>Active Riders</td>
            <td class="value">845</td>
            <td class="change">→ 46% Active</td>
          </tr>
          <tr>
            <td>Avg Rating</td>
            <td class="value">4.72</td>
            <td class="change">↑ +0.15</td>
          </tr>
          <tr>
            <td>Total Deliveries</td>
            <td class="value">12,847</td>
            <td class="change">Avg: 15.2 each</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Top Performers -->
    <div class="performance-section">
      <div class="performance-card">
        <h2>⭐ Top 5 Sellers</h2>
        <div class="leaderboard">
          <div class="leaderboard-item">
            <span class="rank">1.</span>
            <span class="name">Mama Halima Restaurant</span>
            <span class="value">TSH 2.8M</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">2.</span>
            <span class="name">ABC Pizza House</span>
            <span class="value">TSH 2.4M</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">3.</span>
            <span class="name">Samaki Express</span>
            <span class="value">TSH 2.1M</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">4.</span>
            <span class="name">Tandoori Master</span>
            <span class="value">TSH 1.9M</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">5.</span>
            <span class="name">Java Cafe</span>
            <span class="value">TSH 1.7M</span>
          </div>
        </div>
      </div>

      <div class="performance-card">
        <h2>🏃 Top 5 Riders</h2>
        <div class="leaderboard">
          <div class="leaderboard-item">
            <span class="rank">1.</span>
            <span class="name">Ahmed Mohamed</span>
            <span class="value">287 orders, 4.95★</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">2.</span>
            <span class="name">Fatima Hassan</span>
            <span class="value">264 orders, 4.92★</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">3.</span>
            <span class="name">Ibrahim Ali</span>
            <span class="value">248 orders, 4.88★</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">4.</span>
            <span class="name">Zainab Osman</span>
            <span class="value">232 orders, 4.85★</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">5.</span>
            <span class="name">Hassan Juma</span>
            <span class="value">215 orders, 4.82★</span>
          </div>
        </div>
      </div>

      <div class="performance-card">
        <h2>🎯 Top 5 Customers</h2>
        <div class="leaderboard">
          <div class="leaderboard-item">
            <span class="rank">1.</span>
            <span class="name">User 4827 (Premium)</span>
            <span class="value">84 orders, TSH 312K</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">2.</span>
            <span class="name">User 2314</span>
            <span class="value">62 orders, TSH 198K</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">3.</span>
            <span class="name">User 5634 (Premium)</span>
            <span class="value">58 orders, TSH 187K</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">4.</span>
            <span class="name">User 3872</span>
            <span class="value">42 orders, TSH 154K</span>
          </div>
          <div class="leaderboard-item">
            <span class="rank">5.</span>
            <span class="name">User 1945</span>
            <span class="value">38 orders, TSH 142K</span>
          </div>
        </div>
      </div>
    </div>

    <!-- System Health -->
    <div class="health-section">
      <div class="health-card">
        <h2>💊 System Health</h2>
        <div class="health-indicators">
          <div class="health-item">
            <span class="label">API Uptime</span>
            <span class="status status-good">99.97%</span>
          </div>
          <div class="health-item">
            <span class="label">Avg Response Time</span>
            <span class="status status-good">142ms</span>
          </div>
          <div class="health-item">
            <span class="label">Payment Success Rate</span>
            <span class="status status-good">99.8%</span>
          </div>
          <div class="health-item">
            <span class="label">DB Performance</span>
            <span class="status status-good">Healthy</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const selectedPeriod = ref('30d')

const revenueTemplates: Record<string, number[]> = {
  '7d': [62, 74, 68, 85, 79, 92, 88],
  '30d': [42, 54, 49, 63, 58, 72, 69, 77, 74, 68, 82, 85],
  '90d': [36, 44, 53, 61, 58, 66, 72, 78, 81, 76, 84, 91],
  '1y': [28, 31, 37, 42, 48, 51, 55, 61, 66, 72, 78, 86],
}

const updateData = () => {
  console.log('Period changed to:', selectedPeriod.value)
}

const revenueSeries = computed(() => {
  const values = revenueTemplates[selectedPeriod.value] ?? revenueTemplates['30d']
  return values.map((value, index) => ({
    label: `Point ${index + 1}`,
    height: value,
    valueLabel: `TSH ${(value / 40).toFixed(1)}M`,
  }))
})
</script>

<style scoped lang="scss">
.analytics-dashboard {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1a237e;
    margin: 0;
  }

  .header-controls {
    display: flex;
    gap: 16px;
  }

  .period-select {
    padding: 8px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    background: white;

    &:hover {
      border-color: #1976d2;
    }
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;

  .metric-card {
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #999;

    &.blue {
      border-left-color: #1976d2;
    }
    &.green {
      border-left-color: #388e3c;
    }
    &.purple {
      border-left-color: #7b1fa2;
    }
    &.amber {
      border-left-color: #f57c00;
    }

    .metric-label {
      font-size: 12px;
      color: #666;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .metric-change {
      font-size: 12px;
      color: #388e3c;
      font-weight: 500;
    }
  }
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }

  .chart-container {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1a237e;
      margin: 0 0 16px 0;
    }

    .chart-placeholder {
      height: 280px;
      background: #f9f9f9;
      border-radius: 8px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mini-bars {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(16px, 1fr));
      align-items: end;
      gap: 10px;
      width: 100%;
      height: 100%;
      padding: 12px 0;
    }

    .mini-bars__bar {
      display: block;
      min-height: 48px;
      border-radius: 999px 999px 8px 8px;
      background: linear-gradient(180deg, #1976d2 0%, #5da9ff 100%);
      box-shadow: 0 10px 18px rgba(25, 118, 210, 0.16);
    }

    .chart-stats {
      display: flex;
      justify-content: space-around;
      gap: 12px;
      font-size: 12px;
      color: #666;

      span {
        flex: 1;
        text-align: center;
      }
    }

    .pie-chart {
      display: flex;
      height: 200px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 12px;

      .pie-item {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 13px;
        text-align: center;

        span {
          padding: 8px;
        }
      }
    }
  }
}

.insights-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }

  .insight-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1a237e;
      margin: 0 0 16px 0;
    }

    .metric-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      tr {
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        td {
          padding: 12px 0;
          color: #333;

          &.value {
            font-weight: 700;
            color: #1976d2;
          }

          &.change {
            text-align: right;
            color: #388e3c;
            font-weight: 500;
          }
        }
      }
    }
  }
}

.performance-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }

  .performance-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1a237e;
      margin: 0 0 16px 0;
    }

    .leaderboard {
      .leaderboard-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: #f9f9f9;
        border-radius: 8px;
        font-size: 13px;
        gap: 12px;

        .rank {
          font-weight: 700;
          color: #f57c00;
          min-width: 24px;
        }

        .name {
          flex: 1;
          color: #333;
        }

        .value {
          font-weight: 600;
          color: #1976d2;
          text-align: right;
        }
      }
    }
  }
}

.health-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .health-card {
    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1a237e;
      margin: 0 0 16px 0;
    }

    .health-indicators {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      .health-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .label {
          font-size: 12px;
          color: #666;
          font-weight: 600;
        }

        .status {
          font-size: 16px;
          font-weight: 700;
          padding: 8px;
          border-radius: 6px;
          text-align: center;

          &.status-good {
            color: #388e3c;
            background: #e8f5e9;
          }

          &.status-warning {
            color: #f57c00;
            background: #fff3e0;
          }

          &.status-error {
            color: #d32f2f;
            background: #ffebee;
          }
        }
      }
    }
  }
}
</style>
