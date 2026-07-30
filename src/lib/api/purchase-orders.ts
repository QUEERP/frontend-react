import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";


export const PURCHASE_ORDER_STATUS = ['Draft', 'Ordered', 'Received', 'Cancelled'] as const

export interface PurchaseOrderItemInput {
  description: string
  itemType?: string
  hsnSacCode?: string
  quantity: number
  price: number
  taxPercent?: number
}

export interface PurchaseOrderItem extends PurchaseOrderItemInput {
  id: string
  total: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  status: (typeof PURCHASE_ORDER_STATUS)[number] | string
  vendorId: string
  assignedToId?: string | null
  subtotal: number
  tax?: number | null
  discount?: number | null
  totalAmount: number
  orderDate: string
  expectedDeliveryDate?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  currencyCode?: string
  currencySymbol?: string
  vendor?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  assignedTo?: {
    id: string
    user?: {
      id: string
      name: string
      email: string
    }
  } | null
  items: PurchaseOrderItem[]
}

export interface CreatePurchaseOrderData {
  vendorId: string
  assignedToId?: string
  items: PurchaseOrderItemInput[]
  tax?: number
  discount?: number
  orderDate: string
  expectedDeliveryDate?: string
  notes?: string
}

export interface UpdatePurchaseOrderData {
  vendorId?: string
  assignedToId?: string
  status?: (typeof PURCHASE_ORDER_STATUS)[number]
  tax?: number
  discount?: number
  orderDate?: string
  expectedDeliveryDate?: string
  notes?: string
}

export const purchaseOrdersAPI = {
  async getPurchaseOrders(businessId: string): Promise<{ success: boolean; orders: PurchaseOrder[] }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/purchase-order`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch purchase orders')
    }

    return response.json()
  },

  async getPurchaseOrderById(
    businessId: string,
    orderId: string,
  ): Promise<{ success: boolean; order: PurchaseOrder }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/purchase-order/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch purchase order')
    }

    return response.json()
  },

  async createPurchaseOrder(
    businessId: string,
    data: CreatePurchaseOrderData,
  ): Promise<{ success: boolean; order: PurchaseOrder }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/purchase-order`, {
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
      throw new Error(error.message || 'Failed to create purchase order')
    }

    return response.json()
  },

  async updatePurchaseOrder(
    businessId: string,
    orderId: string,
    data: UpdatePurchaseOrderData,
  ): Promise<{ success: boolean; order: PurchaseOrder }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/purchase-order/${orderId}`, {
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
      throw new Error(error.message || 'Failed to update purchase order')
    }

    return response.json()
  },

  async deletePurchaseOrder(
    businessId: string,
    orderId: string,
  ): Promise<{ success: boolean; message: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/purchase-order/${orderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to delete purchase order')
    }

    return response.json()
  },

  async receiveGoods(
    businessId: string,
    orderId: string,
    data: any,
  ): Promise<{ success: boolean; grn: any }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/purchase-order/${orderId}/receive`, {
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
      throw new Error(error.message || 'Failed to receive goods')
    }

    return response.json()
  },
}
