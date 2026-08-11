import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { salesOrdersAPI, SalesOrder } from '@/lib/api/sales-orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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


  const stats = {
    total: safeOrders.length,
    fulfilled: safeOrders.filter(o => o.status === 'Fulfilled' || o.status === 'Invoiced').length,
    confirmed: safeOrders.filter(o => o.status === 'Confirmed' || o.status === 'Approved').length,
    cancelled: safeOrders.filter(o => o.status === 'Cancelled').length,
    draft: safeOrders.filter(o => o.status === 'Draft').length,
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="grid min-h-svh grid-cols-1 content-start gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-foreground">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ReceiptText className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            Sales Orders
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base font-medium">
            Manage sales orders, track fulfillment, and delivery timelines.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportLoading || filteredOrders.length === 0}
            className="h-11 px-6 rounded-xl cursor-pointer border-border bg-card hover:bg-muted text-foreground shadow-sm font-semibold flex-1 sm:flex-none"
          >
            {exportLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
            Export
          </Button>
          <Button
            onClick={() => navigate(`/dashboard/${businessId}/sales-orders/add`)}
            className="h-11 px-6 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold flex-1 sm:flex-none"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden col-span-2 lg:col-span-1">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Orders</p>
              <p className="text-2xl font-black text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hidden sm:block">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Fulfilled</p>
              <p className="text-2xl font-black text-emerald-600">{stats.fulfilled}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden sm:block">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Confirmed</p>
              <p className="text-2xl font-black text-indigo-600">{stats.confirmed}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl hidden sm:block">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Cancelled</p>
              <p className="text-2xl font-black text-rose-600">{stats.cancelled}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-muted text-muted-foreground rounded-xl hidden sm:block">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Drafts</p>
              <p className="text-2xl font-black text-muted-foreground">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-5 border-b border-border bg-muted/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Order # or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 h-10 rounded-xl bg-card border-border focus:bg-card transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 border-0 bg-background p-0 text-sm font-medium text-foreground focus:ring-0 w-[120px]">
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
        </div>

        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center">
              <ReceiptText className="h-12 w-12 text-slate-200 mb-4" />
              <p className="text-lg font-bold text-foreground">No Sales Orders Found</p>
              <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? "We couldn't find any orders matching your current filters."
                  : "You haven't created any sales orders yet. Create your first order to get started."}
              </p>
              {searchTerm || statusFilter !== 'all' ? (
                <Button variant="outline" className="rounded-xl cursor-pointer" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                  Clear Filters
                </Button>
              ) : (
                <Button className="rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(`/dashboard/${businessId}/sales-orders/add`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Order
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/80 hover:bg-muted/80">
                    <TableHead className="font-bold text-muted-foreground">Order #</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Customer</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Status</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Total</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Order Date</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Delivery Date</TableHead>
                    <TableHead className="text-right font-bold text-muted-foreground">Actions</TableHead>
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
                                  onClick={(e) => { e.stopPropagation(); handleChangeStatus(order.id, 'COMPLETED') }}
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
