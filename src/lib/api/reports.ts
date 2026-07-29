import { API_ROOT } from "@/config/api";

export interface ProfitLossReport {
  income: number
  expense: number
  profit: number
  status: 'PROFIT' | 'LOSS'
}

function buildHeaders(token: string, businessId: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-business-id': businessId,
  }
}

export async function getProfitLossReport(
  token: string,
  businessId: string,
  filters?: { fromDate?: string; toDate?: string }
): Promise<ProfitLossReport> {
  const searchParams = new URLSearchParams()

  if (filters?.fromDate) {
    searchParams.set('fromDate', filters.fromDate)
  }

  if (filters?.toDate) {
    searchParams.set('toDate', filters.toDate)
  }

  const query = searchParams.toString()
  const response = await fetch(`${API_ROOT}/reports${query ? `?${query}` : ''}`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to fetch report: ${response.status}`)
  }

  return {
    income: Number(payload?.income || 0),
    expense: Number(payload?.expense || 0),
    profit: Number(payload?.profit || 0),
    status: payload?.status === 'LOSS' ? 'LOSS' : 'PROFIT',
  }
}

export interface CrmAnalyticsReport {
  success: boolean
  kpis: {
    totalLeads: number
    totalAccounts: number
    totalDeals: number
    leadConversionRate: number
    dealWinRate: number
    totalPipelineValue: number
    revenueWon: number
    expectedWeightedRevenue: number
    averageHoursToConvert: number
    totalActivities: number
  }
  leadsBreakdown: {
    sources: Record<string, number>
    convertedCount: number
  }
  dealsBreakdown: {
    stages: Record<string, { count: number; totalAmount: number }>
    monthlyForecast: Record<string, number>
    wonCount: number
    lostCount: number
    revenueLost: number
  }
  activitiesBreakdown: {
    types: Record<string, number>
    statuses: Record<string, number>
  }
  accountsBreakdown: {
    industries: Record<string, number>
    types: Record<string, number>
    topAccounts: Array<{ id: string; company: string; annualRevenue: number | null; industry: string | null }>
  }
}

export async function getCrmAnalyticsReport(
  token: string,
  businessId: string
): Promise<CrmAnalyticsReport> {
  const response = await fetch(`${API_ROOT}/reports/crm`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to fetch CRM report: ${response.status}`)
  }

  return payload
}

export interface SalesDashboardData {
  billingSummary: Array<{
    status: string
    _sum: { grandTotal: number | null; subtotal: number | null }
    _count: { id: number }
  }>
  overdueInvoices: Array<{
    id: string
    invoiceNumber: string
    grandTotal: number
    balanceDue: number
    dueDate: string
    customer?: { id: string; company: string; phone?: string | null }
  }>
  quoteFunnel: Array<{
    status: string
    _sum: { totalAmount: number | null }
    _count: { id: number }
  }>
  salesOrderTracking: Array<{
    status: string
    _sum: { totalAmount: number | null }
    _count: { id: number }
  }>
  topCustomers: Array<{
    customerId: string
    name: string
    company: string | null
    totalSales: number
  }>
  topProducts: Array<{
    productId: string | null
    description: string
    _sum: { total: number | null; quantity: number | null }
    _count: { id: number }
  }>
}

export async function getSalesDashboardReport(
  token: string,
  businessId: string
): Promise<SalesDashboardData> {
  const response = await fetch(`${API_ROOT}/sales-reports/dashboard`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to fetch Sales report: ${response.status}`)
  }

  return payload.data
}