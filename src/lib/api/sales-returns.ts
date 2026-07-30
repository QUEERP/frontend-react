import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";

  'http://localhost:5002'

export type SalesReturnStatus = 'DRAFT' | 'RECEIVED' | 'APPROVED' | 'CANCELLED' | string
export type RefundStatus = 'PENDING' | 'CREDIT_NOTE_ISSUED' | 'REFUNDED' | string

export interface SalesReturnItem {
  id?: string
  productId?: string | null
  description: string
  quantity: number
  price: number
  taxPercent: number
  total: number
  warehouseId?: string | null
  isStockReturned?: boolean
}

export interface SalesReturn {
  id: string
  customerId: string
  customer?: {
    id: string
    company: string
  } | null
  invoiceId?: string | null
  invoice?: {
    id: string
    invoiceNumber: string
  } | null
  salesOrderId?: string | null
  salesOrder?: {
    id: string
    orderNumber: string
  } | null
  returnNumber: string
  status: SalesReturnStatus
  reason?: string | null
  refundStatus: RefundStatus
  subtotal: number
  tax: number
  totalAmount: number
  items?: SalesReturnItem[]
  createdAt?: string
}

export const salesReturnsAPI = {
  async getSalesReturns(businessId: string): Promise<{ success: boolean; data: SalesReturn[]; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/sales-returns`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to fetch sales returns')
    }

    return {
      success: true,
      data: Array.isArray(payload.data) ? payload.data : [],
    }
  },

  async getSalesReturnById(
    businessId: string,
    id: string
  ): Promise<{ success: boolean; data: SalesReturn; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/sales-returns/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to fetch sales return details')
    }

    return payload
  },

  async createSalesReturn(
    businessId: string,
    data: any
  ): Promise<{ success: boolean; data: SalesReturn; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/sales-returns`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to create sales return')
    }

    return payload
  },
}
