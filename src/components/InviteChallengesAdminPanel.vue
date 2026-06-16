<template>
  <div class="challenges-panel">
    <!-- Header Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ totalChallenges }}</div>
        <div class="stat-label">Total Challenges</div>
        <div class="stat-icon">🎯</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ activeChallenges }}</div>
        <div class="stat-label">Active Now</div>
        <div class="stat-icon">🔥</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalParticipants }}</div>
        <div class="stat-label">Total Participants</div>
        <div class="stat-icon">👥</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgCompletion }}%</div>
        <div class="stat-label">Avg Completion</div>
        <div class="stat-icon">✅</div>
      </div>
    </div>

    <!-- Actions Bar -->
    <div class="actions-bar">
      <button class="btn-primary" @click="openCreateModal">
        ✨ Create New Challenge
      </button>
      <div class="search-filter">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search challenges..."
          class="search-input"
        />
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="expired">Expired</option>
        </select>
      </div>
    </div>

    <!-- Challenge Cards Grid -->
    <div class="challenges-grid">
      <div
        v-for="challenge in filteredChallenges"
        :key="challenge.id"
        class="challenge-card"
      >
        <div class="card-header">
          <div class="challenge-title">{{ challenge.icon }} {{ challenge.name }}</div>
          <span :class="['status-badge', challenge.status]">
            {{ challenge.status }}
          </span>
        </div>

        <p class="challenge-description">{{ challenge.description }}</p>

        <div class="challenge-stats">
          <div class="stat">
            <span class="stat-label">Participants</span>
            <span class="stat-value">{{ challenge.participants }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Completion</span>
            <span class="stat-value">{{ challenge.completionRate }}%</span>
          </div>
          <div class="stat">
            <span class="stat-label">XP Reward</span>
            <span class="stat-value">{{ challenge.xpReward }}</span>
          </div>
        </div>

        <div class="challenge-meta">
          <span v-if="challenge.endDate" class="meta-item">
            📅 {{ formatDate(challenge.endDate) }}
          </span>
          <span v-if="challenge.prize" class="meta-item">
            🎁 {{ challenge.prize }}
          </span>
        </div>

        <div class="card-actions">
          <button class="btn-icon" @click="viewAnalytics(challenge.id)" title="Analytics">
            📊
          </button>
          <button
            class="btn-icon"
            @click="openEditModal(challenge.id)"
            title="Edit"
          >
            ✏️
          </button>
          <button class="btn-icon" @click="cloneChallenge(challenge.id)" title="Clone">
            📋
          </button>
          <button
            class="btn-icon"
            @click="archiveChallenge(challenge.id)"
            title="Archive"
          >
            📦
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Challenge Modal -->
    <div v-if="showChallengeModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingId ? "Edit Challenge" : "Create Challenge" }}</h2>
          <button class="close-btn" @click="closeChallengeModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Challenge Name</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="e.g., Spring Blitz"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Icon</label>
            <input
              v-model="formData.icon"
              type="text"
              placeholder="e.g., 🎯"
              class="form-input"
              maxlength="2"
            />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea
              v-model="formData.description"
              placeholder="Challenge description..."
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>XP Reward</label>
              <input
                v-model.number="formData.xpReward"
                type="number"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Prize</label>
              <input
                v-model="formData.prize"
                type="text"
                placeholder="e.g., Restaurant coupon"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Start Date</label>
              <input
                v-model="formData.startDate"
                type="date"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input v-model="formData.endDate" type="date" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Requirement (orders to complete)</label>
            <input
              v-model.number="formData.requirement"
              type="number"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Target Audience</label>
            <div class="checkbox-group">
              <label class="checkbox">
                <input v-model="formData.audiences" type="checkbox" value="buyers" />
                Buyers
              </label>
              <label class="checkbox">
                <input v-model="formData.audiences" type="checkbox" value="riders" />
                Riders
              </label>
              <label class="checkbox">
                <input v-model="formData.audiences" type="checkbox" value="sellers" />
                Sellers
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox full-width">
              <input v-model="formData.featured" type="checkbox" />
              Featured Challenge (show on homepage)
            </label>
          </div>

          <div class="preview-section">
            <h3>Preview</h3>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-icon">{{ formData.icon }}</span>
                <span class="preview-name">{{ formData.name || "Challenge Name" }}</span>
              </div>
              <p class="preview-description">
                {{ formData.description || "Challenge description..." }}
              </p>
              <div class="preview-reward">
                <span>🏆 {{ formData.xpReward || 0 }} XP</span>
                <span v-if="formData.prize">🎁 {{ formData.prize }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeChallengeModal">
            Cancel
          </button>
          <button class="btn-primary" @click="saveChallenge">
            {{ editingId ? "Update" : "Create" }} Challenge
          </button>
        </div>
      </div>
    </div>

    <!-- Analytics Modal -->
    <div v-if="showAnalyticsModal" class="modal-overlay">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Challenge Analytics</h2>
          <button class="close-btn" @click="showAnalyticsModal = false">✕</button>
        </div>

        <div class="modal-body analytics-body">
          <div class="analytics-grid">
            <div class="analytics-card">
              <h3>Participation Rate</h3>
              <div class="analytics-value">73.5%</div>
              <div class="analytics-subtext">↑ 12% from last week</div>
            </div>
            <div class="analytics-card">
              <h3>Total Participants</h3>
              <div class="analytics-value">1,240</div>
              <div class="analytics-subtext">Active users in challenge</div>
            </div>
            <div class="analytics-card">
              <h3>Completion Rate</h3>
              <div class="analytics-value">64%</div>
              <div class="analytics-subtext">860 users completed</div>
            </div>
            <div class="analytics-card">
              <h3>Avg Time to Complete</h3>
              <div class="analytics-value">3.2h</div>
              <div class="analytics-subtext">Median time</div>
            </div>
          </div>

          <div class="analytics-section">
            <h3>Daily Participation Trend</h3>
            <div class="chart-placeholder">
              📈 Chart showing daily participation over time
            </div>
          </div>

          <div class="analytics-section">
            <h3>Audience Breakdown</h3>
            <div class="breakdown-list">
              <div class="breakdown-item">
                <span>Buyers</span>
                <div class="progress">
                  <div class="progress-bar" style="width: 60%"></div>
                </div>
                <span>60%</span>
              </div>
              <div class="breakdown-item">
                <span>Riders</span>
                <div class="progress">
                  <div class="progress-bar" style="width: 25%"></div>
                </div>
                <span>25%</span>
              </div>
              <div class="breakdown-item">
                <span>Sellers</span>
                <div class="progress">
                  <div class="progress-bar" style="width: 15%"></div>
                </div>
                <span>15%</span>
              </div>
            </div>
          </div>

          <div class="analytics-section">
            <h3>Top Rewards Claimed</h3>
            <ul class="rewards-list">
              <li>🥇 500 XP — 920 users</li>
              <li>🏅 300 XP — 640 users</li>
              <li>🎁 Restaurant coupon — 180 users</li>
            </ul>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showAnalyticsModal = false">
            Close
          </button>
          <button class="btn-primary" @click="exportAnalytics">
            📥 Export Report
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Challenge {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: "active" | "upcoming" | "expired";
  participants: number;
  completionRate: number;
  xpReward: number;
  prize: string;
  startDate: string;
  endDate: string;
  requirement: number;
  featured: boolean;
  createdAt: string;
}

// State
const searchQuery = ref("");
const filterStatus = ref("");
const showChallengeModal = ref(false);
const showAnalyticsModal = ref(false);
const editingId = ref("");

const formData = ref({
  name: "",
  icon: "🎯",
  description: "",
  xpReward: 500,
  prize: "",
  startDate: "",
  endDate: "",
  requirement: 5,
  audiences: ["buyers"],
  featured: false,
});

// Mock Challenges
const challenges = ref<Challenge[]>([
  {
    id: "chal1",
    name: "Spring Blitz",
    icon: "🌸",
    description: "Complete 5 orders in one day for bonus rewards",
    status: "active",
    participants: 1240,
    completionRate: 64,
    xpReward: 500,
    prize: "Restaurant coupon",
    startDate: "2024-03-20",
    endDate: "2024-03-31",
    requirement: 5,
    featured: true,
    createdAt: "2024-03-15",
  },
  {
    id: "chal2",
    name: "Restaurant Rush",
    icon: "🍕",
    description: "Order from 10 different restaurants for rewards",
    status: "active",
    participants: 856,
    completionRate: 52,
    xpReward: 300,
    prize: "Free delivery pass",
    startDate: "2024-03-18",
    endDate: "2024-04-07",
    requirement: 10,
    featured: true,
    createdAt: "2024-03-10",
  },
  {
    id: "chal3",
    name: "Premium Dream",
    icon: "💎",
    description: "Spend TSH 100K to unlock VIP status",
    status: "active",
    participants: 342,
    completionRate: 31,
    xpReward: 1000,
    prize: "VIP membership",
    startDate: "2024-03-01",
    endDate: "2024-04-30",
    requirement: 8,
    featured: false,
    createdAt: "2024-02-28",
  },
  {
    id: "chal4",
    name: "Rider Surge",
    icon: "🚴",
    description: "Complete 50 deliveries this month",
    status: "active",
    participants: 523,
    completionRate: 47,
    xpReward: 750,
    prize: "Gas voucher",
    startDate: "2024-03-01",
    endDate: "2024-03-31",
    requirement: 50,
    featured: false,
    createdAt: "2024-02-25",
  },
  {
    id: "chal5",
    name: "Easter Eggs",
    icon: "🐰",
    description: "Find hidden rewards by completing mini-tasks",
    status: "upcoming",
    participants: 0,
    completionRate: 0,
    xpReward: 400,
    prize: "Mystery box",
    startDate: "2024-04-01",
    endDate: "2024-04-15",
    requirement: 3,
    featured: true,
    createdAt: "2024-03-20",
  },
]);

// Computed
const totalChallenges = computed(() => challenges.value.length);
const activeChallenges = computed(
  () => challenges.value.filter((c) => c.status === "active").length
);
const totalParticipants = computed(() =>
  challenges.value.reduce((sum, c) => sum + c.participants, 0)
);
const avgCompletion = computed(() => {
  const active = challenges.value.filter((c) => c.status === "active");
  return active.length
    ? Math.round(
        active.reduce((sum, c) => sum + c.completionRate, 0) / active.length
      )
    : 0;
});

const filteredChallenges = computed(() =>
  challenges.value.filter(
    (challenge) =>
      (searchQuery.value === "" ||
        challenge.name.toLowerCase().includes(searchQuery.value.toLowerCase())) &&
      (filterStatus.value === "" || challenge.status === filterStatus.value)
  )
);

// Methods
const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const openCreateModal = () => {
  editingId.value = "";
  formData.value = {
    name: "",
    icon: "🎯",
    description: "",
    xpReward: 500,
    prize: "",
    startDate: "",
    endDate: "",
    requirement: 5,
    audiences: ["buyers"],
    featured: false,
  };
  showChallengeModal.value = true;
};

const openEditModal = (id: string) => {
  const challenge = challenges.value.find((c) => c.id === id);
  if (challenge) {
    editingId.value = id;
    formData.value = {
      name: challenge.name,
      icon: challenge.icon,
      description: challenge.description,
      xpReward: challenge.xpReward,
      prize: challenge.prize,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      requirement: challenge.requirement,
      audiences: ["buyers"],
      featured: challenge.featured,
    };
    showChallengeModal.value = true;
  }
};

const closeChallengeModal = () => {
  showChallengeModal.value = false;
  editingId.value = "";
};

const saveChallenge = () => {
  if (editingId.value) {
    const index = challenges.value.findIndex((c) => c.id === editingId.value);
    if (index !== -1) {
      challenges.value[index] = {
        ...challenges.value[index],
        ...formData.value,
        status: new Date(formData.value.endDate) > new Date() ? "active" : "expired",
      };
    }
  } else {
    challenges.value.push({
      id: `chal${Date.now()}`,
      ...formData.value,
      status: "active",
      participants: 0,
      completionRate: 0,
      createdAt: new Date().toISOString().split("T")[0],
    });
  }
  closeChallengeModal();
};

const cloneChallenge = (id: string) => {
  const challenge = challenges.value.find((c) => c.id === id);
  if (challenge) {
    challenges.value.push({
      ...challenge,
      id: `chal${Date.now()}`,
      name: `${challenge.name} (Copy)`,
      participants: 0,
      completionRate: 0,
    });
  }
};

const archiveChallenge = (id: string) => {
  const index = challenges.value.findIndex((c) => c.id === id);
  if (index !== -1) {
    challenges.value[index].status = "expired";
  }
};

const viewAnalytics = (id: string) => {
  showAnalyticsModal.value = true;
};

const exportAnalytics = () => {
  console.log("Exporting analytics...");
};
</script>

<style scoped>
.challenges-panel {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1976d2;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.stat-icon {
  font-size: 28px;
  margin-top: 8px;
}

.actions-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

.btn-primary {
  padding: 10px 16px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #1565c0;
}

.search-filter {
  display: flex;
  gap: 8px;
  flex: 1;
}

.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
}

.search-input {
  flex: 1;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.challenge-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 16px;
  transition: all 0.3s;
}

.challenge-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #1976d2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.challenge-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.upcoming {
  background: #cfe2ff;
  color: #084298;
}

.status-badge.expired {
  background: #f8d7da;
  color: #721c24;
}

.challenge-description {
  font-size: 13px;
  color: #666;
  margin: 12px 0;
  line-height: 1.4;
}

.challenge-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin: 12px 0;
  padding: 12px 0;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat .stat-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.stat .stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #1976d2;
}

