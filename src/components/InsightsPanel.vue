<template>
  <div class="insights-panel">
    <!-- Panel Header -->
    <div class="panel-header">
      <h2>📈 Business Insights & Recommendations</h2>
      <button class="refresh-btn" @click="refreshInsights">🔄 Refresh</button>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-nav">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['tab-btn', { active: activeTab === tab }]"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Content Tabs -->
    <div class="tabs-content">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'Overview'" class="tab-pane active">
        <div class="insights-list">
          <!-- Growth Insight -->
          <div class="insight-item success">
            <div class="insight-icon">📈</div>
            <div class="insight-content">
              <h3>Strong Growth Momentum</h3>
              <p>Platform revenue up 24% YoY. This momentum is driven by 18% order growth and 12% user acquisition.</p>
              <div class="insight-metrics">
                <span class="badge green">+24% Revenue</span>
                <span class="badge blue">+18% Orders</span>
                <span class="badge purple">+12% Users</span>
              </div>
            </div>
          </div>

          <!-- Performance Insight -->
          <div class="insight-item info">
            <div class="insight-icon">⭐</div>
            <div class="insight-content">
              <h3>User Satisfaction Rising</h3>
              <p>Overall platform rating improved to 4.72/5.0, up 0.15 points. Premium members show 8% higher satisfaction.</p>
              <div class="insight-metrics">
                <span class="badge blue">4.72★ Rating</span>
                <span class="badge green">↑ +0.15</span>
                <span class="badge purple">Premium: 8% higher</span>
              </div>
            </div>
          </div>

          <!-- Retention Insight -->
          <div class="insight-item warning">
            <div class="insight-icon">👥</div>
            <div class="insight-content">
              <h3>Customer Retention Stable</h3>
              <p>68.5% retention rate. Consider targeted retention campaigns for inactive users (14K churned last month).</p>
              <div class="insight-metrics">
                <span class="badge blue">68.5% Retention</span>
                <span class="badge orange">14K Churned</span>
                <span class="badge green">Action: Re-engagement</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Opportunities Tab -->
      <div v-if="activeTab === 'Opportunities'" class="tab-pane active">
        <div class="opportunities-list">
          <!-- High-Potential Sellers -->
          <div class="opportunity-card">
            <div class="opportunity-header">
              <h3>🍔 High-Potential Sellers</h3>
              <span class="priority-high">HIGH PRIORITY</span>
            </div>
            <div class="opportunity-body">
              <p>35 sellers show strong growth signals but haven't reached premium status yet. These can generate additional TSH 8-12M with targeted support.</p>
              <div class="opportunity-details">
                <div class="detail-row">
                  <span>Current status:</span>
                  <strong>35 eligible sellers</strong>
                </div>
                <div class="detail-row">
                  <span>Potential revenue:</span>
                  <strong>TSH 8-12M additional</strong>
                </div>
                <div class="detail-row">
                  <span>Action:</span>
                  <strong>Personalized onboarding</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Rider Expansion -->
          <div class="opportunity-card">
            <div class="opportunity-header">
              <h3>🚴 Rider Supply Gap</h3>
              <span class="priority-high">HIGH PRIORITY</span>
            </div>
            <div class="opportunity-body">
              <p>Peak hour delivery demand exceeds supply by 20-30%. Recruiting 200 new riders can capture TSH 15M+ annual revenue.</p>
              <div class="opportunity-details">
                <div class="detail-row">
                  <span>Gap at peak:</span>
                  <strong>20-30% undersupply</strong>
                </div>
                <div class="detail-row">
                  <span>Riders needed:</span>
                  <strong>~200 additional</strong>
                </div>
                <div class="detail-row">
                  <span>Potential revenue:</span>
                  <strong>TSH 15M+/year</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Premium Tier Expansion -->
          <div class="opportunity-card">
            <div class="opportunity-header">
              <h3>💎 Premium Membership Growth</h3>
              <span class="priority-medium">MEDIUM PRIORITY</span>
            </div>
            <div class="opportunity-body">
              <p>Currently 1,200 premium members (4.8% penetration). Increasing to 8% penetration = TSH 3.5M additional MRR.</p>
              <div class="opportunity-details">
                <div class="detail-row">
                  <span>Current penetration:</span>
                  <strong>4.8% (1,200 members)</strong>
                </div>
                <div class="detail-row">
                  <span>Target penetration:</span>
                  <strong>8% (1,900 members)</strong>
                </div>
                <div class="detail-row">
                  <span>Additional MRR:</span>
                  <strong>TSH 3.5M</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts Tab -->
      <div v-if="activeTab === 'Alerts'" class="tab-pane active">
        <div class="alerts-list">
          <!-- Critical Alert -->
          <div class="alert-item critical">
            <div class="alert-icon">🚨</div>
            <div class="alert-content">
              <h3>Payment Gateway Latency Spike</h3>
              <p>Last 2 hours: 145ms avg response time (normal: 85ms). 3 payment failures. Check payment processor status.</p>
              <div class="alert-actions">
                <button class="action-btn">View Details</button>
                <button class="action-btn secondary">Acknowledge</button>
              </div>
            </div>
          </div>

          <!-- Warning Alert -->
          <div class="alert-item warning">
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
              <h3>High Churn in Rider Segment</h3>
              <p>8 riders marked inactive today. Silver tier riders showing 15% monthly churn. Review compensation structure.</p>
              <div class="alert-actions">
                <button class="action-btn">View Riders</button>
                <button class="action-btn secondary">Acknowledge</button>
              </div>
            </div>
          </div>

          <!-- Info Alert -->
          <div class="alert-item info">
            <div class="alert-icon">ℹ️</div>
            <div class="alert-content">
              <h3>Scheduled Maintenance Tonight</h3>
              <p>Database optimization scheduled 11 PM - 1 AM EST. Expected downtime: 15-20 minutes. Users will be notified.</p>
              <div class="alert-actions">
                <button class="action-btn">View Schedule</button>
                <button class="action-btn secondary">Acknowledge</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations Tab -->
      <div v-if="activeTab === 'Recommendations'" class="tab-pane active">
        <div class="recommendations-list">
          <!-- Quick Win Recommendations -->
          <div class="recommendation-section">
            <h3 class="section-title">⚡ Quick Wins (Can implement today)</h3>
            
            <div class="recommendation-item">
              <div class="rec-priority">P1</div>
              <div class="rec-content">
                <h4>Promotional Campaign: Weekend Rush</h4>
                <p>Launch 20% discount on Fridays/Saturdays. Historical data shows 45% upsell during weekends. Est. additional TSH 2.5M/month.</p>
                <div class="rec-meta">
                  <span class="tag">Marketing</span>
                  <span class="tag">High ROI</span>
                  <span class="impact">Est. Impact: +TSH 2.5M</span>
                </div>
              </div>
            </div>

            <div class="recommendation-item">
              <div class="rec-priority">P1</div>
              <div class="rec-content">
                <h4>Retention Email Campaign</h4>
                <p>Target 14K churned users with re-engagement offers. Typical recovery rate: 8-12%. Est. revenue recovery: TSH 3.2M.</p>
                <div class="rec-meta">
                  <span class="tag">Retention</span>
                  <span class="tag">Low Cost</span>
                  <span class="impact">Est. Impact: +TSH 3.2M</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Strategic Recommendations -->
          <div class="recommendation-section">
            <h3 class="section-title">🎯 Strategic Initiatives (1-3 months)</h3>
            
            <div class="recommendation-item">
              <div class="rec-priority">P2</div>
              <div class="rec-content">
                <h4>Seller Onboarding Optimization</h4>
                <p>Streamline seller signup process. Current: 8 steps, 35 min to complete. Target: 3 steps, 5 min. Est. 30% more seller conversion.</p>
                <div class="rec-meta">
                  <span class="tag">Growth</span>
                  <span class="tag">Product</span>
                  <span class="impact">Est. Impact: +35 sellers, TSH 8M</span>
                </div>
              </div>
            </div>

            <div class="recommendation-item">
              <div class="rec-priority">P2</div>
              <div class="rec-content">
                <h4>AI-Based Dynamic Pricing</h4>
                <p>Implement demand-based delivery fee pricing. Peak hours: +30% delivery fees. Estimated additional TSH 5M+ annually.</p>
                <div class="rec-meta">
                  <span class="tag">Revenue</span>
                  <span class="tag">AI/ML</span>
                  <span class="impact">Est. Impact: +TSH 5M/year</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref('Overview');
