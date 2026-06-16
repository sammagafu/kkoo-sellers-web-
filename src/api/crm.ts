/**
 * CRM / SME Business API client.
 * Aligns with CRM_SME_DAR_SPEC.md: businesses, customers, products (inventory), invoices,
 * debts, expenses, suppliers, purchase_orders, employees.
 * Base path: /crm/ (backend may expose these under /api/v1/crm/ when implemented).
 */
import client from './client'

const prefix = '/crm'

export const crmApi = {
  // Businesses (multi-tenant)
  getBusinesses(params?: { owner_id?: number; page?: number; page_size?: number }) {
    return client.get(`${prefix}/businesses/`, { params })
  },
  getBusiness(id: number | string) {
    return client.get(`${prefix}/businesses/${id}/`)
  },
  createBusiness(data: Record<string, unknown>) {
    return client.post(`${prefix}/businesses/`, data)
  },
  updateBusiness(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/businesses/${id}/`, data)
  },
  getBusinessMembers(businessId: number | string) {
    return client.get(`${prefix}/businesses/${businessId}/members/`)
  },
  addBusinessMember(businessId: number | string, data: { user_id: number; role: string }) {
    return client.post(`${prefix}/businesses/${businessId}/members/`, data)
  },
  updateBusinessMemberRole(businessId: number | string, userId: number, data: { role: string }) {
    return client.patch(`${prefix}/businesses/${businessId}/members/${userId}/`, data)
  },
  removeBusinessMember(businessId: number | string, userId: number) {
    return client.delete(`${prefix}/businesses/${businessId}/members/${userId}/`)
  },
  transferOwnership(businessId: number | string, data: { new_owner_user_id: number }) {
    return client.post(`${prefix}/businesses/${businessId}/transfer-ownership/`, data)
  },

  // Invitations (owner or business admin can create/list/revoke; backend should notify company admin and all is_superuser on create/revoke)
  getBusinessInvitations(businessId: number | string) {
    return client.get(`${prefix}/businesses/${businessId}/invitations/`)
  },
  createBusinessInvitation(businessId: number | string, data: { email: string; role: string }) {
    return client.post(`${prefix}/businesses/${businessId}/invitations/`, data)
  },
  revokeBusinessInvitation(businessId: number | string, invitationId: number | string) {
    return client.delete(`${prefix}/businesses/${businessId}/invitations/${invitationId}/`)
  },
  acceptInvitation(token: string) {
    return client.post(`${prefix}/invitations/accept/`, { token })
  },

  // Customers
  getCustomers(params?: { business_id?: number; search?: string; page?: number; page_size?: number }) {
    return client.get(`${prefix}/customers/`, { params })
  },
  getCustomer(id: number | string) {
    return client.get(`${prefix}/customers/${id}/`)
  },
  createCustomer(data: Record<string, unknown>) {
    return client.post(`${prefix}/customers/`, data)
  },
  updateCustomer(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/customers/${id}/`, data)
  },
  deleteCustomer(id: number | string) {
    return client.delete(`${prefix}/customers/${id}/`)
  },

  // SME Products (inventory – per business, not catalog)
  getProducts(params?: { business_id?: number; page?: number; page_size?: number; low_stock?: boolean }) {
    return client.get(`${prefix}/products/`, { params })
  },
  getProductsLowStock(params?: { business_id?: number; page?: number; page_size?: number }) {
    return client.get(`${prefix}/products/low-stock/`, { params })
  },
  getProductByBarcode(barcode: string, params?: { business_id?: number }) {
    return client.get(`${prefix}/products/by-barcode/`, { params: { barcode, ...params } })
  },
  getProduct(id: number | string) {
    return client.get(`${prefix}/products/${id}/`)
  },
  createProduct(data: Record<string, unknown>) {
    return client.post(`${prefix}/products/`, data)
  },
  updateProduct(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/products/${id}/`, data)
  },
  deleteProduct(id: number | string) {
    return client.delete(`${prefix}/products/${id}/`)
  },

  // Invoices (SME)
  getInvoices(params?: { business_id?: number; customer_id?: number; payment_status?: string; page?: number; page_size?: number }) {
    return client.get(`${prefix}/invoices/`, { params })
  },
  getInvoice(id: number | string) {
    return client.get(`${prefix}/invoices/${id}/`)
  },
  getInvoicePdf(id: number | string) {
    return client.get(`${prefix}/invoices/${id}/pdf/`, { responseType: 'blob' })
  },
  createInvoice(data: Record<string, unknown>) {
    return client.post(`${prefix}/invoices/`, data)
  },
  updateInvoice(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/invoices/${id}/`, data)
  },
  markInvoicePaid(id: number | string, data?: { payment_method?: string }) {
    return client.post(`${prefix}/invoices/${id}/mark-paid/`, data ?? {})
  },
  sendInvoiceReminder(id: number | string) {
    return client.post(`${prefix}/invoices/${id}/send-reminder/`)
  },

  // Debts (deni)
  getDebts(params?: { business_id?: number; customer_id?: number; status?: string; page?: number; page_size?: number }) {
    return client.get(`${prefix}/debts/`, { params })
  },
  getDebt(id: number | string) {
    return client.get(`${prefix}/debts/${id}/`)
  },
  createDebt(data: { business_id?: number; customer_id: number; amount: number; due_date?: string; notes?: string }) {
    return client.post(`${prefix}/debts/`, data)
  },
  updateDebt(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/debts/${id}/`, data)
  },
  recordPayment(id: number | string, data: { amount: number; notes?: string }) {
    return client.post(`${prefix}/debts/${id}/record-payment/`, data)
  },
  sendDebtReminder(id: number | string) {
    return client.post(`${prefix}/debts/${id}/send-reminder/`)
  },

  // Expenses
  getExpenses(params?: { business_id?: number; category?: string; from_date?: string; to_date?: string; page?: number; page_size?: number }) {
    return client.get(`${prefix}/expenses/`, { params })
  },
  createExpense(data: Record<string, unknown>) {
    return client.post(`${prefix}/expenses/`, data)
  },
  updateExpense(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/expenses/${id}/`, data)
  },

  // Suppliers
  getSuppliers(params?: { business_id?: number; page?: number; page_size?: number }) {
    return client.get(`${prefix}/suppliers/`, { params })
  },
  getSupplier(id: number | string) {
    return client.get(`${prefix}/suppliers/${id}/`)
  },
  createSupplier(data: Record<string, unknown>) {
    return client.post(`${prefix}/suppliers/`, data)
  },
  updateSupplier(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/suppliers/${id}/`, data)
  },

  // Purchase orders
  getPurchaseOrders(params?: { business_id?: number; supplier_id?: number; status?: string; page?: number; page_size?: number }) {
    return client.get(`${prefix}/purchase-orders/`, { params })
  },
  getPurchaseOrder(id: number | string) {
    return client.get(`${prefix}/purchase-orders/${id}/`)
  },
  createPurchaseOrder(data: Record<string, unknown>) {
    return client.post(`${prefix}/purchase-orders/`, data)
  },
  updatePurchaseOrder(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/purchase-orders/${id}/`, data)
  },
  receivePurchaseOrder(id: number | string, data?: { items?: { id: number; received_quantity: number }[] }) {
    return client.post(`${prefix}/purchase-orders/${id}/receive/`, data ?? {})
  },

  // Employees
  getEmployees(params?: { business_id?: number; is_active?: boolean; page?: number; page_size?: number }) {
    return client.get(`${prefix}/employees/`, { params })
  },
  getEmployee(id: number | string) {
    return client.get(`${prefix}/employees/${id}/`)
  },
  createEmployee(data: Record<string, unknown>) {
    return client.post(`${prefix}/employees/`, data)
  },
  updateEmployee(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/employees/${id}/`, data)
  },

  // CRM dashboard / reports
  getDashboard(params?: { business_id?: number; period?: 'today' | 'this_week' | 'this_month' }) {
    return client.get(`${prefix}/dashboard/`, { params })
  },
  getCashSummary(params?: { business_id?: number; period?: 'today' | 'this_week' | 'this_month' }) {
    return client.get(`${prefix}/cash-summary/`, { params })
  },
  getCashFlow(params?: { business_id?: number; period?: string; granularity?: 'daily' | 'weekly' }) {
    return client.get(`${prefix}/cash-flow/`, { params })
  },
  getPlans() {
    return client.get(`${prefix}/plans/`)
  },

  // Petty cash
  getPettyCash(params?: { business_id?: number; from_date?: string; to_date?: string; page?: number; page_size?: number }) {
    return client.get(`${prefix}/petty-cash/`, { params })
  },
  createPettyCash(data: { amount: number; category: string; description?: string; date?: string; business_id?: number }) {
    return client.post(`${prefix}/petty-cash/`, data)
  },

  // Reports
  getIncomeStatement(params: { business_id: number | string; from: string; to: string }) {
    return client.get(`${prefix}/reports/income-statement/`, { params })
  },
  getFinancialSummary(params?: { business_id?: number }) {
    return client.get(`${prefix}/reports/financial-summary/`, { params })
  },
  getIncomeStatementExcel(params: { business_id: number | string; from: string; to: string }) {
    return client.get(`${prefix}/reports/income-statement/excel/`, { params, responseType: 'blob' })
  },
  getPettyCashExcel(params?: { business_id?: number; from_date?: string; to_date?: string }) {
    return client.get(`${prefix}/reports/petty-cash/excel/`, { params, responseType: 'blob' })
  },
  getExpensesExcel(params?: { business_id?: number; from_date?: string; to_date?: string }) {
    return client.get(`${prefix}/reports/expenses/excel/`, { params, responseType: 'blob' })
  },
  getInvoicesExcel(params?: { business_id?: number; from_date?: string; to_date?: string }) {
    return client.get(`${prefix}/reports/invoices/excel/`, { params, responseType: 'blob' })
  },
  getCashFlowExcel(params?: { business_id?: number; period?: string }) {
    return client.get(`${prefix}/reports/cash-flow/excel/`, { params, responseType: 'blob' })
  },

  // Import
  getImportTemplate(type: 'petty_cash' | 'expenses' | 'invoices' | 'pos_sales') {
    return client.get(`${prefix}/import/templates/${type}/`, { responseType: 'blob' })
  },
  importPettyCash(file: Blob | File, business_id?: number) {
    const form = new FormData()
    form.append('file', file)
    if (business_id != null) form.append('business_id', String(business_id))
    return client.post(`${prefix}/import/petty-cash/`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  importExpenses(file: Blob | File, business_id?: number) {
    const form = new FormData()
    form.append('file', file)
    if (business_id != null) form.append('business_id', String(business_id))
    return client.post(`${prefix}/import/expenses/`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  importInvoices(file: Blob | File, business_id?: number) {
    const form = new FormData()
    form.append('file', file)
    if (business_id != null) form.append('business_id', String(business_id))
    return client.post(`${prefix}/import/invoices/`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  importPos(file: Blob | File, business_id?: number) {
    const form = new FormData()
    form.append('file', file)
    if (business_id != null) form.append('business_id', String(business_id))
    return client.post(`${prefix}/import/pos/`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  // Invoice templates
  getInvoiceTemplates(params?: { business_id?: number }) {
    return client.get(`${prefix}/invoice-templates/`, { params })
  },
  createInvoiceTemplate(data: Record<string, unknown>) {
    return client.post(`${prefix}/invoice-templates/`, data)
  },
  getInvoiceTemplate(id: number | string) {
    return client.get(`${prefix}/invoice-templates/${id}/`)
  },
  updateInvoiceTemplate(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/invoice-templates/${id}/`, data)
  },
  deleteInvoiceTemplate(id: number | string) {
    return client.delete(`${prefix}/invoice-templates/${id}/`)
  },

  // Recurring invoices
  getRecurringInvoices(params?: { business_id?: number }) {
    return client.get(`${prefix}/recurring-invoices/`, { params })
  },
  createRecurringInvoice(data: Record<string, unknown>) {
    return client.post(`${prefix}/recurring-invoices/`, data)
  },
  getRecurringInvoice(id: number | string) {
    return client.get(`${prefix}/recurring-invoices/${id}/`)
  },
  updateRecurringInvoice(id: number | string, data: Record<string, unknown>) {
    return client.put(`${prefix}/recurring-invoices/${id}/`, data)
  },
  generateRecurringInvoice(id: number | string) {
    return client.post(`${prefix}/recurring-invoices/${id}/generate/`)
  },
  deleteRecurringInvoice(id: number | string) {
    return client.delete(`${prefix}/recurring-invoices/${id}/`)
  },

  // Admin CRM pricing (staff only)
  getCrmPricing() {
    return client.get(`${prefix}/admin/pricing/`)
  },
  updateCrmPricing(data: Record<string, unknown>) {
    return client.put(`${prefix}/admin/pricing/`, data)
  },
}
