import { API_ROOT } from "@/config/api";
  import { getCookie } from '@/lib/utils'


export const DEAL_STAGES = ['New', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const

export interface DealCustomer {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
}

export interface DealContact {
  id: string
  customerId: string
  fullName: string
  email?: string
  phone?: string
  position?: string
}

export interface DealAssignedUser {
  id: string
  user?: {
    id: string
    name: string
    email: string
  }
  role?: {
    id: string
    name: string
  }
}

export interface Deal {
  id: string
  businessId: string
  name: string
  amount: number
  currency: string
  customerId: string
  customer?: DealCustomer
  contactId?: string | null
  contact?: DealContact | null
  stage: (typeof DEAL_STAGES)[number] | string
  probability?: number | null
  expectedCloseDate?: string | null
  assignedToId?: string | null
  assignedTo?: DealAssignedUser | null
  source?: string | null
  description?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateDealData {
  name: string
  amount: number
  customerId: string
  contactId?: string
  assignedToId?: string
  stage?: (typeof DEAL_STAGES)[number]
  expectedCloseDate?: string
  probability?: number
  source?: string
  description?: string
  currency?: string
}

const normalizeDeal = (deal: Deal): Deal => {
  if (!deal?.customer) return deal

  const customerName = deal.customer.name || deal.customer.company || ''

  return {
    ...deal,
    customer: {
      ...deal.customer,
      name: customerName,
    },
  }
}

export const dealsAPI = {
  async getDeals(businessId: string): Promise<{ success: boolean; deals: Deal[] }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/deals`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch deals')
    }

    const data = (await response.json()) as { success: boolean; deals: Deal[] }
    return {
      ...data,
      deals: (data.deals || (data as any).data || []).map(normalizeDeal),
    }
  },

  async getDealById(businessId: string, dealId: string): Promise<{ success: boolean; deal: Deal }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/deals/${dealId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch deal details')
    }

    const result = (await response.json()) as { success: boolean; deal: Deal }
    return {
      ...result,
      deal: normalizeDeal(result.deal),
    }
  },

  async createDeal(businessId: string, data: CreateDealData): Promise<{ success: boolean; deal: Deal }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to create deal')
    }

    const result = (await response.json()) as { success: boolean; deal: Deal }
    return {
      ...result,
      deal: normalizeDeal(result.deal),
    }
  },

  async updateDeal(
    businessId: string,
    dealId: string,
    data: Partial<CreateDealData>,
  ): Promise<{ success: boolean; deal: Deal }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/deals/${dealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to update deal')
    }

    const result = (await response.json()) as { success: boolean; deal: Deal }
    return {
      ...result,
      deal: normalizeDeal(result.deal),
    }
  },

  async deleteDeal(businessId: string, dealId: string): Promise<{ success: boolean; message: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/deals/${dealId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to delete deal')
    }

    return response.json()
  },
}
