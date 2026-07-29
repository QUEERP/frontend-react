import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";


export const QUOTATION_STATUS = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const

export interface QuotationItemInput {
  productId?: string
  itemName?: string
  description: string
  itemType?: string
  type?: string
  hsnSacCode?: string
  quantity: number
  price: number
  taxPercent?: number
  cgstPercent?: number
  sgstPercent?: number
  igstPercent?: number
}

export interface QuotationItem extends QuotationItemInput {
  id: string
  total: number
}

export interface Quotation {
  id: string
  quoteNumber: string
  title?: string | null
  customerId: string
  dealId?: string | null
  assignedToId?: string | null
  status: (typeof QUOTATION_STATUS)[number] | string
  subtotal: number
  tax?: number | null
  discount?: number | null
  totalAmount: number
  currency?: string
  taxType?: string | null
  gstTreatment?: string | null
  issueDate: string
  expiryDate?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    company?: string
    name?: string
    email?: string
  }
  deal?: {
    id: string
    name: string
  } | null
  assignedTo?: {
    id: string
    user?: {
      id: string
      name: string
      email: string
    }
  } | null
  items: QuotationItem[]
}

export interface CreateQuotationData {
  title?: string
  customerId: string
  dealId?: string
  assignedToId?: string
  items: QuotationItemInput[]
  tax?: number
  discount?: number
  taxType?: string
  gstTreatment?: string
  issueDate: string
  expiryDate?: string
  notes?: string
}

export interface UpdateQuotationData {
  title?: string
  customerId?: string
  dealId?: string
  assignedToId?: string
  status?: (typeof QUOTATION_STATUS)[number]
  tax?: number
  discount?: number
  taxType?: string
  gstTreatment?: string
  issueDate?: string
  expiryDate?: string
  notes?: string
}

export const quotationsAPI = {
  async getQuotations(businessId: string): Promise<{ success: boolean; quotations: Quotation[] }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/quotation`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch quotations')
    }

    const result = await response.json()
    return { ...result, quotations: result.data || result.quotations || [] }
  },

  async getQuotationById(
    businessId: string,
    quotationId: string,
  ): Promise<{ success: boolean; quotation: Quotation }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/quotation/${quotationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch quotation details')
    }

    const result = await response.json(); return { ...result, quotation: result.data || result.quotation, quotations: result.data || result.quotations || [] }
  },

  async createQuotation(
    businessId: string,
    data: CreateQuotationData,
  ): Promise<{ success: boolean; quotation: Quotation }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/quotation`, {
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
      throw new Error(error.message || 'Failed to create quotation')
    }

    const result = await response.json(); return { ...result, quotation: result.data || result.quotation, quotations: result.data || result.quotations || [] }
  },

  async updateQuotation(
    businessId: string,
    quotationId: string,
    data: UpdateQuotationData,
  ): Promise<{ success: boolean; quotation: Quotation }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/quotation/${quotationId}`, {
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
      throw new Error(error.message || 'Failed to update quotation')
    }

    const result = await response.json(); return { ...result, quotation: result.data || result.quotation, quotations: result.data || result.quotations || [] }
  },

  async deleteQuotation(
    businessId: string,
    quotationId: string,
  ): Promise<{ success: boolean; message: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/quotation/${quotationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to delete quotation')
    }

    const result = await response.json(); return { ...result, quotation: result.data || result.quotation, quotations: result.data || result.quotations || [] }
  },

  async approveQuotation(
    businessId: string,
    quotationId: string,
  ): Promise<{ success: boolean; quotation: Quotation }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/quotation/${quotationId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to approve quotation')
    }

    const result = await response.json(); return { ...result, quotation: result.data || result.quotation, quotations: result.data || result.quotations || [] }
  },

  async rejectQuotation(
    businessId: string,
    quotationId: string,
  ): Promise<{ success: boolean; quotation: Quotation }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/quotation/${quotationId}/reject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to reject quotation')
    }

    const result = await response.json(); return { ...result, quotation: result.data || result.quotation, quotations: result.data || result.quotations || [] }
  },

  async downloadQuotationPdf(
    businessId: string,
    quotationId: string,
    quoteNumber: string
  ): Promise<void> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/quotation/${quotationId}/download-pdf`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to download quotation PDF')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Quotation_${quoteNumber || quotationId}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  },
}
