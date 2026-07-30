import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";


function authHeaders(businessId: string) {
  const token = getCookie('token') || getCookie('accessToken')
  if (!token) throw new Error('No authentication token found')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId }
}

async function apiFetch<T>(url: string, businessId: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(businessId), ...(options?.headers || {}) } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`)
  return json
}

// ── Types ─────────────────────────────────────────────────────────────────────

export const VENDOR_STATUS = ['ACTIVE', 'INACTIVE', 'BLACKLISTED'] as const
export const PR_STATUS = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED'] as const
export const PO_STATUS = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIAL_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED'] as const
export const BILL_STATUS = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const

export interface Vendor {
  id: string; name: string; companyName?: string; email?: string; phone?: string
  address?: string; city?: string; country?: string; taxNumber?: string
  paymentTerms?: number; creditLimit?: number; outstandingBalance: number
  status: typeof VENDOR_STATUS[number]; createdAt: string; updatedAt: string
}

export interface PurchaseRequestItem {
  productId?: string; description: string; quantity: number; estimatedPrice?: number; unitId?: string
}

export interface PurchaseRequest {
  id: string; requestNumber: string; status: typeof PR_STATUS[number]
  requesterId?: string; departmentId?: string; notes?: string
  expectedDate?: string; priority?: string; totalEstimated?: number
  title?: string; vendorId?: string; requiredDate?: string; // Additional UI properties
  createdAt: string; updatedAt: string
  requester?: { id: string; user?: { name: string; email: string } }
  items: PurchaseRequestItem[]
}

export interface PurchaseOrderItem {
  id: string; productId?: string; description: string; quantity: number
  price: number; taxPercent?: number; total: number
  product?: { id: string; name: string; sku: string }
}

export interface PurchaseOrder {
  id: string; poNumber: string; status: typeof PO_STATUS[number]
  vendorId: string; warehouseId?: string; assignedToId?: string
  subtotal: number; tax?: number; discount?: number; totalAmount: number
  orderDate: string; expectedDeliveryDate?: string; notes?: string
  purchaseRequestId?: string; createdAt: string; updatedAt: string
  vendor?: Vendor
  Vendor?: Vendor
  warehouse?: { id: string; name: string }
  items: PurchaseOrderItem[]
}

export interface GRNItem {
  purchaseOrderItemId?: string; productId: string; quantityOrdered: number
  quantityReceived: number; quantityDamaged?: number; batchNumber?: string
  serialNumbers?: string[]; expiryDate?: string
  product?: { id: string; name: string; sku: string }
}

export interface GRN {
  id: string; grnNumber: string; status: string
  purchaseOrderId: string; vendorId: string; warehouseId: string
  receivedDate: string; notes?: string; createdAt: string
  purchaseOrder?: PurchaseOrder
  vendor?: Vendor
  warehouse?: { id: string; name: string }
  items: GRNItem[]
}

export interface Bill {
  id: string; billNumber: string; status: typeof BILL_STATUS[number]
  vendorId: string; purchaseOrderId?: string; grnId?: string
  subtotal: number; tax?: number; discount?: number; totalAmount: number
  outstandingAmount: number; dueDate?: string; billDate: string; notes?: string
  createdAt: string; updatedAt: string
  vendor?: Vendor
  payments?: VendorPayment[]
}

export interface VendorPayment {
  id: string; billId: string; amount: number; paymentDate: string
  paymentMethod: string; referenceNumber?: string; notes?: string
  createdAt: string
  bill?: { id: string; billNumber: string }
}

export interface PurchaseReturn {
  id: string; returnNumber: string; status: string; refundStatus: string
  vendorId: string; purchaseOrderId?: string; grnId?: string
  totalAmount: number; notes?: string; createdAt: string; returnDate?: string
  vendor?: Vendor
  Vendor?: Vendor
  items: { productId: string; quantity: number; reason: string; product?: { name: string; sku: string } }[]
}

// ── Vendor API ────────────────────────────────────────────────────────────────
export const vendorsAPI = {
  getAll: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; vendors: Vendor[]; pagination?: { total: number } }>(`${API_ROOT}/purchase/vendors${q}`, bId)
  },
  getById: (bId: string, id: string) => apiFetch<{ success: boolean; vendor: Vendor }>(`${API_ROOT}/purchase/vendors/${id}`, bId),
  create: (bId: string, data: Partial<Vendor>) => apiFetch<{ success: boolean; vendor: Vendor }>(`${API_ROOT}/purchase/vendors`, bId, { method: 'POST', body: JSON.stringify(data) }),
  update: (bId: string, id: string, data: Partial<Vendor>) => apiFetch<{ success: boolean; vendor: Vendor }>(`${API_ROOT}/purchase/vendors/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/purchase/vendors/${id}`, bId, { method: 'DELETE' }),
}

// ── Purchase Request API ──────────────────────────────────────────────────────
export const purchaseRequestsAPI = {
  getAll: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; requests: PurchaseRequest[] }>(`${API_ROOT}/purchase/requests${q}`, bId)
  },
  getById: (bId: string, id: string) => apiFetch<{ success: boolean; request: PurchaseRequest }>(`${API_ROOT}/purchase/requests/${id}`, bId),
  create: (bId: string, data: Partial<PurchaseRequest>) => apiFetch<{ success: boolean; request: PurchaseRequest }>(`${API_ROOT}/purchase/requests`, bId, { method: 'POST', body: JSON.stringify(data) }),
  update: (bId: string, id: string, data: Partial<PurchaseRequest>) => apiFetch<{ success: boolean; request: PurchaseRequest }>(`${API_ROOT}/purchase/requests/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
  convertToPO: (bId: string, id: string, data: { vendorId: string; warehouseId?: string }) =>
    apiFetch<{ success: boolean; order: PurchaseOrder }>(`${API_ROOT}/purchase/requests/${id}/convert-to-po`, bId, { method: 'POST', body: JSON.stringify(data) }),
}

