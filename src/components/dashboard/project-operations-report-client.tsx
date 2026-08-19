import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, Briefcase, FileText, BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { KpiCard } from './shared/kpi-card'
import { StatusPill } from './shared/status-pill'
import { TabPills } from './shared/tab-pills'
import { LifecycleFunnel } from './shared/lifecycle-funnel'
import { exportReportToExcel, exportReportToPDF, exportAllReportToExcel, exportAllReportToPDF, ExportTabConfig } from '@/lib/utils/report-exports'
import { DateRangePicker } from './shared/date-range-picker'
import { ServerPagination } from '@/components/ui/server-pagination'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { getProjectOperationsReport, ProjectOperationsReportData } from '@/lib/api/project-operations-reports';

const PROJECT_REPORT_TABS = [
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'milestones', label: 'Milestones' },
  { value: 'issues', label: 'Issues' },
  { value: 'change-requests', label: 'Change Requests' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'billing', label: 'Billing' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'tickets', label: 'Tickets' }
];

export function ProjectOperationsReportClient({ businessId }: { businessId: string }) {
  const [data, setData] = useState<ProjectOperationsReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('projects')
  const [page, setPage] = useState(1)
  const tabCache = useRef<Record<string, any>>({})
  const pageSize = 25;
  
  const currency = "AED"; // Can be dynamic

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const result = await getProjectOperationsReport(
          businessId,
          dateRange?.from && dateRange?.to ? {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString()
          } : undefined,
          activeTab,
          page,
          pageSize
        );
        setData(prev => {
          if (!prev) return result;
          return {
            ...result,
            kpis: result.kpis || prev.kpis,
            funnel: result.funnel || prev.funnel,
            lists: {
              ...prev.lists,
              ...result.lists
            }
          };
        });
      } catch (error) {
        console.error("Failed to load project operations report", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [businessId, dateRange, activeTab, page]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
  };

  const getExportConfig = (): ExportTabConfig | null => {
    if (!data) return null;
    
    switch (activeTab) {
      case 'projects': return {
        title: 'Projects',
        fileName: 'Projects_Report',
        dataMapper: () => data.lists.projects,
        columns: [
          { header: 'Project Name', key: 'projectName' },
          { header: 'Status', key: 'status' },
          { header: 'Budget', key: 'budget' },
          { header: 'Cost', key: 'actualCost' },
          { header: 'Profitability (%)', key: 'profitability' },
          { header: 'Date', key: 'createdAt' }
        ]
      };
      case 'tasks': return {
        title: 'Tasks',
        fileName: 'Tasks_Report',
        dataMapper: () => data.lists.tasks,
        columns: [
          { header: 'Task Name', key: 'title' },
          { header: 'Project', key: 'project.projectName' },
          { header: 'Due Date', key: 'dueDate' },
          { header: 'Status', key: 'status' }
        ]
      };
      case 'milestones': return {
        title: 'Milestones',
        fileName: 'Milestones_Report',
        dataMapper: () => data.lists.milestones,
        columns: [
          { header: 'Milestone Name', key: 'name' },
          { header: 'Project', key: 'project.projectName' },
          { header: 'Due Date', key: 'dueDate' },
          { header: 'Status', key: 'status' }
        ]
      };
      case 'issues': return {
        title: 'Issues',
        fileName: 'Issues_Report',
        dataMapper: () => data.lists.issues,
        columns: [
          { header: 'Issue Name', key: 'title' },
          { header: 'Project', key: 'project.projectName' },
          { header: 'Priority', key: 'priority' },
          { header: 'Status', key: 'status' }
        ]
      };
      case 'change-requests': return {
        title: 'Change Requests',
        fileName: 'Change_Requests_Report',
        dataMapper: () => data.lists.changeRequests,
        columns: [
          { header: 'Request', key: 'title' },
          { header: 'Project', key: 'project.projectName' },
          { header: 'Status', key: 'status' },
          { header: 'Date', key: 'createdAt' }
        ]
      };
      case 'expenses': return {
        title: 'Expenses',
        fileName: 'Expenses_Report',
        dataMapper: () => data.lists.expenses,
        columns: [
          { header: 'Date', key: 'date' },
          { header: 'Project', key: 'project.projectName' },
          { header: 'Category', key: 'category' },
          { header: 'Amount', key: 'amount' },
          { header: 'Status', key: 'status' }
        ]
      };
      case 'billing': return {
        title: 'Billing',
        fileName: 'Billing_Report',
        dataMapper: () => data.lists.billing,
        columns: [
          { header: 'Date', key: 'invoiceDate' },
          { header: 'Project', key: 'project.projectName' },
          { header: 'Amount', key: 'grandTotal' },
          { header: 'Status', key: 'status' }
        ]
      };
      case 'warranty': return {
        title: 'Warranty',
        fileName: 'Warranty_Report',
        dataMapper: () => data.lists.warranty,
        columns: [
          { header: 'Project', key: 'project.projectName' },
          { header: 'Start Date', key: 'startDate' },
          { header: 'End Date', key: 'endDate' },
          { header: 'Status', key: 'status' }
        ]
      };
      case 'tickets': return {
        title: 'Tickets',
        fileName: 'Tickets_Report',
        dataMapper: () => data.lists.tickets,
        columns: [
          { header: 'Subject', key: 'subject' },
          { header: 'Project', key: 'project.projectName' },
          { header: 'Priority', key: 'priority' },
          { header: 'Status', key: 'status' },
          { header: 'Date', key: 'createdAt' }
        ]
      };
      default: return null;
    }
  };

  const getAllExportConfigs = (): ExportTabConfig[] => {
    const tabs = ['projects', 'tasks', 'milestones', 'issues', 'change-requests', 'expenses', 'billing', 'warranty', 'tickets'];
    const configs: ExportTabConfig[] = [];
    
    // Using a bit of a hack here to reuse the getExportConfig logic without actually changing state visually
    // In a real app we'd decouple the config generator from state
    const generator = (tab: string): ExportTabConfig | null => {
      if (!data) return null;
      switch (tab) {
        case 'projects': return { title: 'Projects', fileName: 'Projects_Report', dataMapper: () => data.lists.projects, columns: [{ header: 'Project Name', key: 'projectName' }, { header: 'Status', key: 'status' }, { header: 'Budget', key: 'budget' }, { header: 'Cost', key: 'actualCost' }, { header: 'Profitability (%)', key: 'profitability' }, { header: 'Date', key: 'createdAt' }] };
        case 'tasks': return { title: 'Tasks', fileName: 'Tasks_Report', dataMapper: () => data.lists.tasks, columns: [{ header: 'Task Name', key: 'title' }, { header: 'Project', key: 'project.projectName' }, { header: 'Due Date', key: 'dueDate' }, { header: 'Status', key: 'status' }] };
        case 'milestones': return { title: 'Milestones', fileName: 'Milestones_Report', dataMapper: () => data.lists.milestones, columns: [{ header: 'Milestone Name', key: 'name' }, { header: 'Project', key: 'project.projectName' }, { header: 'Due Date', key: 'dueDate' }, { header: 'Status', key: 'status' }] };
        case 'issues': return { title: 'Issues', fileName: 'Issues_Report', dataMapper: () => data.lists.issues, columns: [{ header: 'Issue Name', key: 'title' }, { header: 'Project', key: 'project.projectName' }, { header: 'Priority', key: 'priority' }, { header: 'Status', key: 'status' }] };
        case 'change-requests': return { title: 'Change Requests', fileName: 'Change_Requests_Report', dataMapper: () => data.lists.changeRequests, columns: [{ header: 'Request', key: 'title' }, { header: 'Project', key: 'project.projectName' }, { header: 'Status', key: 'status' }, { header: 'Date', key: 'createdAt' }] };
        case 'expenses': return { title: 'Expenses', fileName: 'Expenses_Report', dataMapper: () => data.lists.expenses, columns: [{ header: 'Date', key: 'date' }, { header: 'Project', key: 'project.projectName' }, { header: 'Category', key: 'category' }, { header: 'Amount', key: 'amount' }, { header: 'Status', key: 'status' }] };
        case 'billing': return { title: 'Billing', fileName: 'Billing_Report', dataMapper: () => data.lists.billing, columns: [{ header: 'Date', key: 'invoiceDate' }, { header: 'Project', key: 'project.projectName' }, { header: 'Amount', key: 'grandTotal' }, { header: 'Status', key: 'status' }] };
        case 'warranty': return { title: 'Warranty', fileName: 'Warranty_Report', dataMapper: () => data.lists.warranty, columns: [{ header: 'Project', key: 'project.projectName' }, { header: 'Start Date', key: 'startDate' }, { header: 'End Date', key: 'endDate' }, { header: 'Status', key: 'status' }] };
        case 'tickets': return { title: 'Tickets', fileName: 'Tickets_Report', dataMapper: () => data.lists.tickets, columns: [{ header: 'Subject', key: 'subject' }, { header: 'Project', key: 'project.projectName' }, { header: 'Priority', key: 'priority' }, { header: 'Status', key: 'status' }, { header: 'Date', key: 'createdAt' }] };
        default: return null;
      }
    };

    tabs.forEach(t => {
      const cfg = generator(t);
      if (cfg) configs.push(cfg);
    });
    
    return configs;
  };

  if (loading && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  if (!data) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Project Operations Report</h1>
            <p className="text-muted-foreground text-sm font-medium">Comprehensive view of projects, funnel, issues, and financials.</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <DateRangePicker 
              date={dateRange} 
              onDateChange={setDateRange} 
            />
            <Button variant="outline" size="sm" onClick={() => {
              const configs = getAllExportConfigs();
              exportAllReportToPDF(configs, data, 'Project_Operations_Report_All.pdf');
            }} className="ml-2 gap-2 text-red-600 hover:text-red-700">
              <FileText className="size-4" />
              Export All PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const configs = getAllExportConfigs();
              exportAllReportToExcel(configs, data, 'Project_Operations_Report_All.xlsx');
            }} className="ml-2 gap-2 text-emerald-600 hover:text-emerald-700">
              <Download className="size-4" />
              Export All Excel
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Projects"
          value={data.kpis.totalProjects.toString()}
          subtext="Active projects"
          icon={Briefcase}
          colorClass="border-l-blue-500"
          bgClass="bg-blue-50"
          textClass="text-blue-500"
        />
        <KpiCard
          title="Open Issues"
          value={data.kpis.openIssues.toString()}
          subtext="Unresolved issues"
          icon={AlertCircle}
          colorClass="border-l-rose-500"
          bgClass="bg-rose-50"
          textClass="text-rose-500"
        />
        <KpiCard
          title="Total Expenses"
          value={formatCurrency(data.kpis.totalExpenses, currency)}
          subtext="Expenses this period"
          icon={BarChart3}
          colorClass="border-l-amber-500"
          bgClass="bg-amber-50"
          textClass="text-amber-500"
        />
        <KpiCard
          title="Revenue Collected"
          value={formatCurrency(data.kpis.revenueCollected, currency)}
          subtext="Payments this period"
          icon={BarChart3}
          colorClass="border-l-emerald-500"
          bgClass="bg-emerald-50"
          textClass="text-emerald-500"
        />
        <KpiCard
          title="Profitability"
          value={`${data.kpis.profitability.toFixed(1)}%`}
          subtext="Overall margin"
          icon={BarChart3}
          colorClass="border-l-indigo-500"
          bgClass="bg-indigo-50"
          textClass="text-indigo-500"
        />
      </div>

      {/* Funnel */}
      <LifecycleFunnel 
        title="Project Lifecycle"
        description="Conversion from initial inquiry to won project"
        stages={[
          { name: 'Requirements', count: data.funnel.requirements.count, value: data.funnel.requirements.value },
          { name: 'Estimations', count: data.funnel.estimations.count, value: data.funnel.estimations.value },
          { name: 'Projects', count: data.funnel.projects.count, value: data.funnel.projects.value }
        ]}
        branches={[
          {
            name: 'Change Requests',
            count: data.funnel.changeRequests.count,
            value: data.funnel.changeRequests.value,
            note: 'Post-win scope changes'
          },
          {
            name: 'Support & Warranty',
            count: data.funnel.support.warrantyActive + data.funnel.support.amcActive + data.funnel.support.ticketsOpen,
            value: 0,
            note: `${data.funnel.support.warrantyActive} Warranties · ${data.funnel.support.amcActive} AMCs · ${data.funnel.support.ticketsOpen} Tickets`
          }
        ]}
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabPills tabs={PROJECT_REPORT_TABS} />
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const cfg = getExportConfig();
                if(cfg) exportReportToPDF(cfg, data);
              }} className="bg-white hover:bg-slate-50 border-slate-200">
                <FileText className="h-4 w-4 mr-2 text-rose-500" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const cfg = getExportConfig();
                if(cfg) exportReportToExcel(cfg, data);
              }} className="bg-white hover:bg-slate-50 border-slate-200">
                <Download className="h-4 w-4 mr-2 text-emerald-500" />
                Export Excel
              </Button>
            </div>
          </div>
          
          <TabsContent value="projects" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Profitability</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.projects?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No active projects found. Go to Projects to add one.</TableCell></TableRow>
                    ) : (data?.lists?.projects || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.projectName}</TableCell>
                        <TableCell>{formatCurrency(item.budget, currency)}</TableCell>
                        <TableCell>{formatCurrency(item.actualCost, currency)}</TableCell>
                        <TableCell>{item.profitability?.toFixed(1)}%</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.projectsTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.tasks?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No tasks found.</TableCell></TableRow>
                    ) : (data?.lists?.tasks || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.project?.projectName}</TableCell>
                        <TableCell>{item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.tasksTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Milestone Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.milestones?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No milestones found.</TableCell></TableRow>
                    ) : (data?.lists?.milestones || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.project?.projectName}</TableCell>
                        <TableCell>{item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.milestonesTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Issue Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.issues?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No issues found.</TableCell></TableRow>
                    ) : (data?.lists?.issues || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.project?.projectName}</TableCell>
                        <TableCell>{item.priority}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.issuesTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          <TabsContent value="change-requests" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Request</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.changeRequests?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No change requests found.</TableCell></TableRow>
                    ) : (data?.lists?.changeRequests || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title || 'Request'}</TableCell>
                        <TableCell>{item.project?.projectName}</TableCell>
                        <TableCell>{item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.changeRequestsTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.expenses?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No project expenses found.</TableCell></TableRow>
                    ) : (data?.lists?.expenses || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date ? format(new Date(item.date), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell>{item.project?.projectName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{formatCurrency(item.amount, currency)}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.expensesTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.billing?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No project billing found.</TableCell></TableRow>
                    ) : (data?.lists?.billing || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.invoiceDate ? format(new Date(item.invoiceDate), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell>{item.project?.projectName}</TableCell>
                        <TableCell>{formatCurrency(item.grandTotal, currency)}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.billingTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          <TabsContent value="warranty" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.warranty?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No warranties found.</TableCell></TableRow>
                    ) : (data?.lists?.warranty || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.project?.projectName}</TableCell>
                        <TableCell>{item.startDate ? format(new Date(item.startDate), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell>{item.endDate ? format(new Date(item.endDate), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.warrantyTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.tickets?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No tickets found.</TableCell></TableRow>
                    ) : (data?.lists?.tickets || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.subject}</TableCell>
                        <TableCell>{item.project?.projectName}</TableCell>
                        <TableCell>{item.priority}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                        <TableCell>{item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.ticketsTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
