import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";


// Lead types
export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: string
  stageId?: string
  stage?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface LeadActivity {
  id: string
  leadId: string
  message: string
  createdAt: string
}

export interface LeadNote {
  id: string
  leadId: string
  note: string
  createdAt: string
}

export interface LeadTask {
  id: string
  leadId: string
  title: string
  status: string
  createdAt: string
}

export interface LeadReminder {
  id: string
  leadId: string
  title: string
  date: string
  createdAt: string
}

export interface CreateLeadData {
  name: string
  email: string
  phone?: string
  company?: string
  website?: string
  position?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  status?: string
  source?: string
  assignedTo?: string
  tags?: string[]
  leadValue?: number
  description?: string
  isPublic?: boolean
  contactedToday?: boolean
  defaultLanguage?: string


  // New enterprise inquiry fields
  inquiryNumber?: string
  inquiryTitle?: string
  inquiryType?: string
  priority?: string
  department?: string
  businessUnit?: string
  currency?: string
  budgetRange?: string
  expectedRevenue?: number
  probability?: number
  expectedDecisionDate?: string

  projectType?: string
  executionType?: string
  expectedStartDate?: string
  expectedCompletionDate?: string
  expectedDuration?: string
  businessRequirement?: string
  currentBusinessProblem?: string
  expectedSolution?: string
  scopeSummary?: string
  deliverables?: string
  estimatedTeamSize?: number
  timezone?: string

  internalNotes?: string
  salesStrategy?: string
  competitors?: string
  competitorName?: string
  riskLevel?: string
  winProbability?: number
  expectedProfit?: number
  expectedMargin?: number
  managementNotes?: string

  nextFollowUpDate?: string
  reminder?: boolean
  meetingDate?: string
  meetingType?: string
  meetingLocation?: string
  followUpNotes?: string

  companySize?: string
  preferredCommunication?: string
  industry?: string
  gstVatNumber?: string
  type?: string
}

// API Functions
export const leadsAPI = {
  // Get all leads
  async getAllLeads(businessId: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch leads')
    }

    return response.json()
  },

  // Get lead details
  async getLeadDetails(businessId: string, leadId: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch lead details')
    }

    return response.json()
  },

  // Create lead
  async createLead(businessId: string, data: CreateLeadData) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads`, {
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
      throw new Error(error.message || 'Failed to create lead')
    }

    return response.json()
  },

  // Update lead
  async updateLead(businessId: string, leadId: string, data: Partial<CreateLeadData>) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}`, {
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
      throw new Error(error.message || 'Failed to update lead')
    }

    return response.json()
  },

  // Delete lead
  async deleteLead(businessId: string, leadId: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to delete lead')
    }

    return response.json()
  },

  // Convert lead to customer
  async convertToCustomer(businessId: string, leadId: string, customerData?: any) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify(customerData || {}),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to convert lead to customer')
    }

    return response.json()
  },

  // Move lead to different stage
  async moveStage(businessId: string, leadId: string, stageId: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}/move-stage`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify({ stageId }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to move lead stage')
    }

    return response.json()
  },

  // Add activity
  async addActivity(businessId: string, leadId: string, message: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to add activity')
    }

    return response.json()
  },

  // Get activities
  async getActivities(businessId: string, leadId: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}/activity`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch activities')
    }

    return response.json()
  },

  // Add note
  async addNote(businessId: string, leadId: string, note: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}/note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify({ note }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to add note')
    }

    return response.json()
  },

  // Add task
  async addTask(businessId: string, leadId: string, title: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify({ title }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to add task')
    }

    return response.json()
  },

  // Add reminder
  async addReminder(businessId: string, leadId: string, title: string, date: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/leads/${leadId}/reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify({ title, date }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to add reminder')
    }

    return response.json()
  },
}
