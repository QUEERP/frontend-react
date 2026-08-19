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





export interface BasicSalesReportData {
  totalCustomers: number;
  totalPaymentsMade: number;
  paymentsAllocated: number;
  paymentsRemaining: number;
  totalCreditNotes: number;
  customersList: any[];
  customersTotalCount: number;
  paymentsList: any[];
  paymentsTotalCount: number;
  creditNotesList: any[];
  creditNotesTotalCount: number;
}

export async function getBasicSalesReport(
  token: string,
  businessId: string
): Promise<BasicSalesReportData> {
  const response = await fetch(`${API_ROOT}/sales-reports/basic`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to fetch basic sales report: ${response.status}`)
  }

  return payload.data
}

export interface TradingSalesReportData extends BasicSalesReportData {
  quotationsList: any[];
  quotationsTotalCount: number;
  salesOrdersList: any[];
  salesOrdersTotalCount: number;
  invoicesList: any[];
  invoicesTotalCount: number;
  returnsList: any[];
  returnsTotalCount: number;
  recurringList: any[];
  recurringTotalCount: number;
}

export async function getTradingSalesReport(token: string, businessId: string, dateRange: string = 'this_month', tab?: string, page: number = 1, pageSize: number = 25): Promise<TradingSalesReportData> {
  const queryParams = new URLSearchParams();
  if (dateRange && dateRange !== 'all_time') queryParams.append('dateRange', dateRange);
  if (tab) queryParams.append('tab', tab);
  queryParams.append('page', page.toString());
  queryParams.append('pageSize', pageSize.toString());

  const response = await fetch(`${API_ROOT}/sales-reports/trading?${queryParams.toString()}`, {
    method: 'GET',
    headers: buildHeaders(token, businessId),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to fetch trading sales report: ${response.status}`)
  }

  return payload.data
}

export interface BalanceSheetReport {
  assets: { id: string; name: string; balance: number }[]
  liabilities: { id: string; name: string; balance: number }[]
  equities: { id: string; name: string; balance: number }[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  balances: boolean
}

export async function getBalanceSheetReport(
  token: string,
  businessId: string,
  asOfDate?: string
): Promise<BalanceSheetReport> {
  const searchParams = new URLSearchParams()
  if (asOfDate) searchParams.set('asOfDate', asOfDate)
  
  const query = searchParams.toString()
  const response = await fetch(`${API_ROOT}/reports/balance-sheet${query ? `?${query}` : ''}`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Failed to fetch report: ${response.status}`)
  return payload
}

export interface CashFlowReport {
  operatingActivities: { name: string; amount: number }[]
  investingActivities: { name: string; amount: number }[]
  financingActivities: { name: string; amount: number }[]
  netCashFlow: number
  openingBalance: number
  closingBalance: number
}

export async function getCashFlowReport(
  token: string,
  businessId: string,
  filters?: { fromDate?: string; toDate?: string }
): Promise<CashFlowReport> {
  const searchParams = new URLSearchParams()
  if (filters?.fromDate) searchParams.set('fromDate', filters.fromDate)
  if (filters?.toDate) searchParams.set('toDate', filters.toDate)
  
  const query = searchParams.toString()
  const response = await fetch(`${API_ROOT}/reports/cash-flow${query ? `?${query}` : ''}`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Failed to fetch report: ${response.status}`)
  return payload
}

export interface TrialBalanceReport {
  accounts: { id: string; name: string; code: string; type: string; netDebit: number; netCredit: number }[]
  totalDebit: number
  totalCredit: number
  balances: boolean
}

export async function getTrialBalanceReport(
  token: string,
  businessId: string
): Promise<TrialBalanceReport> {
  const response = await fetch(`${API_ROOT}/reports/trial-balance`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Failed to fetch report: ${response.status}`)
  return payload
}

export interface GeneralLedgerReport {
  entries: { id: string; date: string; account: { name: string; code: string; type: string }; description: string; debit: number; credit: number; runningBalance: number }[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export async function getGeneralLedgerReport(
  token: string,
  businessId: string,
  page: number = 1,
  limit: number = 25,
  accountId?: string
): Promise<GeneralLedgerReport> {
  const searchParams = new URLSearchParams()
  searchParams.set('page', page.toString())
  searchParams.set('limit', limit.toString())
  if (accountId) searchParams.set('accountId', accountId)
  
  const query = searchParams.toString()
  const response = await fetch(`${API_ROOT}/reports/general-ledger${query ? `?${query}` : ''}`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Failed to fetch report: ${response.status}`)
  return payload
}

export interface AccountsReceivableReport {
  invoices: { id: string; customerName: string; invoiceNumber: string; invoiceDate: string; dueDate: string; amount: number; balanceDue: number; daysOverdue: number; status: string }[]
  buckets: {
    current: { count: number; total: number }
    thirty: { count: number; total: number }
    sixty: { count: number; total: number }
    ninety: { count: number; total: number }
    older: { count: number; total: number }
  }
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export async function getAccountsReceivableReport(
  token: string,
  businessId: string,
  page: number = 1,
  limit: number = 25
): Promise<AccountsReceivableReport> {
  const searchParams = new URLSearchParams()
  searchParams.set('page', page.toString())
  searchParams.set('limit', limit.toString())
  
  const query = searchParams.toString()
  const response = await fetch(`${API_ROOT}/reports/accounts-receivable${query ? `?${query}` : ''}`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Failed to fetch report: ${response.status}`)
  return payload
}

export interface AccountsPayableReport {
  bills: { id: string; vendorName: string; billNumber: string; billDate: string; dueDate: string; amount: number; balanceDue: number; daysOverdue: number; status: string }[]
  buckets: {
    current: { count: number; total: number }
    thirty: { count: number; total: number }
    sixty: { count: number; total: number }
    ninety: { count: number; total: number }
    older: { count: number; total: number }
  }
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export async function getAccountsPayableReport(
  token: string,
  businessId: string,
  page: number = 1,
  limit: number = 25
): Promise<AccountsPayableReport> {
  const searchParams = new URLSearchParams()
  searchParams.set('page', page.toString())
  searchParams.set('limit', limit.toString())
  
  const query = searchParams.toString()
  const response = await fetch(`${API_ROOT}/reports/accounts-payable${query ? `?${query}` : ''}`, {
    headers: buildHeaders(token, businessId),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Failed to fetch report: ${response.status}`)
  return payload
}
