import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";
import { WarehouseLocation } from './warehouses'


function authHeaders(businessId: string) {
  const token = getCookie('token') || getCookie('accessToken')
  if (!token) throw new Error('No authentication token found')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId }
}

async function apiFetch<T>(url: string, businessId: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(businessId), ...(options?.headers || {}) } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`)
  return json
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Category { id: string; name: string; description?: string; parentId?: string | null; parent?: Category | null; children?: Category[]; isActive: boolean; createdAt: string }
export interface Brand { id: string; name: string; description?: string; logoUrl?: string; isActive: boolean; createdAt: string }
export interface Unit { id: string; name: string; abbreviation: string; createdAt: string }

export interface Product {
  id: string; name: string; sku: string; barcode?: string; description?: string
  categoryId?: string; brandId?: string; unitId?: string
  sellingPrice: number; costPrice?: number; taxRate?: number; taxCode?: string
  reorderLevel?: number; reorderQty?: number; trackInventory: boolean
  isBatchTracked: boolean; isSerialTracked: boolean
  imageUrl?: string; isActive: boolean; createdAt: string; updatedAt: string
  category?: Category; brand?: Brand; unit?: Unit | string
  stockLevels?: StockLevel[]
  
  // Creation/Update fields
  price?: number
  taxPercent?: number
  initialQty?: number
  warehouseId?: string
  locationId?: string
  hsnCode?: string
  openingStock?: number
  openingWarehouseId?: string
  type?: 'GOODS' | 'SERVICE'
}

export interface Warehouse {
  id: string; name: string; code?: string; address?: string; city?: string; state?: string
  country?: string; phone?: string; managerId?: string; isActive: boolean; createdAt: string
  manager?: { id: string; user?: { name: string; email: string } }
  stockSummary?: { totalProducts: number; totalValue: number; lowStockCount: number }
}

export interface StockLevel {
  id: string; productId: string; warehouseId: string
  quantity: number; reservedQty: number; damagedQty: number; incomingQty: number
  updatedAt: string
  product?: Product; warehouse?: Warehouse
  locationId?: string; location?: WarehouseLocation
}

export interface StockMovement {
  id: string; type: string; quantity: number; referenceId?: string; referenceType?: string
  notes?: string; performedById?: string; productId: string; warehouseId: string; batchId?: string
  locationId?: string
  createdAt: string
  product?: { id: string; name: string; sku: string }
  warehouse?: { id: string; name: string }
  location?: WarehouseLocation
  performedBy?: { id: string; user?: { name: string } }
}

export interface StockAdjustment {
  id: string; reason: string; notes?: string; status: string; createdAt: string
  adjustmentNumber?: string; warehouseId?: string; locationId?: string
  warehouse?: Warehouse; location?: WarehouseLocation
  items: { productId: string; warehouseId?: string; locationId?: string; adjustmentType: string; quantity: number; notes?: string }[]
}

export interface StockTransfer {
  id: string; transferNumber: string; status: string; fromWarehouseId: string; toWarehouseId: string
  fromLocationId?: string; toLocationId?: string
  fromLocation?: WarehouseLocation; toLocation?: WarehouseLocation
  notes?: string; createdAt: string
  fromWarehouse?: Warehouse; toWarehouse?: Warehouse
  items: { productId: string; quantity: number; product?: Product }[]
}

export interface Batch {
  id: string; batchNumber: string; productId: string; expiryDate?: string
  quantity: number; createdAt: string
  product?: Product
}

export interface SerialNumber {
  id: string; serialNumber: string; productId: string; warehouseId?: string
  status: string; createdAt: string
  product?: Product
}

export interface InventoryReport {
  stockValuation?: { totalValue: number; totalItems: number; items: { product: Product; warehouse: Warehouse; quantity: number; value: number }[] }
  lowStockAlerts?: { product: Product; warehouse: Warehouse; quantity: number; reorderLevel: number }[]
  movementSummary?: { type: string; count: number; totalQuantity: number }[]
  expiringBatches?: Batch[]
}

// ── Category API ──────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: (bId: string) => apiFetch<{ success: boolean; categories: Category[] }>(`${API_ROOT}/products/categories`, bId),
  create: (bId: string, data: Partial<Category>) => apiFetch<{ success: boolean; category: Category }>(`${API_ROOT}/products/categories`, bId, { method: 'POST', body: JSON.stringify(data) }),
  update: (bId: string, id: string, data: Partial<Category>) => apiFetch<{ success: boolean; category: Category }>(`${API_ROOT}/products/categories/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/products/categories/${id}`, bId, { method: 'DELETE' }),
}

// ── Brand API ─────────────────────────────────────────────────────────────────
export const brandsAPI = {
  getAll: (bId: string) => apiFetch<{ success: boolean; brands: Brand[] }>(`${API_ROOT}/products/brands`, bId),
  create: (bId: string, data: Partial<Brand>) => apiFetch<{ success: boolean; brand: Brand }>(`${API_ROOT}/products/brands`, bId, { method: 'POST', body: JSON.stringify(data) }),
  update: (bId: string, id: string, data: Partial<Brand>) => apiFetch<{ success: boolean; brand: Brand }>(`${API_ROOT}/products/brands/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/products/brands/${id}`, bId, { method: 'DELETE' }),
}

// ── Unit API ──────────────────────────────────────────────────────────────────
export const unitsAPI = {
  getAll: (bId: string) => apiFetch<{ success: boolean; units: Unit[] }>(`${API_ROOT}/products/units`, bId),
  create: (bId: string, data: Partial<Unit>) => apiFetch<{ success: boolean; unit: Unit }>(`${API_ROOT}/products/units`, bId, { method: 'POST', body: JSON.stringify(data) }),
  update: (bId: string, id: string, data: Partial<Unit>) => apiFetch<{ success: boolean; unit: Unit }>(`${API_ROOT}/products/units/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/products/units/${id}`, bId, { method: 'DELETE' }),
}

// ── Product API ───────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; products: Product[]; pagination?: { total: number; page: number; limit: number } }>(`${API_ROOT}/products${q}`, bId)
  },
  getById: (bId: string, id: string) => apiFetch<{ success: boolean; product: Product }>(`${API_ROOT}/products/${id}`, bId),
  create: (bId: string, data: Partial<Product>) => apiFetch<{ success: boolean; product: Product }>(`${API_ROOT}/products`, bId, { method: 'POST', body: JSON.stringify(data) }),
  update: (bId: string, id: string, data: Partial<Product>) => apiFetch<{ success: boolean; product: Product }>(`${API_ROOT}/products/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/products/${id}`, bId, { method: 'DELETE' }),
}

// ── Warehouse API ─────────────────────────────────────────────────────────────
export const warehousesAPI = {
  getAll: (bId: string) => apiFetch<{ success: boolean; warehouses: Warehouse[] }>(`${API_ROOT}/warehouses`, bId),
  getById: (bId: string, id: string) => apiFetch<{ success: boolean; warehouse: Warehouse }>(`${API_ROOT}/warehouses/${id}`, bId),
  create: (bId: string, data: Partial<Warehouse>) => apiFetch<{ success: boolean; warehouse: Warehouse }>(`${API_ROOT}/warehouses`, bId, { method: 'POST', body: JSON.stringify(data) }),
  update: (bId: string, id: string, data: Partial<Warehouse>) => apiFetch<{ success: boolean; warehouse: Warehouse }>(`${API_ROOT}/warehouses/${id}`, bId, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/warehouses/${id}`, bId, { method: 'DELETE' }),
}

