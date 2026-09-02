import { getCookie } from '@/lib/utils'
import { API_ROOT } from '@/config/api';

export const SALES_ORDER_STATUS = ['Draft', 'Confirmed', 'Approved', 'Partially Fulfilled', 'Fulfilled', 'Invoiced', 'Cancelled'] as const

export interface SalesOrderItemInput {
  productId?: string
  itemName?: string
  warehouseId?: string
  description: string
  itemType?: string
  hsnSacCode?: string
  quantity: number
  price: number
  taxPercent?: number
  cgstPercent?: number
  sgstPercent?: number
  igstPercent?: number
  unit?: string
}

export interface SalesOrderItem extends SalesOrderItemInput {
  igstPercent?: number;
  sgstPercent?: number;
  cgstPercent?: number;
  taxPercent?: number;
  id: string
  total: number
}

export interface SalesOrder {
  id: string
  orderNumber: string
  status: (typeof SALES_ORDER_STATUS)[number] | string
  customerId: string
  quotationId?: string | null
  dealId?: string | null
  assignedToId?: string | null
  subtotal: number
  tax?: number | null
  discount?: number | null
  shippingCharges?: number | null
  totalAmount: number
  orderDate: string
  deliveryDate?: string | null
  notes?: string | null
  termsConditions?: string | null
  currency?: string | null
  customerReference?: string | null
  shippingMethod?: string | null
  paymentTerms?: string | null
  deliveryInstructions?: string | null
  placeOfSupply?: string | null
  cgst?: number | null
  sgst?: number | null
  igst?: number | null
  tds?: number | null
  ewayBillNo?: string | null
  reverseCharge?: boolean
  transportDetails?: string | null
  vatPercentage?: number | null
  vatAmount?: number | null
  vatType?: string | null
  emirate?: string | null
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    company?: string
    name?: string
    email?: string
    country?: string
    billingState?: string
    state?: string
    emirate?: string
  }
  quotation?: {
    id: string
    quotationNumber: string
    title?: string | null
  } | null
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
  items: SalesOrderItem[]
}

export interface CreateSalesOrderData {
  customerId: string
  quotationId?: string
  dealId?: string
  assignedToId?: string
  items: SalesOrderItemInput[]
  subtotal?: number
  tax?: number
  discount?: number
  shippingCharges?: number
  totalAmount?: number
  orderDate: string
  deliveryDate?: string
  notes?: string
  termsConditions?: string
  currency?: string
  customerReference?: string
  shippingMethod?: string
  paymentTerms?: string
  deliveryInstructions?: string
  placeOfSupply?: string
  cgst?: number
  sgst?: number
  igst?: number
  tds?: number
  ewayBillNo?: string
  reverseCharge?: boolean
  transportDetails?: string
  vatPercentage?: number
  vatAmount?: number
  vatType?: string
  emirate?: string
}

export interface UpdateSalesOrderData extends Partial<CreateSalesOrderData> {
  status?: (typeof SALES_ORDER_STATUS)[number]
}

export const salesOrdersAPI = {
  async getSalesOrders(businessId: string): Promise<{ success: boolean; orders: SalesOrder[] }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/salesorder`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch sales orders')
    }

    const result = await response.json(); return { ...result, order: result.data || result.order, orders: result.data || result.orders || [] }
  },

  async getSalesOrderById(
    businessId: string,
    orderId: string,
  ): Promise<{ success: boolean; order: SalesOrder }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/salesorder/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch sales order')
    }

    const result = await response.json(); return { ...result, order: result.data || result.order, orders: result.data || result.orders || [] }
  },

  async createSalesOrder(
    businessId: string,
    data: CreateSalesOrderData,
  ): Promise<{ success: boolean; order: SalesOrder }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/salesorder`, {
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
      throw new Error(error.message || 'Failed to create sales order')
    }

    const result = await response.json(); return { ...result, order: result.data || result.order, orders: result.data || result.orders || [] }
  },

  async updateSalesOrder(
    businessId: string,
    orderId: string,
    data: UpdateSalesOrderData,
  ): Promise<{ success: boolean; order: SalesOrder }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/salesorder/${orderId}`, {
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
      throw new Error(error.message || 'Failed to update sales order')
    }

    const result = await response.json(); return { ...result, order: result.data || result.order, orders: result.data || result.orders || [] }
  },

  async deleteSalesOrder(
    businessId: string,
    orderId: string,
  ): Promise<{ success: boolean; message: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/salesorder/${orderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to delete sales order')
    }

    const result = await response.json(); return { ...result, order: result.data || result.order, orders: result.data || result.orders || [] }
  },

  async convertQuotation(
    businessId: string,
    quotationId: string,
  ): Promise<{ success: boolean; order: SalesOrder }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/salesorder/convert/${quotationId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to convert quotation to sales order')
    }

    const result = await response.json(); return { ...result, order: result.data || result.order, orders: result.data || result.orders || [] }
  },

  async changeStatus(
    businessId: string,
    orderId: string,
    status: string,
  ): Promise<{ success: boolean; order: SalesOrder }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/salesorder/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to update sales order status')
    }

    const result = await response.json(); return { ...result, order: result.data || result.order, orders: result.data || result.orders || [] }
  },
}
