import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";


export interface Vendor {
  id: string
  name: string
  companyName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  taxNumber?: string
  status: string
  createdAt: string
  updatedAt: string
}

export const vendorsAPI = {
  async getVendors(businessId: string): Promise<{ success: boolean; vendors: Vendor[] }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/vendors`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch vendors')
    }

    return response.json()
  },

  async getVendorById(
    businessId: string,
    vendorId: string,
  ): Promise<{ success: boolean; vendor: Vendor }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/vendors/${vendorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch vendor')
    }

    return response.json()
  },

  async createVendor(
    businessId: string,
    data: Partial<Vendor>,
  ): Promise<{ success: boolean; vendor: Vendor }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/vendors`, {
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
      throw new Error(error.message || 'Failed to create vendor')
    }

    return response.json()
  },

  async updateVendor(
    businessId: string,
    vendorId: string,
    data: Partial<Vendor>,
  ): Promise<{ success: boolean; vendor: Vendor }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/vendors/${vendorId}`, {
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
      throw new Error(error.message || 'Failed to update vendor')
    }

    return response.json()
  },

  async deleteVendor(
    businessId: string,
    vendorId: string,
  ): Promise<{ success: boolean; message: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/vendors/${vendorId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to delete vendor')
    }

    return response.json()
  },
}
