import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";


// User types
export interface User {
  id: string
  name: string
  email: string
  role?: string
  createdAt: string
  updatedAt: string
}

export interface BusinessUser {
  id: string
  userId?: string
  businessId?: string
  user?: User
  role?: {
    id: string
    name: string
  }
}

// API Functions
export const usersAPI = {
  // Get all users for a business
  async getBusinessUsers(businessId: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/user-management`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch users')
    }

    return response.json()
  },

  // Get active users for Project Operations / Dropdowns
  async fetchBusinessUsers(businessId: string) {
    let token = getCookie('token') || getCookie('accessToken')
    
    // Fallback to localStorage if in browser and cookie is missing
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined
    }

    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/business/${businessId}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch users')
    }

    return data.users || []
  }
}
