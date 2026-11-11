import { getCookie } from '@/lib/utils'
import { API_ROOT } from '@/config/api'

function buildHeaders(businessId: string) {
  const token = getCookie('token') || getCookie('accessToken')
  if (!token) throw new Error('No authentication token found')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-business-id': businessId,
  }
}

export interface BusinessEmailConfig {
  id?: string
  businessId: string
  email: string
  senderName: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  encryption: 'TLS' | 'SSL' | 'NONE'
  isEnabled: boolean
  isVerified: boolean
  lastTestedAt?: string | null
  lastTestStatus?: string | null
  lastTestError?: string | null
  hasPassword?: boolean
  maskedPassword?: string
  createdAt?: string
  updatedAt?: string
}

export const businessEmailAPI = {
  async getConfig(businessId: string): Promise<{ success: boolean; data: { isConfigured: boolean; config: BusinessEmailConfig | null } }> {
    const response = await fetch(`${API_ROOT}/business-email`, {
      headers: buildHeaders(businessId),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to fetch business email configuration')
    }
    return response.json()
  },

  async saveConfig(
    businessId: string,
    data: Partial<BusinessEmailConfig> & { smtpPass?: string }
  ): Promise<{ success: boolean; data: BusinessEmailConfig; message: string }> {
    const response = await fetch(`${API_ROOT}/business-email`, {
      method: 'POST',
      headers: buildHeaders(businessId),
      body: JSON.stringify(data),
    })
    const resData = await response.json().catch(() => ({}))
    if (!response.ok || !resData.success) {
      throw new Error(resData.message || 'Failed to save business email configuration')
    }
    return resData
  },

  async testConfig(
    businessId: string,
    data: {
      recipientEmail: string
      smtpHost?: string
      smtpPort?: number
      smtpUser?: string
      smtpPass?: string
      encryption?: string
      email?: string
      senderName?: string
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_ROOT}/business-email/test`, {
      method: 'POST',
      headers: buildHeaders(businessId),
      body: JSON.stringify(data),
    })
    const resData = await response.json().catch(() => ({}))
    if (!response.ok || !resData.success) {
      throw new Error(resData.message || 'SMTP connection test failed')
    }
    return resData
  },

  async toggleStatus(
    businessId: string,
    isEnabled: boolean
  ): Promise<{ success: boolean; data: BusinessEmailConfig; message: string }> {
    const response = await fetch(`${API_ROOT}/business-email/toggle`, {
      method: 'PATCH',
      headers: buildHeaders(businessId),
      body: JSON.stringify({ isEnabled }),
    })
    const resData = await response.json().catch(() => ({}))
    if (!response.ok || !resData.success) {
      throw new Error(resData.message || 'Failed to toggle business email status')
    }
    return resData
  },

  async sendEmail(
    businessId: string,
    payload: {
      to: string
      toEmail?: string
      subject: string
      text?: string
      html?: string
      cc?: string
      bcc?: string
      customerId?: string
      contactId?: string
      invoiceIds?: string[]
      quotationIds?: string[]
      attachments?: any[]
    }
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await fetch(`${API_ROOT}/business-email/send`, {
      method: 'POST',
      headers: buildHeaders(businessId),
      body: JSON.stringify(payload),
    })
    const resData = await response.json().catch(() => ({}))
    if (!response.ok || !resData.success) {
      throw new Error(resData.message || 'Failed to send business email')
    }
    return resData
  },
}