.challenge-meta {
  display: flex;
  gap: 16px;
  margin: 12px 0;
  font-size: 12px;
}

.meta-item {
  color: #666;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-icon {
  flex: 1;
  padding: 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 13px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.checkbox-group {
  display: flex;
  gap: 16px;
}

.checkbox {
  display: flex;
  align-items: center;
  font-size: 13px;
  cursor: pointer;
}

.checkbox input {
  margin-right: 6px;
  cursor: pointer;
}

.checkbox.full-width {
  display: flex;
}

.preview-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.preview-section h3 {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
}

.preview-card {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  padding: 12px;
  border-radius: 4px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preview-icon {
  font-size: 20px;
}

.preview-name {
  font-weight: bold;
  font-size: 14px;
}

.preview-description {
  font-size: 12px;
  color: #666;
  margin: 8px 0;
}

.preview-reward {
  display: flex;
  gap: 12px;
  font-size: 12px;
  font-weight: 600;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-secondary {
  padding: 8px 16px;
  background: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.analytics-body {
  max-height: 70vh;
  overflow-y: auto;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.analytics-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.analytics-card:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.analytics-card:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.analytics-card:nth-child(4) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.analytics-card h3 {
  margin: 0 0 8px 0;
  font-size: 12px;
  opacity: 0.9;
}

.analytics-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
}

.analytics-subtext {
  font-size: 11px;
  opacity: 0.8;
}

.analytics-section {
  margin-bottom: 24px;
}

.analytics-section h3 {
  margin-bottom: 12px;
  font-weight: 600;
}

.chart-placeholder {
  background: #f5f5f5;
  border: 1px dashed #ddd;
  padding: 40px;
  text-align: center;
  border-radius: 4px;
  color: #999;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.breakdown-item span:first-child {
  width: 80px;
  font-weight: 600;
}

.progress {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.rewards-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rewards-list li {
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid #e0e0e0;
}

.rewards-list li:last-child {
  border-bottom: none;
}
</style>