// ── Purchase Order API ────────────────────────────────────────────────────────
export const purchaseOrdersAPI = {
  getAll: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; orders: PurchaseOrder[]; pagination?: { total: number } }>(`${API_ROOT}/purchase/orders${q}`, bId)
  },
  getById: (bId: string, id: string) => apiFetch<{ success: boolean; order: PurchaseOrder }>(`${API_ROOT}/purchase/orders/${id}`, bId),
  create: (bId: string, data: Partial<PurchaseOrder>) => apiFetch<{ success: boolean; order: PurchaseOrder }>(`${API_ROOT}/purchase/orders`, bId, { method: 'POST', body: JSON.stringify(data) }),
  update: (bId: string, id: string, data: Partial<PurchaseOrder>) => apiFetch<{ success: boolean; order: PurchaseOrder }>(`${API_ROOT}/purchase/orders/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
  changeStatus: (bId: string, id: string, status: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/purchase/orders/${id}`, bId, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/purchase/orders/${id}`, bId, { method: 'DELETE' }),
}

// ── GRN API ───────────────────────────────────────────────────────────────────
export const grnAPI = {
  getAll: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; grns: GRN[] }>(`${API_ROOT}/purchase/grn${q}`, bId)
  },
  getById: (bId: string, id: string) => apiFetch<{ success: boolean; grn: GRN }>(`${API_ROOT}/purchase/grn/${id}`, bId),
  create: (bId: string, data: Partial<GRN>) => apiFetch<{ success: boolean; grn: GRN }>(`${API_ROOT}/purchase/grn`, bId, { method: 'POST', body: JSON.stringify(data) }),
  delete: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/purchase/grn/${id}`, bId, { method: 'DELETE' }),
}

// ── Bill API ──────────────────────────────────────────────────────────────────
export const vendorBillsAPI = {
  getAll: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; bills: Bill[] }>(`${API_ROOT}/purchase/bills${q}`, bId)
  },
  getById: (bId: string, id: string) => apiFetch<{ success: boolean; bill: Bill }>(`${API_ROOT}/purchase/bills/${id}`, bId),
  create: (bId: string, data: Partial<Bill>) => apiFetch<{ success: boolean; bill: Bill }>(`${API_ROOT}/purchase/bills`, bId, { method: 'POST', body: JSON.stringify(data) }),
  update: (bId: string, id: string, data: Partial<Bill>) => apiFetch<{ success: boolean; bill: Bill }>(`${API_ROOT}/purchase/bills/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
}

export const billsAPI = vendorBillsAPI;

// ── Payment API ───────────────────────────────────────────────────────────────
export const vendorPaymentsAPI = {
  getForBill: (bId: string, billId: string) => apiFetch<{ success: boolean; payments: VendorPayment[] }>(`${API_ROOT}/purchase/bills/${billId}/payments`, bId),
  create: (bId: string, billId: string, data: Partial<VendorPayment>) => apiFetch<{ success: boolean; payment: VendorPayment }>(`${API_ROOT}/purchase/bills/${billId}/payments`, bId, { method: 'POST', body: JSON.stringify(data) }),
}

// ── Purchase Return API ───────────────────────────────────────────────────────
export const purchaseReturnsAPI = {
  getAll: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; returns: PurchaseReturn[] }>(`${API_ROOT}/purchase/returns${q}`, bId)
  },
  create: (bId: string, data: Partial<PurchaseReturn>) => apiFetch<{ success: boolean; return: PurchaseReturn }>(`${API_ROOT}/purchase/returns`, bId, { method: 'POST', body: JSON.stringify(data) }),
}

// ── Purchase Reports API ──────────────────────────────────────────────────────
export const purchaseReportsAPI = {
  getSummary: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; summary: { status: string; count: number; totalAmount: number }[] }>(`${API_ROOT}/purchase/reports/summary${q}`, bId)
  },
  getByVendor: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; data: { vendorId: string; vendorName: string; orderCount: number; totalAmount: number }[] }>(`${API_ROOT}/purchase/reports/by-vendor${q}`, bId)
  },
  getBillsAging: (bId: string) => apiFetch<{ success: boolean; aging: Record<string, { count: number; totalOutstanding: number }> }>(`${API_ROOT}/purchase/reports/bills-aging`, bId),
}
