import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";

  'http://localhost:5002'

export type RecurringInvoiceStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | string
export type RecurringInvoiceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | string

export interface RecurringInvoiceItem {
  id?: string
  description: string
  quantity: number
  rate: number
  total: number
}

export interface RecurringInvoiceProfile {
  id: string
  customerId: string
  customer?: {
    id: string
    company: string
  } | null
  frequency: RecurringInvoiceFrequency
  status: RecurringInvoiceStatus
  startDate: string
  endDate?: string | null
  nextBillingDate?: string | null
  grandTotal: number
  items?: RecurringInvoiceItem[]
  createdAt?: string
}

export const recurringInvoicesAPI = {
  async getProfiles(businessId: string): Promise<{ success: boolean; data: RecurringInvoiceProfile[]; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/recurring-invoices`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to fetch recurring invoice profiles')
    }

    return {
      success: true,
      data: Array.isArray(payload.data) ? payload.data : [],
    }
  },

  async createProfile(
    businessId: string,
    data: any
  ): Promise<{ success: boolean; data: RecurringInvoiceProfile; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/recurring-invoices`, {
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
      throw new Error(payload?.message || 'Failed to create recurring invoice profile')
    }

    return payload
  },

  async triggerBilling(businessId: string): Promise<{ success: boolean; data: any; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/recurring-invoices/trigger-billing`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to trigger billing processing')
    }

    return payload
  },
}
