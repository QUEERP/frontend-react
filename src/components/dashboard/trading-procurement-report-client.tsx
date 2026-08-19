import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { purchaseReportsAPI, TradingProcurementReportData } from '@/lib/api/purchase'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Users, ShoppingCart, Receipt, Wallet, Layers } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils/currency'
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

const PROCUREMENT_REPORT_TABS = [
  { value: 'vendors', label: 'Vendors' },
  { value: 'requests', label: 'Purchase Requests' },
  { value: 'orders', label: 'Purchase Orders' },
  { value: 'receipts', label: 'Receipts' },
  { value: 'bills', label: 'Bills' },
  { value: 'payments', label: 'Vendor Payments' },
  { value: 'returns', label: 'Returns' },
];

export function TradingProcurementReportClient() {
  const { businessId } = useParams()
  
  const [data, setData] = useState<TradingProcurementReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('vendors')
  const [page, setPage] = useState(1)
  const tabCache = useRef<Record<string, any>>({})
  const pageSize = 25
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
    if (!businessId) return
    let isMounted = true
    const cacheKey = `${activeTab}-${page}-${pageSize}`;
    if (tabCache.current[cacheKey]) {
      setData(prev => prev ? { ...prev, ...tabCache.current[cacheKey] } : tabCache.current[cacheKey]);
      return;
    }
    setLoading(true)
    setError(null)
    
    purchaseReportsAPI.getTradingProcurementReport(businessId, dateRange)
      .then((res) => {
        if (isMounted) {
          setData(res.data)
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
  }, [businessId, dateRange])

  const getTabExportConfig = (tab: string): ExportTabConfig | null => {
    switch (tab) {
      case 'vendors':
        return {
          title: 'Vendors Report',
          fileName: 'Vendors_Report.xlsx',
          columns: [
            { header: 'Name', key: 'name' },
            { header: 'Total billed', key: 'totalBilled' },
            { header: 'Total paid', key: 'totalPaid' },
            { header: 'Outstanding', key: 'outstanding' },
            { header: 'Last payment date', key: 'lastPaymentDate' }
          ],
          dataMapper: (d) => d?.vendorsList?.map((v: any) => ({
            ...v,
            lastPaymentDate: v.lastPaymentDate ? new Date(v.lastPaymentDate).toLocaleDateString() : 'N/A'
          })) || []
        };
      case 'requests':
        return {
          title: 'Purchase Requests Report',
          fileName: 'Purchase_Requests_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Requested by', key: 'requestedBy' },
            { header: 'Items/description', key: 'description' },
            { header: 'Value', key: 'value' },
            { header: 'Status', key: 'status' },
            { header: 'Converted to', key: 'convertedTo' }
          ],
          dataMapper: (d) => d?.purchaseRequestsList?.map((r: any) => ({
            ...r,
            date: new Date(r.createdAt).toLocaleDateString(),
            convertedTo: r.convertedTo || 'N/A'
          })) || []
        };
      case 'orders':
        return {
          title: 'Purchase Orders Report',
          fileName: 'Purchase_Orders_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Vendor', key: 'vendor' },
            { header: 'Value', key: 'value' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.purchaseOrdersList?.map((o: any) => ({
            date: new Date(o.createdAt).toLocaleDateString(),
            vendor: o.vendor?.name || 'N/A',
            value: o.totalAmount,
            status: o.status
          })) || []
        };
      case 'receipts':
        return {
          title: 'Receipts Report',
          fileName: 'Receipts_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Vendor', key: 'vendor' },
            { header: 'Linked PO', key: 'linkedPo' },
            { header: 'Items received', key: 'itemsReceived' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.receiptsList?.map((r: any) => ({
            ...r,
            date: new Date(r.date).toLocaleDateString(),
            vendor: r.vendor || 'N/A',
            linkedPo: r.linkedPo || 'N/A',
          })) || []
        };
      case 'bills':
        return {
          title: 'Bills Report',
          fileName: 'Bills_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Vendor', key: 'vendor' },
            { header: 'Due date', key: 'dueDate' },
            { header: 'Amount', key: 'amount' },
            { header: 'Paid', key: 'paid' },
            { header: 'Balance', key: 'balance' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.billsList?.map((b: any) => ({
            date: new Date(b.createdAt).toLocaleDateString(),
            vendor: b.vendor?.name || 'N/A',
            dueDate: b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'N/A',
            amount: b.grandTotal,
            paid: b.amountPaid || (b.grandTotal - b.balance),
            balance: b.balance,
            status: b.status
          })) || []
        };
      case 'payments':
        return {
          title: 'Vendor Payments Report',
          fileName: 'Vendor_Payments_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Vendor', key: 'vendor' },
            { header: 'Mode', key: 'mode' },
            { header: 'Amount', key: 'amount' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.vendorPaymentsList?.map((p: any) => ({
            date: new Date(p.paymentDate).toLocaleDateString(),
            vendor: p.vendor?.name || 'N/A',
            mode: p.paymentMode,
            amount: p.amount,
            status: p.status
          })) || []
        };
      case 'returns':
        return {
          title: 'Purchase Returns Report',
          fileName: 'Purchase_Returns_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Vendor', key: 'vendor' },
            { header: 'Linked receipt/bill', key: 'linkedSource' },
            { header: 'Reason', key: 'reason' },
            { header: 'Amount', key: 'amount' }
          ],
          dataMapper: (d) => d?.returnsList?.map((r: any) => ({
            ...r,
            date: new Date(r.date).toLocaleDateString(),
            vendor: r.vendor || 'N/A',
            linkedSource: r.linkedSource || 'N/A'
          })) || []
        };
      default:
        return null;
    }
  };

  const getExportConfig = () => getTabExportConfig(activeTab);
  
  const getAllExportConfigs = (): ExportTabConfig[] => {
    return PROCUREMENT_REPORT_TABS.map(tab => getTabExportConfig(tab.value)).filter(Boolean) as ExportTabConfig[];
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
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
          <AlertDescription>Failed to load procurement report: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) return null

  const { kpis, funnel } = data;

  const funnelStages = [
    { name: 'Purchase Requests', count: funnel.requests.count, value: formatCurrency(funnel.requests.value, currency) },
    { name: 'Purchase Orders', count: funnel.pos.count, value: formatCurrency(funnel.pos.value, currency), conversionPercent: funnel.requests.count ? Math.round((funnel.pos.count / funnel.requests.count) * 100) : 0 },
    { name: 'Receipts', count: funnel.receipts.count, value: formatCurrency(funnel.receipts.value, currency), conversionPercent: funnel.pos.count ? Math.round((funnel.receipts.count / funnel.pos.count) * 100) : 0 },
    { name: 'Bills', count: funnel.bills.count, value: formatCurrency(funnel.bills.value, currency), conversionPercent: funnel.receipts.count ? Math.round((funnel.bills.count / funnel.receipts.count) * 100) : 0 },
    { name: 'Vendor Payments', count: funnel.payments.count, value: formatCurrency(funnel.payments.value, currency), conversionPercent: funnel.bills.count ? Math.round((funnel.payments.count / funnel.bills.count) * 100) : 0 },
  ];

  const funnelBranches = [
    { name: 'Returns', count: funnel.returns.count, value: formatCurrency(funnel.returns.value, currency), note: 'Linked to Receipt/Bill' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Procurement Report</h1>
            <p className="text-muted-foreground text-sm font-medium">Overview of your vendors, purchase orders, and payments.</p>
          </div>
          <div className="flex items-center space-x-2">

            <DateRangePicker date={customDate} onDateChange={handleCustomDateChange} />
            <Button variant="outline" size="sm" onClick={() => {
              const configs = getAllExportConfigs();
              exportAllReportToPDF(configs, data, 'Procurement_Report_All.pdf');
            }} className="ml-2 gap-2 text-red-600 hover:text-red-700">
              <FileText className="size-4" />
              Export All PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const configs = getAllExportConfigs();
              exportAllReportToExcel(configs, data, 'Procurement_Report_All.xlsx');
            }} className="ml-2 gap-2 text-emerald-600 hover:text-emerald-700">
              <Download className="size-4" />
              Export All Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <KpiCard 
          title="Total Vendors" 
          value={kpis.totalVendors} 
          subtext="Active vendors" 
          icon={Users} 
          colorClass="border-blue-600" 
          bgClass="bg-blue-50" 
          textClass="text-blue-600" 
        />
        
        <KpiCard 
          title="Purchase Orders" 
          value={kpis.totalPOs} 
          subtext={formatCurrency(kpis.totalPOValue, currency)} 
          icon={ShoppingCart} 
          colorClass="border-emerald-600" 
          bgClass="bg-emerald-50" 
          textClass="text-emerald-700" 
        />

        <KpiCard 
          title="Bills" 
          value={kpis.totalBills} 
          subtext={formatCurrency(kpis.totalBillsValue, currency)} 
          icon={Receipt} 
          colorClass="border-amber-500" 
          bgClass="bg-amber-50" 
          textClass="text-amber-600" 
        />

        <KpiCard 
          title="Vendor Payments" 
          value={kpis.totalPayments} 
          subtext={formatCurrency(kpis.totalPaymentsValue, currency)} 
          icon={Wallet} 
          colorClass="border-indigo-500" 
          bgClass="bg-indigo-50" 
          textClass="text-indigo-600" 
        />
        
        <KpiCard 
          title="Outstanding" 
          value={formatCurrency(kpis.outstandingValue, currency)} 
          subtext={`${kpis.overdueBillsCount} overdue bills`} 
          icon={Layers} 
          colorClass="border-rose-500" 
          bgClass="bg-rose-50" 
          textClass="text-rose-600" 
        />
      </div>

      <LifecycleFunnel 
        title="Procurement Lifecycle Funnel" 
        description="Conversion from Purchase Request through to Final Payment."
        stages={funnelStages} 
        branches={funnelBranches} 
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabPills tabs={PROCUREMENT_REPORT_TABS} />
            
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
            <TabsContent value="vendors" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Name</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Total billed</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Total paid</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Outstanding</TableHead>
                      <TableHead className="font-semibold text-slate-700">Last payment date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.vendorsList?.length > 0 ? (
                      data.vendorsList.map((vendor) => (
                        <TableRow key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{vendor.name}</TableCell>
                          <TableCell className="text-right text-slate-900">{formatCurrency(vendor.totalBilled || 0, currency)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{formatCurrency(vendor.totalPaid || 0, currency)}</TableCell>
                          <TableCell className="text-right text-rose-600">{formatCurrency(vendor.outstanding || 0, currency)}</TableCell>
                          <TableCell className="text-slate-600">{vendor.lastPaymentDate ? new Date(vendor.lastPaymentDate).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No vendors found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.vendorsTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="requests" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Requested by</TableHead>
                      <TableHead className="font-semibold text-slate-700">Items/description</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Value</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Converted to</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.purchaseRequestsList?.length > 0 ? (
                      data.purchaseRequestsList.map((req) => (
                        <TableRow key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{req.requestedBy}</TableCell>
                          <TableCell className="text-slate-600 max-w-xs truncate">{req.description}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(req.value, currency)}</TableCell>
                          <TableCell><StatusPill status={req.status} /></TableCell>
                          <TableCell className="text-slate-600">{req.convertedTo || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">No purchase requests yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.requestsTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="orders" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Vendor</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Value</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.purchaseOrdersList?.length > 0 ? (
                      data.purchaseOrdersList.map((order) => (
                        <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{order.vendor?.name || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(order.totalAmount, currency)}</TableCell>
                          <TableCell><StatusPill status={order.status} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">No purchase orders yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.ordersTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="receipts" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Vendor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Linked PO</TableHead>
                      <TableHead className="font-semibold text-slate-700">Items received</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.receiptsList?.length > 0 ? (
                      data.receiptsList.map((receipt) => (
                        <TableRow key={receipt.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(receipt.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{receipt.vendor || '-'}</TableCell>
                          <TableCell className="text-slate-600">{receipt.linkedPo || '-'}</TableCell>
                          <TableCell className="text-slate-600 max-w-xs truncate">{receipt.itemsReceived}</TableCell>
                          <TableCell><StatusPill status={receipt.status} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No receipts yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.receiptsTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="bills" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Vendor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Due date</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Paid</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Balance</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.billsList?.length > 0 ? (
                      data.billsList.map((bill) => (
                        <TableRow key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{bill.vendor?.name || '-'}</TableCell>
                          <TableCell className="text-slate-600">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(bill.grandTotal, currency)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{formatCurrency(bill.amountPaid || (bill.grandTotal - bill.balance), currency)}</TableCell>
                          <TableCell className="text-right text-rose-600">{formatCurrency(bill.balance, currency)}</TableCell>
                          <TableCell><StatusPill status={bill.status} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">No bills yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.billsTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="payments" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Vendor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Mode</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.vendorPaymentsList?.length > 0 ? (
                      data.vendorPaymentsList.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{payment.vendor?.name || '-'}</TableCell>
                          <TableCell className="text-slate-600">{payment.paymentMode}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(payment.amount, currency)}</TableCell>
                          <TableCell><StatusPill status={payment.status} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No payments found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.paymentsTotalCount || 0} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="returns" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Vendor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Linked receipt/bill</TableHead>
                      <TableHead className="font-semibold text-slate-700">Reason</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.returnsList?.length > 0 ? (
                      data.returnsList.map((ret) => (
                        <TableRow key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(ret.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{ret.vendor || '-'}</TableCell>
                          <TableCell className="text-slate-600">{ret.linkedSource || '-'}</TableCell>
                          <TableCell className="text-slate-600">{ret.reason || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(ret.amount, currency)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No returns found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.returnsTotalCount || 0} onPageChange={setPage} />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}
