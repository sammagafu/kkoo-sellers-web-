<template>
  <div class="wallet-management">
    <!-- Header -->
    <div class="header-section mb-4">
      <h2 class="mb-2">💳 Wallet Management</h2>
      <p class="text-muted">Monitor user wallets and process transactions</p>
    </div>

    <!-- Stats Cards -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="stat-card card shadow-sm">
          <div class="card-body">
            <small class="text-muted">Total Wallet Balance</small>
            <h3 class="mt-2">TSH {{ (totalBalance / 1000000).toFixed(1) }}M</h3>
            <small class="text-success">➜ +5% week</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card card shadow-sm">
          <div class="card-body">
            <small class="text-muted">Active Users</small>
            <h3 class="mt-2">{{ activeWalletUsers }}</h3>
            <small class="text-primary">with balance</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card card shadow-sm">
          <div class="card-body">
            <small class="text-muted">Pending Withdrawals</small>
            <h3 class="mt-2">{{ pendingWithdrawals }}</h3>
            <small class="text-warning">{{ pendingAmount }} TSH</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card card shadow-sm">
          <div class="card-body">
            <small class="text-muted">Daily Deposits</small>
            <h3 class="mt-2">{{ dailyDeposits }}</h3>
            <small class="text-info">{{ dailyDepositAmount }} TSH</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="card shadow-sm">
      <div class="card-body">
        <ul class="nav nav-tabs mb-3" role="tablist">
          <li class="nav-item">
            <a
              class="nav-link active"
              data-bs-toggle="tab"
              href="#transactions"
              role="tab"
            >
              Recent Transactions
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              data-bs-toggle="tab"
              href="#users"
              role="tab"
            >
              User Wallets
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              data-bs-toggle="tab"
              href="#admin"
              role="tab"
            >
              Admin Actions
            </a>
          </li>
        </ul>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Transactions Tab -->
          <div id="transactions" class="tab-pane fade show active" role="tabpanel">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tx in recentTransactions" :key="tx.id">
                    <td>{{ tx.user_phone }}</td>
                    <td>
                      <span v-if="tx.type === 'deposit'" class="badge bg-success"
                        >Deposit</span
                      >
                      <span v-else-if="tx.type === 'withdrawal'" class="badge bg-warning"
                        >Withdrawal</span
                      >
                      <span v-else class="badge bg-primary">{{ tx.type }}</span>
                    </td>
                    <td>
                      <strong>{{ formatCurrency(tx.amount) }}</strong>
                    </td>
                    <td>
                      <span
                        :class="{
                          'badge bg-success': tx.status === 'completed',
                          'badge bg-warning': tx.status === 'pending',
                          'badge bg-danger': tx.status === 'failed'
                        }"
                      >
                        {{ tx.status }}
                      </span>
                    </td>
                    <td>{{ formatDate(tx.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Users Tab -->
          <div id="users" class="tab-pane fade" role="tabpanel">
            <div class="mb-3">
              <input
                v-model="searchUser"
                type="text"
                class="form-control form-control-sm"
                placeholder="Search by phone or username..."
              />
            </div>
            <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Phone</th>
                    <th>Balance</th>
                    <th>Total Deposited</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in filteredUsers" :key="user.id">
                    <td><strong>{{ user.phone }}</strong></td>
                    <td>{{ formatCurrency(user.balance) }}</td>
                    <td>{{ formatCurrency(user.total_deposited) }}</td>
                    <td>
                      <span
                        :class="{
                          'badge bg-success': user.balance > 0,
                          'badge bg-secondary': user.balance === 0
                        }"
                      >
                        {{ user.balance > 0 ? 'Active' : 'Empty' }}
                      </span>
                    </td>
                    <td>
                      <button
                        class="btn btn-xs btn-primary"
                        @click="editUserBalance(user)"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Admin Actions Tab -->
          <div id="admin" class="tab-pane fade" role="tabpanel">
            <div class="row mb-4">
              <div class="col-md-6">
                <div class="card bg-light">
                  <div class="card-body">
                    <h5 class="card-title">Manual Balance Adjustment</h5>
                    <div class="mb-3">
                      <label class="form-label">User Phone</label>
                      <input
                        v-model="adminForm.phone"
                        type="tel"
                        class="form-control"
                        placeholder="+255712999001"
                      />
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Amount (TSH)</label>
                      <input
                        v-model.number="adminForm.amount"
                        type="number"
                        class="form-control"
                        placeholder="50000"
                      />
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Reason</label>
                      <select v-model="adminForm.reason" class="form-select">
                        <option value="">Select reason...</option>
                        <option value="refund">Refund</option>
                        <option value="bonus">Bonus</option>
                        <option value="correction">Correction</option>
                        <option value="promotion">Promotion</option>
                      </select>
                    </div>
                    <button class="btn btn-primary w-100" @click="adjustBalance">
                      Adjust Balance
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card bg-light">
                  <div class="card-body">
                    <h5 class="card-title">Withdrawal Processing</h5>
                    <p class="text-muted mb-3">
                      Manage pending withdrawal requests
                    </p>
                    <div v-for="wd in pendingWithdrawalsList" :key="wd.id" class="mb-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <span>
                          <strong>{{ wd.user_phone }}</strong><br />
                          {{ formatCurrency(wd.amount) }}
                        </span>
                        <div>
                          <button
                            class="btn btn-sm btn-success me-1"
                            @click="approveWithdrawal(wd.id)"
                          >
                            ✓
                          </button>
                          <button
                            class="btn btn-sm btn-danger"
                            @click="rejectWithdrawal(wd.id)"
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                      <hr class="my-2" />
                    </div>
                  </div>
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
import { ref, onMounted, computed } from 'vue'

interface WalletTransaction {
  id: number
  user_phone: string
  type: 'deposit' | 'withdrawal' | 'payment'
  amount: number
  status: 'completed' | 'pending' | 'failed'
  created_at: string
}

interface UserWallet {
  id: number
  phone: string
  balance: number
  total_deposited: number
}

interface Withdrawal {
  id: number
  user_phone: string
  amount: number
  status: string
}

const recentTransactions = ref<WalletTransaction[]>([
  {
    id: 1,
    user_phone: '+255712999001',
    type: 'deposit',
    amount: 50000,
    status: 'completed',
    created_at: '2026-03-30T10:30:00Z'
  },
  {
    id: 2,
    user_phone: '+255715234567',
    type: 'payment',
    amount: 12000,
    status: 'completed',
    created_at: '2026-03-30T09:15:00Z'
  },
  {
    id: 3,
    user_phone: '+255719876543',
    type: 'withdrawal',
    amount: 30000,
    status: 'pending',
    created_at: '2026-03-30T08:00:00Z'
  }
])

const users = ref<UserWallet[]>([
  { id: 1, phone: '+255712999001', balance: 50000, total_deposited: 200000 },
  { id: 2, phone: '+255715234567', balance: 0, total_deposited: 100000 },
  { id: 3, phone: '+255719876543', balance: 80000, total_deposited: 500000 }
])

const pendingWithdrawalsList = ref<Withdrawal[]>([
  { id: 1, user_phone: '+255719876543', amount: 30000, status: 'pending' }
])

const searchUser = ref('')
const adminForm = ref({
  phone: '',
  amount: 0,
  reason: ''
})

const filteredUsers = computed(() => {
  if (!searchUser.value) return users.value
  return users.value.filter(
    u =>
      u.phone.includes(searchUser.value) ||
      u.phone.toLowerCase().includes(searchUser.value.toLowerCase())
  )
})

const totalBalance = computed(() => users.value.reduce((sum, u) => sum + u.balance, 0))
const activeWalletUsers = computed(() => users.value.filter(u => u.balance > 0).length)
const pendingWithdrawals = computed(() => pendingWithdrawalsList.value.length)
const pendingAmount = computed(
  () => pendingWithdrawalsList.value.reduce((sum, w) => sum + w.amount, 0)
)
const dailyDeposits = computed(
  () =>
    recentTransactions.value.filter(
      t => t.type === 'deposit' && t.status === 'completed'
    ).length
)
const dailyDepositAmount = computed(
  () =>
    recentTransactions.value
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-TZ')
}

const adjustBalance = () => {
  if (!adminForm.value.phone || adminForm.value.amount <= 0) {
    alert('Please fill in all fields')
    return
  }
  alert(
    `Balance adjusted for ${adminForm.value.phone}: ${formatCurrency(adminForm.value.amount)}`
  )
  adminForm.value = { phone: '', amount: 0, reason: '' }
}

const editUserBalance = (user: UserWallet) => {
  adminForm.value.phone = user.phone
  alert(`Edit balance for ${user.phone}`)
}

const approveWithdrawal = (withdrawalId: number) => {
  alert(`Withdrawal ${withdrawalId} approved`)
  pendingWithdrawalsList.value = pendingWithdrawalsList.value.filter(
    w => w.id !== withdrawalId
  )
}

const rejectWithdrawal = (withdrawalId: number) => {
  alert(`Withdrawal ${withdrawalId} rejected`)
  pendingWithdrawalsList.value = pendingWithdrawalsList.value.filter(
    w => w.id !== withdrawalId
  )
}

onMounted(() => {
  // Load data from backend
  console.log('Wallet management loaded')
})
</script>

<style scoped>
.wallet-management {
  padding: 1.5rem 0;
}

.stat-card {
  border-left: 4px solid #007bff;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15) !important;
}

.table-responsive {
  border-radius: 0.25rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
