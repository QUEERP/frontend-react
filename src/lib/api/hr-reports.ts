import { API_ROOT } from "@/config/api";

function buildHeaders(businessId: string): HeadersInit {
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }
  const token = getCookie('token') || getCookie('accessToken')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-business-id': businessId,
  }
}

export interface HRReportData {
  kpis?: {
    totalHeadcount: number;
    pendingLeaveRequests: number;
    payrollThisPeriod: number;
    overtimeHours: number;
    openLoansCount: number;
    openLoansBalance: number;
  };
  lists?: {
    employees?: any[];
    employeesTotalCount?: number;
    attendance?: any[];
    attendanceTotalCount?: number;
    leaveManagement?: any[];
    leaveManagementTotalCount?: number;
    payroll?: any[];
    payrollTotalCount?: number;
    overtime?: any[];
    overtimeTotalCount?: number;
    loansAdvances?: any[];
    loansAdvancesTotalCount?: number;
    bankRequests?: any[];
    bankRequestsTotalCount?: number;
    documents?: any[];
    documentsTotalCount?: number;
    employeeDocuments?: any[];
    employeeDocumentsTotalCount?: number;
  };
}

export async function getTradingHRReport(
  businessId: string, 
  dateRange?: { startDate: string, endDate: string }, 
  tab?: string, 
  page: number = 1, 
  pageSize: number = 25
): Promise<HRReportData> {
  const queryParams = new URLSearchParams();
  if (dateRange?.startDate) queryParams.append('startDate', dateRange.startDate);
  if (dateRange?.endDate) queryParams.append('endDate', dateRange.endDate);
  if (tab) queryParams.append('tab', tab);
  queryParams.append('page', page.toString());
  queryParams.append('pageSize', pageSize.toString());

  const response = await fetch(`${API_ROOT}/hr-reports/trading?${queryParams.toString()}`, {
    method: 'GET',
    headers: buildHeaders(businessId),
  });
  
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to fetch trading HR report: ${response.status}`);
  }

  return payload.data;
}
