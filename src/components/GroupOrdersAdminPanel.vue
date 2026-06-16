<template>
  <div class="group-orders-panel card shadow-sm">
    <div class="card-body">
      <h2 class="h5 mb-2">Group orders</h2>
      <p class="text-muted">
        Shared carts use the <strong>buyer</strong> API only. There is no admin list endpoint on Fiber.
      </p>

      <ul class="small mb-3">
        <li><code>POST /group-orders/</code> — create (seller_user_id, cutoff_at)</li>
        <li><code>POST /group-orders/join/</code> — join with share_code</li>
        <li><code>GET /group-orders/:code/</code> — detail + members + items</li>
        <li><code>GET /group-orders/mine/</code> — caller’s groups</li>
        <li><code>POST /group-orders/:code/lock/</code> — creator closes window</li>
      </ul>

      <p class="text-muted small mb-3">
        Implemented in <strong>kkoo-buyers-app</strong> (<code>GroupOrdersService</code>).
        Support / debugging: use a buyer JWT and the share code (e.g. <code>KKOOAB3X7Q</code>).
      </p>

      <p class="small mb-0">
        Reference: <code>kkooapp-backend-fiber/docs/API.md</code> §30 ·
        <code>kkoo-buyers-app/docs/API_ALIGNMENT.md</code>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Admin panel placeholder — group orders are buyer-scoped; no /admin/group-orders/ route. */
</script>

<style scoped>
.group-orders-panel {
  max-width: 720px;
}
</style>
