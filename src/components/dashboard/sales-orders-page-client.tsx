import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { salesOrdersAPI, SalesOrder } from '@/lib/api/sales-orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileDown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToExcel } from '@/lib/export-utils'

interface SalesOrdersPageClientProps {
  businessId: string
}

const STATUS_STYLE: Record<string, string> = {
  Draft: 'bg-muted text-foreground border-border',
  Confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  Approved: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Partially Fulfilled': 'bg-amber-100 text-amber-800 border-amber-200',
  Fulfilled: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Invoiced: 'bg-purple-100 text-purple-800 border-purple-200',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
}

export function SalesOrdersPageClient({ businessId }: SalesOrdersPageClientProps) {
  const navigate = useNavigate()
  const [orders, setOrders] = React.useState<SalesOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [exportLoading, setExportLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await salesOrdersAPI.getSalesOrders(businessId)
      if (response.success) setOrders(response.orders || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch sales orders')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleDelete = async (orderId: string) => {
    try {
      const response = await salesOrdersAPI.deleteSalesOrder(businessId, orderId)
      if (response.success) {
        toast.success('Sales order deleted successfully')
        fetchOrders()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete sales order')
    }
  }

  const handleChangeStatus = async (orderId: string, status: string) => {
    try {
      const response = await salesOrdersAPI.changeStatus(businessId, orderId, status)
      if (response.success) {
        toast.success(`Sales order marked as ${status}`)
        fetchOrders()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    }
  }

  const formatCurrency = (value: number, currencyCode: string = 'INR') => {
    try {
      return new Intl.NumberFormat(currencyCode === 'INR' ? 'en-IN' : 'en-US', { 
        style: 'currency', 
        currency: (currencyCode && currencyCode.length === 3) ? currencyCode : 'INR' 
      }).format(value)
    } catch (e) {
      return `${currencyCode || 'INR'} ${value}`
    }
  }

  const safeOrders = Array.isArray(orders) ? orders : []
  
  const filteredOrders = safeOrders.filter(o => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      (o.orderNumber && o.orderNumber.toLowerCase().includes(searchLower)) ||
      (o.customer?.company && o.customer.company.toLowerCase().includes(searchLower)) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(searchLower)) ||
      (o.customer?.email && o.customer.email.toLowerCase().includes(searchLower))

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleExport = () => {
    try {
      setExportLoading(true)
      const exportData = filteredOrders.map((o) => ({
        'Order Number': o.orderNumber,
        'Customer': o.customer?.company || o.customer?.name || o.customer?.email || '',
        'Status': o.status,
        'Total Amount': o.totalAmount,
        'Order Date': o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '—',
        'Delivery Date': o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : '—'
      }))

      exportToExcel(exportData, `SalesOrders_Report_${new Date().toISOString().split('T')[0]}`, 'SalesOrders')
      toast.success('Sales order report downloaded')
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)

  const handleDownloadPdf = async (e: React.MouseEvent, order: SalesOrder) => {
    e.stopPropagation()
    try {
      setDownloadingId(order.id)
      await salesOrdersAPI.downloadSalesOrderPdf(businessId, order.id, order.orderNumber)
      toast.success('Sales Order PDF downloaded successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to download PDF')
    } finally {
      setDownloadingId(null)
    }
  }


  const stats = {
    total: safeOrders.length,
    fulfilled: safeOrders.filter(o => ['FULFILLED', 'Fulfilled', 'COMPLETED', 'Completed', 'INVOICED', 'Invoiced'].includes(o.status)).length,
    confirmed: safeOrders.filter(o => ['CONFIRMED', 'Confirmed', 'APPROVED', 'Approved'].includes(o.status)).length,
    cancelled: safeOrders.filter(o => ['CANCELLED', 'Cancelled'].includes(o.status)).length,
    draft: safeOrders.filter(o => ['DRAFT', 'Draft'].includes(o.status)).length,
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Clean Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage sales orders, track fulfillment, and delivery timelines</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportLoading || filteredOrders.length === 0}
            className="h-10 gap-2 bg-card hover:bg-muted text-foreground border-border shadow-sm rounded-xl font-medium px-4 cursor-pointer"
          >
            {exportLoading ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <FileDown className="h-4 w-4" />}
            Export CSV
          </Button>
          <Button
            onClick={() => navigate(`/dashboard/${businessId}/sales-orders/add`)}
            className="h-10 cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl border-none font-medium px-5"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Orders', value: stats.total, icon: ReceiptText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' },
          { label: 'Fulfilled', value: stats.fulfilled, icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' },
          { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800' },
          { label: 'Drafts', value: stats.draft, icon: Clock, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-700' },
        ].map(stat => (
          <Card key={stat.label} className="border-border bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl border ${stat.bg} ${stat.color} shadow-sm`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Directory Card */}
      <Card className="w-full min-w-0 max-w-full rounded-2xl border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Orders Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filteredOrders.length}</span> of {safeOrders.length} orders
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search order #, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 rounded-xl border-border bg-card focus-visible:ring-blue-500 h-10 text-sm shadow-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-10 rounded-xl border-border bg-card font-medium text-foreground text-sm cursor-pointer shadow-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="all" className="cursor-pointer rounded-lg">All Statuses</SelectItem>
                  <SelectItem value="Draft" className="cursor-pointer rounded-lg">Draft</SelectItem>
                  <SelectItem value="Confirmed" className="cursor-pointer rounded-lg">Confirmed</SelectItem>
                  <SelectItem value="Approved" className="cursor-pointer rounded-lg">Approved</SelectItem>
                  <SelectItem value="Partially Fulfilled" className="cursor-pointer rounded-lg">Partially Fulfilled</SelectItem>
                  <SelectItem value="Fulfilled" className="cursor-pointer rounded-lg">Fulfilled</SelectItem>
                  <SelectItem value="Invoiced" className="cursor-pointer rounded-lg">Invoiced</SelectItem>
                  <SelectItem value="Cancelled" className="cursor-pointer rounded-lg">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center">
              <ReceiptText className="h-12 w-12 text-slate-400 mb-4" />
              <p className="text-lg font-semibold text-foreground">No Sales Orders Found</p>
              <p className="text-muted-foreground max-w-sm mt-1 mb-6 text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? "We couldn't find any orders matching your current filters."
                  : "You haven't created any sales orders yet. Create your first order to get started."}
              </p>
              {searchTerm || statusFilter !== 'all' ? (
                <Button variant="outline" className="rounded-xl font-medium cursor-pointer" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                  Clear Filters
                </Button>
              ) : (
                <Button className="rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium" onClick={() => navigate(`/dashboard/${businessId}/sales-orders/add`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Order
                </Button>
              )}
            </div>
          ) : (
            <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
              <Table className="w-full min-w-[850px]">
                <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                    <TableHead className="pl-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order #</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order Date</TableHead>
                    <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Delivery Date</TableHead>
                    <TableHead className="pr-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const badgeStyle = STATUS_STYLE[order.status] || STATUS_STYLE['Draft']
                    
                    return (
                      <TableRow key={order.id} className="border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/sales-orders/${order.id}`)}>
                        <TableCell className="font-bold text-foreground">{order.orderNumber}</TableCell>
                        <TableCell className="font-medium text-muted-foreground">
                          {order.customer?.company || order.customer?.name || order.customer?.email || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-semibold border ${badgeStyle}`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-foreground">
                          {formatCurrency(order.totalAmount, (order as any).currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium">
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium">
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {['DRAFT', 'Draft'].includes(order.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleChangeStatus(order.id, 'CONFIRMED') }}
                                className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Confirm Order
                              </Button>
                            )}
                            {['CONFIRMED', 'Confirmed'].includes(order.status) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); handleChangeStatus(order.id, 'FULFILLED') }}
                                  className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                >
                                  <PackageCheck className="mr-1 h-3.5 w-3.5" />
                                  Complete Order
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    navigate(`/dashboard/${businessId}/invoices/add?salesOrderId=${order.id}`)
                                  }}
                                  className="h-8 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                                >
                                  <ReceiptText className="mr-1 h-3.5 w-3.5" />
                                  Convert to Invoice
                                </Button>
                              </>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-border shadow-md">
                              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/sales-orders/${order.id}`); }}>
                                <ReceiptText className="mr-2 h-4 w-4 text-muted-foreground" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/sales-orders/${order.id}/edit`); }}>
                                <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                                Edit Order
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={(e) => handleDownloadPdf(e, order)}>
                                {downloadingId === order.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <FileDown className="mr-2 h-4 w-4 text-muted-foreground" />
                                )}
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer rounded-lg text-rose-600 focus:text-rose-700 focus:bg-rose-50" onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
