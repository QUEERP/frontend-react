import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getTradingSalesReport, TradingSalesReportData } from '@/lib/api/reports'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Users, Receipt, Wallet, Layers } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils/currency'
import { getCookie } from '@/lib/utils'
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, Download } from 'lucide-react'
import { KpiCard } from './shared/kpi-card'
import { StatusPill } from './shared/status-pill'
import { TabPills } from './shared/tab-pills'
import { LifecycleFunnel } from './shared/lifecycle-funnel'
import { exportReportToExcel, exportReportToPDF, exportAllReportToExcel, exportAllReportToPDF, ExportTabConfig } from '@/lib/utils/report-exports'
import { DateRangePicker } from './shared/date-range-picker'
import { ServerPagination } from '@/components/ui/server-pagination'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'

const SALES_REPORT_TABS = [
  { value: 'payments', label: 'Payments' },
  { value: 'customers', label: 'Customers' },
  { value: 'credit-notes', label: 'Credit Notes' },
  { value: 'quotations', label: 'Quotations' },
  { value: 'sales-orders', label: 'Sales Orders' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'returns', label: 'Returns' },
  { value: 'recurring', label: 'Recurring' },
];

export function TradingSalesReportClient() {
  const { businessId } = useParams()
  const token = React.useMemo(() => getCookie('token') || getCookie('accessToken'), [])
  
  const [data, setData] = useState<TradingSalesReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('payments')
  const [page, setPage] = useState(1)
  const tabCache = useRef<Record<string, any>>({})
  const pageSize = 25
  
  // Example for Date Range filtering (to be wired fully)
  const [dateRange, setDateRange] = useState('this_month')
  const [customDate, setCustomDate] = useState<DateRange | undefined>()

  const handleCustomDateChange = (date: DateRange | undefined) => {
    setCustomDate(date)
    if (date?.from && date?.to) {
      setDateRange(`${format(date.from, 'yyyy-MM-dd')},${format(date.to, 'yyyy-MM-dd')}`)
    }
  }

  const currency = 'AED'

  useEffect(() => {
    if (!businessId || !token) return
    let isMounted = true
    const cacheKey = `${activeTab}-${page}-${pageSize}`;
    if (tabCache.current[cacheKey]) {
      setData(prev => prev ? { ...prev, ...tabCache.current[cacheKey] } : tabCache.current[cacheKey]);
      return;
    }
    if (!data) setLoading(true)
    setError(null)
    
    getTradingSalesReport(token, businessId, dateRange, activeTab, page, pageSize)
      .then((res) => {
        if (isMounted) {
          const responseData = res;
          tabCache.current[cacheKey] = responseData;
          setData(prev => prev ? { ...prev, ...responseData } : responseData)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => { isMounted = false }
  }, [businessId, token, dateRange, activeTab, page, pageSize])
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const getTabExportConfig = (tab: string): ExportTabConfig | null => {
    switch (tab) {
      case 'customers':
        return {
          title: 'Customers Report',
          fileName: 'Customers_Report.xlsx',
          columns: [
            { header: 'Name', key: 'company' },
            { header: 'Total invoiced', key: 'totalInvoiced' },
            { header: 'Total paid', key: 'totalPaid' },
            { header: 'Outstanding', key: 'outstanding' },
            { header: 'Last payment date', key: 'lastPaymentDate' }
          ],
          dataMapper: (d) => d?.customersList?.map((c: any) => ({
            ...c,
            company: c.company || 'N/A',
            lastPaymentDate: c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString() : 'N/A'
          })) || []
        };
      case 'payments':
        return {
          title: 'Payments Report',
          fileName: 'Payments_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Customer', key: 'customer' },
            { header: 'Project', key: 'project' },
            { header: 'Mode', key: 'mode' },
            { header: 'Amount', key: 'amount' },
            { header: 'Allocated', key: 'allocated' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.paymentsList?.map((p: any) => ({
            date: new Date(p.paymentDate).toLocaleDateString(),
            customer: p.customer?.company || 'N/A',
            project: p.project?.projectName || 'N/A',
            mode: p.paymentMode,
            amount: p.amount,
            allocated: p.amountAllocated,
            status: p.status
          })) || []
        };
      case 'credit-notes':
        return {
          title: 'Credit Notes Report',
          fileName: 'Credit_Notes_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Customer', key: 'customer' },
            { header: 'Linked invoice', key: 'linkedInvoice' },
            { header: 'Reason', key: 'reason' },
            { header: 'Amount', key: 'amount' }
          ],
          dataMapper: (d) => d?.creditNotesList?.map((c: any) => ({
            date: new Date(c.createdAt).toLocaleDateString(),
            customer: c.customer?.company || 'N/A',
            linkedInvoice: c.invoice?.invoiceNumber || 'N/A',
            reason: c.reason || 'N/A',
            amount: c.amount
          })) || []
        };
      case 'quotations':
        return {
          title: 'Quotations Report',
          fileName: 'Quotations_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Customer', key: 'customer' },
            { header: 'Value', key: 'value' },
            { header: 'Status', key: 'status' },
            { header: 'Converted to', key: 'convertedTo' }
          ],
          dataMapper: (d) => d?.quotationsList?.map((q: any) => ({
            date: new Date(q.createdAt).toLocaleDateString(),
            customer: q.customer?.company || 'N/A',
            value: q.totalAmount,
            status: q.status,
            convertedTo: q.convertedTo || 'N/A'
          })) || []
        };
      case 'sales-orders':
        return {
          title: 'Sales Orders Report',
          fileName: 'Sales_Orders_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Customer', key: 'customer' },
            { header: 'Value', key: 'value' },
            { header: 'Linked quotation', key: 'linkedQuote' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.salesOrdersList?.map((s: any) => ({
            date: new Date(s.createdAt).toLocaleDateString(),
            customer: s.customer?.company || 'N/A',
            value: s.totalAmount,
            linkedQuote: s.quotation?.quoteNumber || 'N/A',
            status: s.status
          })) || []
        };
      case 'invoices':
        return {
          title: 'Invoices Report',
          fileName: 'Invoices_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Customer', key: 'customer' },
            { header: 'Due date', key: 'dueDate' },
            { header: 'Amount', key: 'amount' },
            { header: 'Paid', key: 'paid' },
            { header: 'Balance', key: 'balance' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.invoicesList?.map((i: any) => ({
            date: new Date(i.invoiceDate).toLocaleDateString(),
            customer: i.customer?.company || 'N/A',
            dueDate: i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A',
            amount: i.grandTotal,
            paid: i.paidAmount,
            balance: i.balance,
            status: i.status
          })) || []
        };
      case 'returns':
        return {
          title: 'Sales Returns Report',
          fileName: 'Sales_Returns_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Customer', key: 'customer' },
            { header: 'Linked invoice', key: 'linkedInvoice' },
            { header: 'Reason', key: 'reason' },
            { header: 'Amount', key: 'amount' }
          ],
          dataMapper: (d) => d?.returnsList?.map((r: any) => ({
            date: new Date(r.createdAt).toLocaleDateString(),
            customer: r.customer?.company || 'N/A',
            linkedInvoice: r.invoice?.invoiceNumber || 'N/A',
            reason: r.reason || 'N/A',
            amount: r.totalAmount
          })) || []
        };
      case 'recurring':
        return {
          title: 'Recurring Invoices Report',
          fileName: 'Recurring_Invoices_Report.xlsx',
          columns: [
            { header: 'Customer', key: 'customer' },
            { header: 'Frequency', key: 'frequency' },
            { header: 'Next run date', key: 'nextRunDate' },
            { header: 'Amount', key: 'amount' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.recurringList?.map((r: any) => ({
            customer: r.customer?.company || 'N/A',
            frequency: r.frequency,
            nextRunDate: r.nextInvoiceDate ? new Date(r.nextInvoiceDate).toLocaleDateString() : 'N/A',
            amount: r.grandTotal,
            status: r.status
          })) || []
        };
      default:
        return null;
    }
  };

  const getExportConfig = () => getTabExportConfig(activeTab);
  
  const getAllExportConfigs = (): ExportTabConfig[] => {
    return SALES_REPORT_TABS.map(tab => getTabExportConfig(tab.value)).filter(Boolean) as ExportTabConfig[];
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load sales report: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) return null

  // Process data for Funnel
  // (Leads → Deals → Quotations → Sales Orders → Invoices → Payments)
  // For the sake of this report, we'll approximate using available lists
  const quotesCount = data.quotationsList?.length || 0;
  const quotesValue = data.quotationsList?.reduce((a, c) => a + (c.totalAmount || 0), 0) || 0;
  
  const ordersCount = data.salesOrdersList?.length || 0;
  const ordersValue = data.salesOrdersList?.reduce((a, c) => a + (c.totalAmount || 0), 0) || 0;
  
  const invoicesCount = data.invoicesList?.length || 0;
  const invoicesValue = data.invoicesList?.reduce((a, c) => a + (c.grandTotal || 0), 0) || 0;

  const paymentsCount = data.paymentsList?.length || 0;

  const funnelStages = [
    { name: 'Quotations', count: quotesCount, value: formatCurrency(quotesValue, currency) },
    { name: 'Sales Orders', count: ordersCount, value: formatCurrency(ordersValue, currency), conversionPercent: quotesCount ? Math.round((ordersCount / quotesCount) * 100) : 0 },
    { name: 'Invoices', count: invoicesCount, value: formatCurrency(invoicesValue, currency), conversionPercent: ordersCount ? Math.round((invoicesCount / ordersCount) * 100) : 0 },
    { name: 'Payments', count: paymentsCount, value: formatCurrency(data.totalPaymentsMade, currency), conversionPercent: invoicesCount ? Math.round((paymentsCount / invoicesCount) * 100) : 0 },
  ];

  const returnsCount = data.returnsList?.length || 0;
  const returnsValue = data.returnsList?.reduce((a, c) => a + (c.totalAmount || 0), 0) || 0;
  const recurringCount = data.recurringList?.length || 0;
  const recurringValue = data.recurringList?.reduce((a, c) => a + (c.grandTotal || 0), 0) || 0;

  const funnelBranches = [
    { name: 'Credit Notes', count: data.creditNotesList?.length || 0, value: formatCurrency(data.totalCreditNotes, currency), note: 'Adjustments applied' },
    { name: 'Returns', count: returnsCount, value: formatCurrency(returnsValue, currency), note: 'Goods returned' },
    { name: 'Recurring', count: recurringCount, value: formatCurrency(recurringValue, currency), note: 'Active profiles' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Sales Report</h1>
            <p className="text-muted-foreground text-sm font-medium">Overview of your customers, payments, and credit notes.</p>
          </div>
          <div className="flex items-center space-x-2">

            <DateRangePicker date={customDate} onDateChange={handleCustomDateChange} />
            <Button variant="outline" size="sm" onClick={() => {
              const configs = getAllExportConfigs();
              exportAllReportToPDF(configs, data, 'Sales_Report_All.pdf');
            }} className="ml-2 gap-2 text-red-600 hover:text-red-700">
              <FileText className="size-4" />
              Export All PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const configs = getAllExportConfigs();
              exportAllReportToExcel(configs, data, 'Sales_Report_All.xlsx');
            }} className="ml-2 gap-2 text-emerald-600 hover:text-emerald-700">
              <Download className="size-4" />
              Export All Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Customers" 
          value={data.totalCustomers} 
          subtext="Active customers in CRM" 
          icon={Users} 
          colorClass="border-blue-600" 
          bgClass="bg-blue-50" 
          textClass="text-blue-600" 
        />
        
        <KpiCard 
          title="Total Payments" 
          value={formatCurrency(data.totalPaymentsMade, currency)} 
          subtext="All payments received" 
          icon={Wallet} 
          colorClass="border-emerald-600" 
          bgClass="bg-emerald-50" 
          textClass="text-emerald-700" 
        />
        
        <KpiCard 
          title="Payment Allocation" 
          value="" 
          icon={Layers} 
          colorClass="border-amber-500" 
          bgClass="bg-amber-50" 
          textClass="text-amber-600" 
        >
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground">Allocated</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(data.paymentsAllocated, currency)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
              <div 
                className="bg-amber-500 h-1.5 rounded-full" 
                style={{ width: data.totalPaymentsMade > 0 ? `${(data.paymentsAllocated / data.totalPaymentsMade) * 100}%` : '0%' }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs font-semibold text-muted-foreground">Remaining</span>
              <span className="text-sm font-bold text-rose-600">{formatCurrency(data.paymentsRemaining, currency)}</span>
            </div>
          </div>
        </KpiCard>
        
        <KpiCard 
          title="Credit Notes" 
          value={formatCurrency(data.totalCreditNotes, currency)} 
          subtext="Total issued credits" 
          icon={Receipt} 
          colorClass="border-purple-600" 
          bgClass="bg-purple-50" 
          textClass="text-purple-600" 
        />
      </div>

      <LifecycleFunnel 
        title="Sales Lifecycle Funnel" 
        description="Conversion from Quotation through to Final Payment."
        stages={funnelStages} 
        branches={funnelBranches} 
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabPills tabs={SALES_REPORT_TABS} />
            
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
                <Download className="h-4 w-4 mr-2 text-emerald-600" />
                Export Excel
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
            <TabsContent value="payments" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Project</TableHead>
                      <TableHead className="font-semibold text-slate-700">Mode</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Allocated</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.paymentsList?.length > 0 ? (
                      data.paymentsList.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{payment.customer?.company || '-'}</TableCell>
                          <TableCell className="text-slate-600">{payment.project?.projectName || '-'}</TableCell>
                          <TableCell className="text-slate-600">{payment.paymentMode}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(payment.amount, currency)}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(payment.amountAllocated, currency)}</TableCell>
                          <TableCell>
                            <StatusPill status={payment.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">No payments found for this period.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.paymentsTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="customers" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Name</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Total invoiced</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Total paid</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Outstanding</TableHead>
                      <TableHead className="font-semibold text-slate-700">Last payment date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.customersList?.length > 0 ? (
                      data.customersList.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{customer.company}</TableCell>
                          <TableCell className="text-right text-slate-900">{formatCurrency(customer.totalInvoiced || 0, currency)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{formatCurrency(customer.totalPaid || 0, currency)}</TableCell>
                          <TableCell className="text-right text-rose-600">{formatCurrency(customer.outstanding || 0, currency)}</TableCell>
                          <TableCell className="text-slate-600">{customer.lastPaymentDate ? new Date(customer.lastPaymentDate).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No customers found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.customersTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="credit-notes" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Linked invoice</TableHead>
                      <TableHead className="font-semibold text-slate-700">Reason</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.creditNotesList?.length > 0 ? (
                      data.creditNotesList.map((note) => (
                        <TableRow key={note.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(note.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{note.customer?.company || '-'}</TableCell>
                          <TableCell className="text-slate-600">{note.invoice?.invoiceNumber || '-'}</TableCell>
                          <TableCell className="text-slate-600">{note.reason || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(note.amount, currency)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No credit notes found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.creditNotesTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="quotations" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Value</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Converted to</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.quotationsList?.length > 0 ? (
                      data.quotationsList.map((quote) => (
                        <TableRow key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{quote.customer?.company || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(quote.totalAmount, currency)}</TableCell>
                          <TableCell><StatusPill status={quote.status} /></TableCell>
                          <TableCell className="text-slate-600">{quote.convertedTo || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No quotations yet — create one to get started.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.quotationsTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="sales-orders" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Value</TableHead>
                      <TableHead className="font-semibold text-slate-700">Linked quotation</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.salesOrdersList?.length > 0 ? (
                      data.salesOrdersList.map((order) => (
                        <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{order.customer?.company || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(order.totalAmount, currency)}</TableCell>
                          <TableCell className="text-slate-600">{order.quotation?.quoteNumber || '-'}</TableCell>
                          <TableCell><StatusPill status={order.status} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No sales orders yet — create one to get started.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.salesOrdersTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="invoices" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Due date</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Paid</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Balance</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.invoicesList?.length > 0 ? (
                      data.invoicesList.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{invoice.customer?.company || '-'}</TableCell>
                          <TableCell className="text-slate-600">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(invoice.grandTotal, currency)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{formatCurrency(invoice.paidAmount, currency)}</TableCell>
                          <TableCell className="text-right text-rose-600">{formatCurrency(invoice.balance, currency)}</TableCell>
                          <TableCell><StatusPill status={invoice.status} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">No invoices yet — create one to get started.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.invoicesTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="returns" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Linked invoice</TableHead>
                      <TableHead className="font-semibold text-slate-700">Reason</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.returnsList?.length > 0 ? (
                      data.returnsList.map((ret) => (
                        <TableRow key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(ret.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{ret.customer?.company || '-'}</TableCell>
                          <TableCell className="text-slate-600">{ret.invoice?.invoiceNumber || '-'}</TableCell>
                          <TableCell className="text-slate-600">{ret.reason || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(ret.totalAmount, currency)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No sales returns yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.returnsTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="recurring" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Frequency</TableHead>
                      <TableHead className="font-semibold text-slate-700">Next run date</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recurringList?.length > 0 ? (
                      data.recurringList.map((rec) => (
                        <TableRow key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="text-slate-600">{rec.customer?.company || '-'}</TableCell>
                          <TableCell className="text-slate-600 capitalize">{rec.frequency.toLowerCase()}</TableCell>
                          <TableCell className="text-slate-600">{rec.nextInvoiceDate ? new Date(rec.nextInvoiceDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(rec.grandTotal, currency)}</TableCell>
                          <TableCell><StatusPill status={rec.status} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No recurring invoices yet — create one to get started.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.recurringTotalCount || 0} onPageChange={setPage} />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}