// ── Stock API ─────────────────────────────────────────────────────────────────
export const stockAPI = {
  getLevels: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; stock: StockLevel[]; pagination?: { total: number } }>(`${API_ROOT}/stock${q}`, bId)
  },
  getMovements: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; movements: StockMovement[]; pagination?: { total: number } }>(`${API_ROOT}/stock/movements${q}`, bId)
  },
  createAdjustment: (bId: string, data: Partial<StockAdjustment>) => apiFetch<{ success: boolean; adjustment: StockAdjustment }>(`${API_ROOT}/stock/adjustments`, bId, { method: 'POST', body: JSON.stringify(data) }),
  getAdjustments: (bId: string) => apiFetch<{ success: boolean; adjustments: StockAdjustment[] }>(`${API_ROOT}/stock/adjustments`, bId),
  deleteAdjustment: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/stock/adjustments/${id}`, bId, { method: 'DELETE' }),
  createTransfer: (bId: string, data: Partial<StockTransfer>) => apiFetch<{ success: boolean; transfer: StockTransfer }>(`${API_ROOT}/stock/transfers`, bId, { method: 'POST', body: JSON.stringify(data) }),
  getTransfers: (bId: string) => apiFetch<{ success: boolean; transfers: StockTransfer[] }>(`${API_ROOT}/stock/transfers`, bId),
  deleteTransfer: (bId: string, id: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/stock/transfers/${id}`, bId, { method: 'DELETE' }),
  updateTransferStatus: (bId: string, id: string, status: string) => apiFetch<{ success: boolean }>(`${API_ROOT}/stock/transfers/${id}/status`, bId, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getBatches: (bId: string) => apiFetch<{ success: boolean; batches: Batch[] }>(`${API_ROOT}/stock/batches`, bId),
  getSerials: (bId: string) => apiFetch<{ success: boolean; serials: SerialNumber[] }>(`${API_ROOT}/stock/serials`, bId),
}