const tabs = ['Overview', 'Opportunities', 'Alerts', 'Recommendations'];

const refreshInsights = () => {
  console.log('Refreshing insights...');
  // Simulate refresh
  alert('Insights refreshed successfully');
};
</script>

<style scoped lang="scss">
.insights-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;

  h2 {
    font-size: 18px;
    font-weight: 700;
    color: #1a237e;
    margin: 0;
  }

  .refresh-btn {
    padding: 8px 16px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: background 0.2s;

    &:hover {
      background: #1565c0;
    }
  }
}

.tabs-nav {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;

  .tab-btn {
    flex: 1;
    padding: 14px 16px;
    border: none;
    background: transparent;
    color: #666;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 3px solid transparent;

    &:hover {
      color: #1976d2;
    }

    &.active {
      color: #1976d2;
      border-bottom-color: #1976d2;
    }
  }
}

.tabs-content {
  padding: 20px;
  min-height: 400px;
}

.tab-pane {
  display: none;

  &.active {
    display: block;
    animation: fadeIn 0.2s;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

// Overview Tab
.insights-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .insight-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid #999;

    &.success {
      background: #e8f5e9;
      border-left-color: #388e3c;
    }

    &.info {
      background: #e3f2fd;
      border-left-color: #1976d2;
    }

    &.warning {
      background: #fff3e0;
      border-left-color: #f57c00;
    }

    .insight-icon {
      font-size: 32px;
      min-width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .insight-content {
      flex: 1;

      h3 {
        font-size: 14px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 6px 0;
      }

      p {
        font-size: 13px;
        color: #555;
        margin: 0 0 10px 0;
        line-height: 1.5;
      }

      .insight-metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.6);

          &.green {
            color: #388e3c;
          }

          &.blue {
            color: #1976d2;
          }

          &.purple {
            color: #7b1fa2;
          }
        }
      }
    }
  }
}

