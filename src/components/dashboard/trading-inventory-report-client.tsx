import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { inventoryReportsAPI, TradingInventoryReportData } from '@/lib/api/inventory'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Package, Layers, Tags, Ruler, Warehouse, BarChart3, Repeat, SlidersHorizontal, History, AlertTriangle, Download, FileText } from 'lucide-react'
import { DateRangePicker } from './shared/date-range-picker'
import { ServerPagination } from '@/components/ui/server-pagination'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils/currency'
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { KpiCard } from './shared/kpi-card'
import { StatusPill } from './shared/status-pill'
import { TabPills } from './shared/tab-pills'
import { LifecycleFunnel } from './shared/lifecycle-funnel'
import { exportReportToExcel, exportReportToPDF, exportAllReportToExcel, exportAllReportToPDF, ExportTabConfig } from '@/lib/utils/report-exports'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

const INVENTORY_REPORT_TABS = [
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'brands', label: 'Brands' },
  { value: 'units', label: 'Units' },
  { value: 'warehouses', label: 'Warehouses' },
  { value: 'stockOverview', label: 'Stock Overview' },
  { value: 'transfers', label: 'Transfers' },
  { value: 'adjustments', label: 'Adjustments' },
  { value: 'movementHistory', label: 'Movement History' },
  { value: 'reorderAlerts', label: 'Reorder Alerts' }
];