// ── Inventory Reports API ─────────────────────────────────────────────────────
export const inventoryReportsAPI = {
  getValuation: (bId: string) => apiFetch<{ success: boolean } & InventoryReport>(`${API_ROOT}/reports/stock-valuation`, bId),
  getLowStock: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; alerts: InventoryReport['lowStockAlerts'] }>(`${API_ROOT}/reports/low-stock-alerts${q}`, bId)
  },
  getMovementSummary: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; summary: InventoryReport['movementSummary'] }>(`${API_ROOT}/reports/movement-summary${q}`, bId)
  },
  getExpiringBatches: (bId: string, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ success: boolean; batches: InventoryReport['expiringBatches'] }>(`${API_ROOT}/reports/expiring-batches${q}`, bId)
  },
  getTradingInventoryReport: (
    bId: string, 
    dateRange: string = 'this_month',
    tab: string = 'products',
    page: number = 1,
    pageSize: number = 25
  ) => {
    let url = `${API_ROOT}/inventory-reports/trading?tab=${tab}&page=${page}&pageSize=${pageSize}`;
    
    if (dateRange && typeof dateRange === 'string') {
        url += `&dateRange=${dateRange}`;
    } else if (dateRange && typeof dateRange === 'object') {
        const dr = dateRange as any;
        if (dr.startDate && dr.endDate) {
           url += `&startDate=${dr.startDate}&endDate=${dr.endDate}`;
        }
    }
    
    return apiFetch<{ success: boolean; data: TradingInventoryReportData }>(url, bId)
  }
}

export interface TradingInventoryReportData {
  kpis: {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    activeWarehouses: number;
    stockMovementsCount: number;
  };
  funnel: {
    receipts: { count: number; quantity: number };
    transfers: { count: number; quantity: number };
    adjustments: { count: number; quantity: number };
    stockOut: { count: number; quantity: number };
  };
  productsList: any[];
  productsTotalCount: number;
  categoriesList: any[];
  categoriesTotalCount: number;
  brandsList: any[];
  brandsTotalCount: number;
  unitsList: any[];
  unitsTotalCount: number;
  warehousesList: any[];
  warehousesTotalCount: number;
  stockOverviewList: any[];
  stockOverviewTotalCount: number;
  transfersList: any[];
  transfersTotalCount: number;
  adjustmentsList: any[];
  adjustmentsTotalCount: number;
  movementHistoryList: any[];
  movementsTotalCount: number;
  reorderAlertsList: any[];
  alertsTotalCount: number;
}
