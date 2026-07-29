import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";


function buildHeaders(businessId: string) {
  const token = getCookie('token') || getCookie('accessToken')
  if (!token) throw new Error('No authentication token found')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-business-id': businessId,
  }
}

// ----------------------------------------------------
// 1. CAMPAIGNS API
// ----------------------------------------------------
export interface Campaign {
  id: string
  name: string
  type: string // EMAIL, SOCIAL_MEDIA, PPC, EVENT, OTHER
  status: string // PLANNING, ACTIVE, COMPLETED, CANCELLED
  budget?: number
  actualCost?: number
  expectedRevenue?: number
  startDate?: string
  endDate?: string
  description?: string
  createdAt: string
}

export const campaignsAPI = {
  async getAll(businessId: string): Promise<{ success: boolean; data: Campaign[] }> {
    const response = await fetch(`${API_ROOT}/campaigns`, {
      headers: buildHeaders(businessId),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to fetch campaigns')
    }
    return response.json()
  },

  async create(businessId: string, data: Partial<Campaign>): Promise<{ success: boolean; data: Campaign }> {
    const response = await fetch(`${API_ROOT}/campaigns`, {
      method: 'POST',
      headers: buildHeaders(businessId),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to create campaign')
    }
    return response.json()
  },

  async update(businessId: string, id: string, data: Partial<Campaign>): Promise<{ success: boolean }> {
    const response = await fetch(`${API_ROOT}/campaigns/${id}`, {
      method: 'PUT',
      headers: buildHeaders(businessId),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to update campaign')
    }
    return response.json()
  },

  async delete(businessId: string, id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_ROOT}/campaigns/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(businessId),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to delete campaign')
    }
    return response.json()
  },
}

// ----------------------------------------------------
// 2. CRM TASKS API
// ----------------------------------------------------
export interface CrmTask {
  id: string
  title: string
  description?: string
  status: string // TODO, IN_PROGRESS, DONE
  priority: string // LOW, MEDIUM, HIGH
  dueDate?: string
  leadId?: string
  dealId?: string
  customerId?: string
  assignedToId?: string
  assignedTo?: {
    id: string
    user?: {
      name: string
    }
  }
  createdAt: string
}

export const crmTasksAPI = {
  async getAll(businessId: string): Promise<{ success: boolean; data: CrmTask[] }> {
    const response = await fetch(`${API_ROOT}/crm-tasks`, {
      headers: buildHeaders(businessId),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to fetch CRM tasks')
    }
    return response.json()
  },

  async create(businessId: string, data: Partial<CrmTask>): Promise<{ success: boolean; data: CrmTask }> {
    const response = await fetch(`${API_ROOT}/crm-tasks`, {
      method: 'POST',
      headers: buildHeaders(businessId),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to create CRM task')
    }
    return response.json()
  },

  async update(businessId: string, id: string, data: Partial<CrmTask>): Promise<{ success: boolean }> {
    const response = await fetch(`${API_ROOT}/crm-tasks/${id}`, {
      method: 'PUT',
      headers: buildHeaders(businessId),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to update CRM task')
    }
    return response.json()
  },

  async delete(businessId: string, id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_ROOT}/crm-tasks/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(businessId),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to delete CRM task')
    }
    return response.json()
  },
}

// ----------------------------------------------------
// 3. EMAIL LOGS API
// ----------------------------------------------------
export interface EmailLog {
  id: string
  subject: string
  body: string
  fromEmail: string
  toEmail: string
  status: string // SENT, DELIVERED, OPENED, FAILED
  sentAt: string
  leadId?: string
  dealId?: string
  customerId?: string
  createdAt: string
}

export const emailLogsAPI = {
  async getAll(businessId: string): Promise<{ success: boolean; data: EmailLog[] }> {
    const response = await fetch(`${API_ROOT}/email-logs`, {
      headers: buildHeaders(businessId),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to fetch email logs')
    }
    return response.json()
  },

  async create(businessId: string, data: Partial<EmailLog>): Promise<{ success: boolean; data: EmailLog }> {
    const response = await fetch(`${API_ROOT}/email-logs`, {
      method: 'POST',
      headers: buildHeaders(businessId),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to dispatch email log')
    }
    return response.json()
  },
}
