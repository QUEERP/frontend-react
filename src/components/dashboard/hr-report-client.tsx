import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Clock, CalendarDays, Receipt, Timer, CreditCard, Landmark, FileText, Briefcase, Download } from 'lucide-react'
import { getTradingHRReport, HRReportData } from '@/lib/api/hr-reports'
import { formatCurrency } from '@/lib/utils/currency'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KpiCard } from './shared/kpi-card'
import { TabPills } from './shared/tab-pills'
import { StatusPill } from './shared/status-pill'
import { DateRangePicker } from './shared/date-range-picker'
import { ServerPagination } from '../ui/server-pagination'
import { exportReportToExcel, exportReportToPDF, exportAllReportToExcel, exportAllReportToPDF, ExportTabConfig } from '@/lib/utils/report-exports'

const getTabExportConfig = (tab: string): ExportTabConfig | null => {
  switch (tab) {
    case 'employees':
      return {
        title: 'Employees Report',
        fileName: 'Employees_Report.xlsx',
        columns: [
          { header: 'Employee', key: 'name' },
          { header: 'Department/Role', key: 'designation' },
          { header: 'Join Date', key: 'joinDate' },
          { header: 'Status', key: 'status' }
        ],
        dataMapper: (d) => d?.lists?.employees?.map((v: any) => ({
          ...v,
          joinDate: v.joinDate ? new Date(v.joinDate).toLocaleDateString() : 'N/A'
        })) || []
      };
    case 'attendance':
      return {
        title: 'Attendance Report',
        fileName: 'Attendance_Report.xlsx',
        columns: [
          { header: 'Date', key: 'date' },
          { header: 'Employee', key: 'employeeName' },
          { header: 'Check-in', key: 'checkIn' },
          { header: 'Check-out', key: 'checkOut' },
          { header: 'Status', key: 'status' }
        ],
        dataMapper: (d) => d?.lists?.attendance?.map((v: any) => ({
          ...v,
          date: v.date ? new Date(v.date).toLocaleDateString() : 'N/A',
          employeeName: v.employee?.name || '-',
          checkIn: v.checkIn ? new Date(v.checkIn).toLocaleTimeString() : '-',
          checkOut: v.checkOut ? new Date(v.checkOut).toLocaleTimeString() : '-'
        })) || []
      };
    case 'leave-management':
      return {
        title: 'Leave Management Report',
        fileName: 'Leave_Report.xlsx',
        columns: [
          { header: 'Employee', key: 'employeeName' },
          { header: 'Leave Type', key: 'leaveCode' },
          { header: 'Date', key: 'date' },
          { header: 'Duration', key: 'duration' },
          { header: 'Status', key: 'status' }
        ],
        dataMapper: (d) => d?.lists?.leaveManagement?.map((v: any) => ({
          ...v,
          employeeName: v.employee?.name || '-',
          date: v.date ? new Date(v.date).toLocaleDateString() : 'N/A'
        })) || []
      };
    case 'payroll':
      return {
        title: 'Payroll Report',
        fileName: 'Payroll_Report.xlsx',
        columns: [
          { header: 'Employee', key: 'employeeName' },
          { header: 'Period', key: 'period' },
          { header: 'Gross', key: 'basicSalary' },
          { header: 'Deductions', key: 'deduction' },
          { header: 'Net', key: 'netSalary' },
          { header: 'Status', key: 'status' }
        ],
        dataMapper: (d) => d?.lists?.payroll?.map((v: any) => ({
          ...v,
          period: v.payroll ? `${v.payroll.month}/${v.payroll.year}` : '-',
        })) || []
      };
    case 'overtime':
      return {
        title: 'Overtime Report',
        fileName: 'Overtime_Report.xlsx',
        columns: [
          { header: 'Employee', key: 'employeeName' },
          { header: 'Date', key: 'date' },
          { header: 'Hours', key: 'overtimeHours' },
          { header: 'Rate', key: 'rate' },
          { header: 'Amount', key: 'amount' },
          { header: 'Status', key: 'status' }
        ],
        dataMapper: (d) => d?.lists?.overtime?.map((v: any) => ({
          ...v,
          employeeName: v.employee?.name || '-',
          date: v.date ? new Date(v.date).toLocaleDateString() : 'N/A'
        })) || []
      };
    case 'loans-advances':
      return {
        title: 'Loans and Advances',
        fileName: 'Loans_Report.xlsx',
        columns: [
          { header: 'Employee', key: 'employeeName' },
          { header: 'Type', key: 'type' },
          { header: 'Amount', key: 'totalAmount' },
          { header: 'Balance Remaining', key: 'remainingAmount' },
          { header: 'Status', key: 'status' }
        ],
        dataMapper: (d) => d?.lists?.loansAdvances?.map((v: any) => ({
          ...v,
          employeeName: v.employee?.name || '-',
          type: 'Loan'
        })) || []
      };
    case 'bank-requests':
      return {
        title: 'Bank Requests',
        fileName: 'Bank_Requests_Report.xlsx',
        columns: [
          { header: 'Employee', key: 'employeeName' },
          { header: 'Bank', key: 'bankName' },
          { header: 'Date', key: 'date' },
          { header: 'Status', key: 'status' }
        ],
        dataMapper: (d) => d?.lists?.bankRequests?.map((v: any) => ({
          ...v,
          employeeName: v.employee?.name || '-',
          date: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'
        })) || []
      };
    case 'documents':
      return {
        title: 'Documents',
        fileName: 'Documents_Report.xlsx',
        columns: [
          { header: 'Document Name', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Date', key: 'date' },
          { header: 'Status', key: 'status' }
        ],
        dataMapper: (d) => d?.lists?.documents?.map((v: any) => ({
          ...v,
          date: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'
        })) || []
      };
    case 'employee-documents':
      return {
        title: 'Employee Documents',
        fileName: 'Employee_Documents_Report.xlsx',
        columns: [
          { header: 'Employee', key: 'employeeName' },
          { header: 'Document Type', key: 'type' },
          { header: 'Date', key: 'date' },
          { header: 'Status', key: 'status' }
        ],
        dataMapper: (d) => d?.lists?.employeeDocuments?.map((v: any) => ({
          ...v,
          employeeName: v.employee?.name || '-',
          date: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'
        })) || []
      };
    default:
      return null;
  }
}

const getAllExportConfigs = (): ExportTabConfig[] => {
  return [
    getTabExportConfig('employees'),
    getTabExportConfig('attendance'),
    getTabExportConfig('leave-management'),
    getTabExportConfig('payroll'),
    getTabExportConfig('overtime'),
    getTabExportConfig('loans-advances'),
    getTabExportConfig('bank-requests'),
    getTabExportConfig('documents'),
    getTabExportConfig('employee-documents')
  ].filter(Boolean) as ExportTabConfig[];
}

export function HRReportClient({ businessId }: { businessId: string }) {
  const [data, setData] = useState<HRReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('employees')
  const [page, setPage] = useState(1)
  const pageSize = 25;
  const currency = "AED";

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const result = await getTradingHRReport(
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
            lists: {
              ...prev.lists,
              ...result.lists
            }
          };
        });
      } catch (error) {
        console.error("Failed to load HR report", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [businessId, dateRange, activeTab, page]);

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
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              HR Report
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Overview of employees, payroll, and HR operations.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <DateRangePicker 
              date={dateRange} 
              onDateChange={(dr) => { setDateRange(dr); setPage(1); }} 
            />
            <Button variant="outline" size="sm" onClick={() => {
            const configs = getAllExportConfigs();
            exportAllReportToPDF(configs, data, 'HR_Report_All.pdf');
          }} className="ml-2 gap-2 text-red-600 hover:text-red-700">
            <FileText className="size-4" />
            Export All PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const configs = getAllExportConfigs();
            exportAllReportToExcel(configs, data, 'HR_Report_All.xlsx');
          }} className="ml-2 gap-2 text-emerald-600 hover:text-emerald-700">
            <Download className="size-4" />
            Export All Excel
          </Button>
        </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={loading ? 'opacity-50 pointer-events-none transition-opacity grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4' : 'transition-opacity grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4'}>
        <KpiCard
          title="Total Headcount"
          value={data?.kpis?.totalHeadcount?.toString() || "0"}
          icon={Users}
          subtext="Active employees"
          colorClass="border-blue-500"
          bgClass="bg-blue-100 dark:bg-blue-900/30"
          textClass="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          title="Pending Leave Requests"
          value={data?.kpis?.pendingLeaveRequests?.toString() || "0"}
          icon={CalendarDays}
          subtext="Awaiting approval"
          colorClass="border-amber-500"
          bgClass="bg-amber-100 dark:bg-amber-900/30"
          textClass="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          title="Payroll This Period"
          value={formatCurrency(data?.kpis?.payrollThisPeriod || 0)}
          icon={Receipt}
          subtext="Processed/pending"
          colorClass="border-emerald-500"
          bgClass="bg-emerald-100 dark:bg-emerald-900/30"
          textClass="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          title="Overtime This Period"
          value={`${data?.kpis?.overtimeHours || 0} hrs`}
          icon={Timer}
          subtext="Total overtime"
          colorClass="border-purple-500"
          bgClass="bg-purple-100 dark:bg-purple-900/30"
          textClass="text-purple-600 dark:text-purple-400"
        />
        <KpiCard
          title="Open Loans/Advances"
          value={formatCurrency(data?.kpis?.openLoansBalance || 0)}
          icon={CreditCard}
          subtext={`${data?.kpis?.openLoansCount || 0} active loans`}
          colorClass="border-indigo-500"
          bgClass="bg-indigo-100 dark:bg-indigo-900/30"
          textClass="text-indigo-600 dark:text-indigo-400"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabPills 
            tabs={[
              { value: 'employees', label: 'Employees' },
              { value: 'attendance', label: 'Attendance' },
              { value: 'leave-management', label: 'Leave Management' },
              { value: 'payroll', label: 'Payroll' },
              { value: 'overtime', label: 'Overtime' },
              { value: 'loans-advances', label: 'Loans & Advances' },
              { value: 'bank-requests', label: 'Bank Requests' },
              { value: 'documents', label: 'Documents' },
              { value: 'employee-documents', label: 'Employee Documents' }
            ]} 
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const cfg = getTabExportConfig(activeTab);
              if(cfg) exportReportToPDF(cfg, data);
            }} className="bg-white hover:bg-slate-50 border-slate-200">
              <FileText className="h-4 w-4 mr-2 text-rose-500" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const cfg = getTabExportConfig(activeTab);
              if(cfg) exportReportToExcel(cfg, data);
            }} className="bg-white hover:bg-slate-50 border-slate-200">
              <Download className="h-4 w-4 mr-2 text-emerald-600" />
              Export Excel
            </Button>
          </div>
        </div>

        <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
          {/* EMPLOYEES */}
          <TabsContent value="employees" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department / Role</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.employees?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No employees found in this period.</TableCell></TableRow>
                    ) : (data?.lists?.employees || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.designation || '-'}</TableCell>
                        <TableCell>{item.joinDate ? new Date(item.joinDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.employeesTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          {/* ATTENDANCE */}
          <TabsContent value="attendance" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.attendance?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No attendance records found.</TableCell></TableRow>
                    ) : (data?.lists?.attendance || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{item.employee?.name}</TableCell>
                        <TableCell>{item.checkIn ? new Date(item.checkIn).toLocaleTimeString() : '-'}</TableCell>
                        <TableCell>{item.checkOut ? new Date(item.checkOut).toLocaleTimeString() : '-'}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.attendanceTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          {/* LEAVE MANAGEMENT */}
          <TabsContent value="leave-management" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.leaveManagement?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No leave records found.</TableCell></TableRow>
                    ) : (data?.lists?.leaveManagement || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.employee?.name}</TableCell>
                        <TableCell>{item.leaveCode}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>{item.duration}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.leaveManagementTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          {/* PAYROLL */}
          <TabsContent value="payroll" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.payroll?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payroll records found.</TableCell></TableRow>
                    ) : (data?.lists?.payroll || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.employeeName}</TableCell>
                        <TableCell>{item.payroll ? `${item.payroll.month}/${item.payroll.year}` : '-'}</TableCell>
                        <TableCell>{formatCurrency(item.basicSalary, currency)}</TableCell>
                        <TableCell>{formatCurrency(item.deduction, currency)}</TableCell>
                        <TableCell>{formatCurrency(item.netSalary, currency)}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.payrollTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          {/* OVERTIME */}
          <TabsContent value="overtime" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.overtime?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No overtime records found.</TableCell></TableRow>
                    ) : (data?.lists?.overtime || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.employee?.name}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>{item.overtimeHours}</TableCell>
                        <TableCell>{formatCurrency(item.rate, currency)}</TableCell>
                        <TableCell>{formatCurrency(item.amount, currency)}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.overtimeTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          {/* LOANS & ADVANCES */}
          <TabsContent value="loans-advances" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance Remaining</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.loansAdvances?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No loans or advances found.</TableCell></TableRow>
                    ) : (data?.lists?.loansAdvances || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.employee?.name}</TableCell>
                        <TableCell>Loan</TableCell>
                        <TableCell>{formatCurrency(item.totalAmount, currency)}</TableCell>
                        <TableCell>{formatCurrency(item.remainingAmount, currency)}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.loansAdvancesTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          {/* BANK REQUESTS */}
          <TabsContent value="bank-requests" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.bankRequests?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No bank requests found.</TableCell></TableRow>
                    ) : (data?.lists?.bankRequests || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.employee?.name}</TableCell>
                        <TableCell>Bank Change</TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.bankRequestsTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Uploaded Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.documents?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No documents found.</TableCell></TableRow>
                    ) : (data?.lists?.documents || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.documentsTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>

          {/* EMPLOYEE DOCUMENTS */}
          <TabsContent value="employee-documents" className="m-0">
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Uploaded Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.lists?.employeeDocuments?.length || 0) === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No employee documents found.</TableCell></TableRow>
                    ) : (data?.lists?.employeeDocuments || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.employee?.name}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell><StatusPill status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data?.lists?.employeeDocumentsTotalCount || 0} onPageChange={setPage} />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