export function TradingInventoryReportClient() {
  const { businessId } = useParams()
  const { currency } = useBusinessData()
  
  const [data, setData] = useState<TradingInventoryReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('products')
  const [page, setPage] = useState(1)
  const tabCache = useRef<Record<string, any>>({})
  const pageSize = 25
  const [dateRange, setDateRange] = useState('this_month')
  const [customDate, setCustomDate] = useState<DateRange | undefined>()

  const handleCustomDateChange = (date: DateRange | undefined) => {
    setCustomDate(date)
    if (date?.from && date?.to) {
      setDateRange(`${format(date.from, 'yyyy-MM-dd')},${format(date.to, 'yyyy-MM-dd')}`)
    } else {
      setDateRange('custom')
    }
  }

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
    
    inventoryReportsAPI.getTradingInventoryReport(businessId, dateRange)
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
      case 'products':
        return {
          title: 'Products Report',
          fileName: 'Products_Report.xlsx',
          columns: [
            { header: 'Product Name', key: 'name' },
            { header: 'SKU', key: 'sku' },
            { header: 'Category', key: 'category' },
            { header: 'Brand', key: 'brand' },
            { header: 'Unit', key: 'unit' },
            { header: 'Current Stock', key: 'currentStock' },
            { header: 'Reorder Level', key: 'reorderLevel' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.productsList || []
        };
      case 'categories':
        return {
          title: 'Categories Report',
          fileName: 'Categories_Report.xlsx',
          columns: [
            { header: 'Category Name', key: 'name' },
            { header: 'Product Count', key: 'productCount' },
            { header: 'Total Stock Value', key: 'totalStockValue' }
          ],
          dataMapper: (d) => d?.categoriesList || []
        };
      case 'brands':
        return {
          title: 'Brands Report',
          fileName: 'Brands_Report.xlsx',
          columns: [
            { header: 'Brand Name', key: 'name' },
            { header: 'Product Count', key: 'productCount' },
            { header: 'Total Stock Value', key: 'totalStockValue' }
          ],
          dataMapper: (d) => d?.brandsList || []
        };
      case 'units':
        return {
          title: 'Units Report',
          fileName: 'Units_Report.xlsx',
          columns: [
            { header: 'Unit Name', key: 'name' },
            { header: 'Abbreviation', key: 'abbreviation' },
            { header: 'Products Using', key: 'productsUsingIt' }
          ],
          dataMapper: (d) => d?.unitsList || []
        };
      case 'warehouses':
        return {
          title: 'Warehouses Report',
          fileName: 'Warehouses_Report.xlsx',
          columns: [
            { header: 'Warehouse Name', key: 'name' },
            { header: 'Products Stored', key: 'productsStored' },
            { header: 'Total Value', key: 'totalValue' },
            { header: 'Utilization', key: 'utilization' }
          ],
          dataMapper: (d) => d?.warehousesList || []
        };
      case 'stockOverview':
        return {
          title: 'Stock Overview Report',
          fileName: 'Stock_Overview_Report.xlsx',
          columns: [
            { header: 'Product Name', key: 'productName' },
            { header: 'Warehouse', key: 'warehouseName' },
            { header: 'Quantity On Hand', key: 'quantityOnHand' },
            { header: 'Value', key: 'value' }
          ],
          dataMapper: (d) => d?.stockOverviewList || []
        };
      case 'transfers':
        return {
          title: 'Transfers Report',
          fileName: 'Transfers_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Product', key: 'productName' },
            { header: 'From Warehouse', key: 'fromWarehouse' },
            { header: 'To Warehouse', key: 'toWarehouse' },
            { header: 'Quantity', key: 'quantity' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.transfersList?.map((t: any) => ({
            ...t,
            date: new Date(t.date).toLocaleDateString()
          })) || []
        };
      case 'adjustments':
        return {
          title: 'Adjustments Report',
          fileName: 'Adjustments_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Product', key: 'productName' },
            { header: 'Warehouse', key: 'warehouse' },
            { header: 'Quantity Change', key: 'quantityChange' },
            { header: 'Reason', key: 'reason' },
            { header: 'Performed By', key: 'performedBy' }
          ],
          dataMapper: (d) => d?.adjustmentsList?.map((a: any) => ({
            ...a,
            date: new Date(a.date).toLocaleDateString()
          })) || []
        };
      case 'movementHistory':
        return {
          title: 'Movement History Report',
          fileName: 'Movement_History_Report.xlsx',
          columns: [
            { header: 'Date', key: 'date' },
            { header: 'Type', key: 'type' },
            { header: 'Product', key: 'productName' },
            { header: 'Warehouse', key: 'warehouse' },
            { header: 'Quantity', key: 'quantity' },
            { header: 'Performed By', key: 'performedBy' }
          ],
          dataMapper: (d) => d?.movementHistoryList?.map((m: any) => ({
            ...m,
            date: new Date(m.date).toLocaleDateString()
          })) || []
        };
      case 'reorderAlerts':
        return {
          title: 'Reorder Alerts Report',
          fileName: 'Reorder_Alerts_Report.xlsx',
          columns: [
            { header: 'Product', key: 'name' },
            { header: 'SKU', key: 'sku' },
            { header: 'Current Stock', key: 'currentStock' },
            { header: 'Reorder Level', key: 'reorderLevel' },
            { header: 'Shortfall', key: 'shortfall' },
            { header: 'Status', key: 'status' }
          ],
          dataMapper: (d) => d?.reorderAlertsList || []
        };
      default:
        return null;
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  const getExportConfig = () => getTabExportConfig(activeTab);
  
  const getAllExportConfigs = (): ExportTabConfig[] => {
    return INVENTORY_REPORT_TABS.map(tab => getTabExportConfig(tab.value)).filter(Boolean) as ExportTabConfig[];
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load inventory report: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Inventory Report</h1>
            <p className="text-muted-foreground text-sm font-medium">Comprehensive breakdown of your inventory metrics and movements.</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <DateRangePicker date={customDate} onDateChange={handleCustomDateChange} />
            <Button variant="outline" size="sm" onClick={() => {
              const configs = getAllExportConfigs();
              exportAllReportToPDF(configs, data, 'Inventory_Report_All.pdf');
            }} className="ml-2 gap-2 text-red-600 hover:text-red-700">
              <FileText className="size-4" />
              Export All PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const configs = getAllExportConfigs();
              exportAllReportToExcel(configs, data, 'Inventory_Report_All.xlsx');
            }} className="ml-2 gap-2 text-emerald-600 hover:text-emerald-700">
              <Download className="size-4" />
              Export All Excel
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Products"
          value={data.kpis.totalProducts.toString()}
          subtext="Active products"
          icon={Package}
          colorClass="border-l-blue-500"
          bgClass="bg-blue-50"
          textClass="text-blue-500"
        />
        <KpiCard
          title="Total Stock Value"
          value={formatCurrency(data.kpis.totalStockValue, currency)}
          subtext="Value on hand"
          icon={BarChart3}
          colorClass="border-l-indigo-500"
          bgClass="bg-indigo-50"
          textClass="text-indigo-500"
        />
        <KpiCard
          title="Active Warehouses"
          value={data.kpis.activeWarehouses.toString()}
          subtext="Monitored locations"
          icon={Warehouse}
          colorClass="border-l-emerald-500"
          bgClass="bg-emerald-50"
          textClass="text-emerald-500"
        />
        <KpiCard
          title="Stock Movements"
          value={data.kpis.stockMovementsCount.toString()}
          subtext="Transactions this period"
          icon={History}
          colorClass="border-l-amber-500"
          bgClass="bg-amber-50"
          textClass="text-amber-500"
        />
      </div>

      {/* Funnel */}
      <LifecycleFunnel
        title="Inventory Lifecycle"
        stages={[
          { 
            name: "Stock In", 
            count: data.funnel.receipts.count, 
            value: `${data.funnel.receipts.quantity} Qty`
          },
          { 
            name: "Transfers", 
            count: data.funnel.transfers.count, 
            value: `${data.funnel.transfers.quantity} Qty`
          },
          { 
            name: "Adjustments", 
            count: data.funnel.adjustments.count, 
            value: `${data.funnel.adjustments.quantity} Qty`
          },
          { 
            name: "Stock Out", 
            count: data.funnel.stockOut.count, 
            value: `${data.funnel.stockOut.quantity} Qty`
          }
        ]}
        branches={[
          {
            name: "Reorder Alerts",
            count: data.kpis.lowStockCount,
            value: "0 Alerts",
            note: "Products below reorder level"
          }
        ]}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabPills tabs={INVENTORY_REPORT_TABS} />
          
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
        
        {/* PRODUCTS */}
        <TabsContent value="products" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.productsList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No products found — add products to see them here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.productsList || []).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.sku}</div>
                        </TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell>{p.brand}</TableCell>
                        <TableCell>{p.unit}</TableCell>
                        <TableCell className="text-right font-medium">{p.currentStock}</TableCell>
                        <TableCell className="text-right">{p.reorderLevel}</TableCell>
                        <TableCell>
                          <StatusPill status={p.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.productsTotalCount || 0} onPageChange={setPage} />
          </Card>
        </TabsContent>

        {/* CATEGORIES */}
        <TabsContent value="categories" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="text-right">Product Count</TableHead>
                    <TableHead className="text-right">Total Stock Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.categoriesList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.categoriesList || []).map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right">{c.productCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(c.totalStockValue, currency)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.categoriesTotalCount || 0} onPageChange={setPage} />
          </Card>
        </TabsContent>

        {/* BRANDS */}
        <TabsContent value="brands" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Brand Name</TableHead>
                    <TableHead className="text-right">Product Count</TableHead>
                    <TableHead className="text-right">Total Stock Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.brandsList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No brands found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.brandsList || []).map((b, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="text-right">{b.productCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(b.totalStockValue, currency)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.brandsTotalCount || 0} onPageChange={setPage} />
          </Card>
        </TabsContent>

        {/* UNITS */}
        <TabsContent value="units" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Unit Name</TableHead>
                    <TableHead>Abbreviation</TableHead>
                    <TableHead className="text-right">Products Using</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.unitsList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No units found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.unitsList || []).map((u, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.abbreviation}</TableCell>
                        <TableCell className="text-right">{u.productsUsingIt}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.unitsTotalCount || 0} onPageChange={setPage} />
          </Card>
        </TabsContent>

        {/* WAREHOUSES */}
        <TabsContent value="warehouses" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Warehouse Name</TableHead>
                    <TableHead className="text-right">Products Stored</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">Utilization %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.warehousesList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No warehouses configured.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.warehousesList || []).map((w, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell className="text-right">{w.productsStored}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(w.totalValue, currency)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{w.utilization}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.warehousesTotalCount || 0} onPageChange={setPage} />
          </Card>
        </TabsContent>

        {/* STOCK OVERVIEW */}
        <TabsContent value="stockOverview" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Quantity On Hand</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.stockOverviewList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No stock records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.stockOverviewList || []).map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{s.productName}</TableCell>
                        <TableCell>{s.warehouseName}</TableCell>
                        <TableCell className="text-right font-medium">{s.quantityOnHand}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(s.value, currency)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TRANSFERS */}
        <TabsContent value="transfers" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.transfersList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No transfers yet — move stock between warehouses to see them here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.transfersList || []).map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {new Date(t.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">{t.productName}</TableCell>
                        <TableCell>{t.fromWarehouse}</TableCell>
                        <TableCell>{t.toWarehouse}</TableCell>
                        <TableCell className="text-right font-medium">{t.quantity}</TableCell>
                        <TableCell>
                          <StatusPill status={t.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.transfersTotalCount || 0} onPageChange={setPage} />
          </Card>
        </TabsContent>

        {/* ADJUSTMENTS */}
        <TabsContent value="adjustments" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Quantity Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.adjustmentsList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No stock adjustments found for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.adjustmentsList || []).map((a, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {new Date(a.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">{a.productName}</TableCell>
                        <TableCell>{a.warehouse}</TableCell>
                        <TableCell className={`text-right font-medium ${a.quantityChange.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {a.quantityChange}
                        </TableCell>
                        <TableCell>{a.reason}</TableCell>
                        <TableCell className="text-muted-foreground">{a.performedBy}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
              <ServerPagination page={page} pageSize={pageSize} totalCount={data.adjustmentsTotalCount || 0} onPageChange={setPage} />
          </Card>
        </TabsContent>

        {/* MOVEMENT HISTORY */}
        <TabsContent value="movementHistory" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.movementHistoryList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No stock movements found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.movementHistoryList || []).map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {new Date(m.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-full">
                            {m.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{m.productName}</TableCell>
                        <TableCell>{m.warehouse}</TableCell>
                        <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{m.performedBy}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* REORDER ALERTS */}
        <TabsContent value="reorderAlerts" className="m-0">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead className="text-right">Shortfall</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.reorderAlertsList?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No active reorder alerts! Stock levels are healthy.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data.reorderAlertsList || []).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.sku}</TableCell>
                        <TableCell className="text-right font-medium text-rose-600">{r.currentStock}</TableCell>
                        <TableCell className="text-right">{r.reorderLevel}</TableCell>
                        <TableCell className="text-right font-medium">{r.shortfall}</TableCell>
                        <TableCell>
                          <StatusPill status={r.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
