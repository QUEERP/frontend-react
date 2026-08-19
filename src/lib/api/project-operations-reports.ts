import { getCookie } from '@/lib/utils';
import { API_ROOT } from "@/config/api";

export interface ProjectOperationsReportData {
  kpis: {
    totalProjects: number;
    openIssues: number;
    totalExpenses: number;
    revenueCollected: number;
    profitability: number;
  };
  funnel: {
    requirements: { count: number; value: number };
    estimations: { count: number; value: number };
    projects: { count: number; value: number };
    changeRequests: { count: number; value: number };
    support: {
      warrantyActive: number;
      amcActive: number;
      ticketsOpen: number;
    };
  };
  lists: {
    projects: any[];
    projectsTotalCount: number;
    tasks: any[];
    tasksTotalCount: number;
    milestones: any[];
    milestonesTotalCount: number;
    issues: any[];
    issuesTotalCount: number;
    changeRequests: any[];
    changeRequestsTotalCount: number;
    expenses: any[];
    expensesTotalCount: number;
    billing: any[];
    billingTotalCount: number;
    warranty: any[];
    warrantyTotalCount: number;
    tickets: any[];
    ticketsTotalCount: number;
  };
}

export const getProjectOperationsReport = async (
  businessId: string,
  dateRange?: {
    startDate: string;
    endDate: string;
  } | any,
  tab: string = 'projects',
  page: number = 1,
  pageSize: number = 25
): Promise<ProjectOperationsReportData> => {
  const params = new URLSearchParams();
  if (dateRange?.startDate) params.append("startDate", dateRange.startDate);
  if (dateRange?.endDate) params.append("endDate", dateRange.endDate);
  
  params.append("tab", tab);
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const query = params.toString();
  const url = `${API_ROOT}/project-operations-reports${query ? `?${query}` : ""}`;
  
  const token = getCookie('token') || getCookie('accessToken');

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-business-id': businessId || ''
    }
  });

  if (!res.ok) {
    throw new Error('Failed to load project operations report');
  }

  return res.json();
};