// Opportunities Tab
.opportunities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .opportunity-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;

    .opportunity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;

      h3 {
        font-size: 14px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }

      .priority-high {
        font-size: 11px;
        font-weight: 700;
        color: #d32f2f;
        background: #ffebee;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .priority-medium {
        font-size: 11px;
        font-weight: 700;
        color: #f57c00;
        background: #fff3e0;
        padding: 4px 8px;
        border-radius: 4px;
      }
    }

    .opportunity-body {
      padding: 16px;

      p {
        font-size: 13px;
        color: #555;
        margin: 0 0 12px 0;
        line-height: 1.5;
      }

      .opportunity-details {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;

          span {
            color: #666;
          }

          strong {
            color: #1a1a1a;
            font-weight: 600;
          }
        }
      }
    }
  }
}

// Alerts Tab
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .alert-item {
    display: flex;
    gap: 12px;
    padding: 14px;
    border-radius: 8px;
    border-left: 4px solid #999;

    &.critical {
      background: #ffebee;
      border-left-color: #d32f2f;
    }

    &.warning {
      background: #fff3e0;
      border-left-color: #f57c00;
    }

    &.info {
      background: #e3f2fd;
      border-left-color: #1976d2;
    }

    .alert-icon {
      font-size: 24px;
      min-width: 32px;
    }

    .alert-content {
      flex: 1;

      h3 {
        font-size: 13px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 4px 0;
      }

      p {
        font-size: 12px;
        color: #555;
        margin: 0 0 10px 0;
        line-height: 1.5;
      }

      .alert-actions {
        display: flex;
        gap: 8px;

        .action-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;

          &:not(.secondary) {
            background: #1976d2;
            color: white;

            &:hover {
              background: #1565c0;
            }
          }

          &.secondary {
            background: #f0f0f0;
            color: #333;

            &:hover {
              background: #e0e0e0;
            }
          }
        }
      }
    }
  }
}

// Recommendations Tab
.recommendations-list {
  .recommendation-section {
    margin-bottom: 24px;

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a237e;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #1976d2;
    }
  }

  .recommendation-item {
    display: flex;
    gap: 12px;
    padding: 14px;
    margin-bottom: 12px;
    background: #f9f9f9;
    border-radius: 8px;
    border-left: 4px solid #1976d2;

    .rec-priority {
      min-width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1976d2;
      color: white;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
    }

    .rec-content {
      flex: 1;

      h4 {
        font-size: 13px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 6px 0;
      }

      p {
        font-size: 12px;
        color: #555;
        margin: 0 0 10px 0;
        line-height: 1.5;
      }

      .rec-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .tag {
          font-size: 11px;
          font-weight: 600;
          background: #e0e0e0;
          color: #333;
          padding: 3px 8px;
          border-radius: 3px;
        }

        .impact {
          font-size: 11px;
          font-weight: 700;
          color: #388e3c;
          margin-left: auto;
        }
      }
    }
  }
}
</style>
