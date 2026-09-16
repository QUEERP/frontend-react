import { getCookie } from '@/lib/utils'
import { API_ROOT } from '@/config/api';

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

export interface InvoiceItem {
  igstPercent?: number;
  sgstPercent?: number;
  cgstPercent?: number;
  id: string
  productId?: string
  itemName?: string
  itemType?: string
  warehouseId?: string
  description: string
  quantity: number
  hours?: number
  rate: number
  taxPercent: number
  total: number
  hsnSacCode?: string
  unit?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  customerId: string
  salesOrderId?: string
  invoiceDate: string
  issueDate?: string
  dueDate?: string
  expiryDate?: string
  poNumber?: string
  subtotal: number
  totalTax: number
  grandTotal: number
  discount?: number
  shippingCharges?: number
  notes?: string
  terms?: string
  createdAt: string
  updatedAt: string
  cgst?: number
  sgst?: number
  igst?: number
  tds?: number
  ewayBillNo?: string
  reverseCharge?: boolean
  transportDetails?: string
  vatPercentage?: number
  vatAmount?: number
  vatType?: string
  emirate?: string
  currency?: string
  customer?: {
    id: string
    name: string
    company?: string
    country?: string
    billingState?: string
    state?: string
    emirate?: string
  }
  deal?: {
    id: string
    name: string
  } | null
  items: InvoiceItem[]
}

export const invoicesAPI = {
  getInvoices: (bId: string) => apiFetch<{ success: boolean; data: Invoice[]; invoices: Invoice[] }>(`${API_ROOT}/invoices`, bId),
  getInvoiceById: (bId: string, id: string) => apiFetch<{ success: boolean; data: Invoice; invoice: Invoice }>(`${API_ROOT}/invoices/${id}`, bId),
  createInvoice: (bId: string, data: any) => apiFetch<{ success: boolean; invoice: Invoice }>(`${API_ROOT}/invoices`, bId, { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (bId: string, id: string, data: any) => apiFetch<{ success: boolean; invoice: Invoice }>(`${API_ROOT}/invoices/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/invoices/${id}`, bId, { method: 'DELETE' }),
  changeStatus: (bId: string, id: string, status: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/invoices/${id}`, bId, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getPreview: (bId: string, data: any) => apiFetch<{ success: boolean; html: string }>(`${API_ROOT}/invoices/preview`, bId, { method: 'POST', body: JSON.stringify(data) }),
}
