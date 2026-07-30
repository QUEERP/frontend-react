import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";


export const attendanceAPI = {
  async getLogs(businessId: string, date?: string) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const url = new URL(`${API_ROOT}/attendance`)
    if (date) url.searchParams.append('date', date)

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch attendance logs')
    }

    return response.json()
  },

  async markAttendance(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to mark attendance')
    }

    return response.json()
  }
}
