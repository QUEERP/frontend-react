import { exportPurchaseOrderToPDF } from '@/lib/utils/purchase-order-pdf';
import { FileDown } from 'lucide-react';
import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { purchaseOrdersAPI, PurchaseOrder } from '@/lib/api/purchase-orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  Loader2, 
  MoreVertical, 
  Pencil, 
  Plus, 
  ReceiptText, 
  Trash2, 
  Download,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

interface PurchaseOrdersPageClientProps {
  businessId: string
}

export function PurchaseOrdersPageClient({ businessId }: PurchaseOrdersPageClientProps) {
  const { business, currency: defaultCurrency, currencySymbol: defaultSymbol } = useBusinessData()
  const navigate = useNavigate()
  const [orders, setOrders] = React.useState<PurchaseOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await purchaseOrdersAPI.getPurchaseOrders(businessId)
      if (response.success) setOrders(response.orders || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch purchase orders')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleMarkReceived = async (order: any) => {
    try {
      await purchaseOrdersAPI.markReceived(businessId as string, order.id);
      toast.success('Order marked as received. GRN and Bill generated.');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as received');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      const response = await purchaseOrdersAPI.deletePurchaseOrder(businessId, orderId)
      if (response.success) {
        toast.success('Purchase order deleted successfully')
        fetchOrders()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete purchase order')
    }
  }

  const formatCurrency = (value: number, currencyCode?: string, currencySymbol?: string) => {
    try {
      const code = currencyCode || defaultCurrency || 'INR'
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(value)
    } catch {
      return `${currencySymbol || defaultSymbol || '₹'}${value.toLocaleString()}`
    }
  }

  const downloadReport = () => {
    if (orders.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['PO #', 'Vendor', 'Status', 'Subtotal', 'Tax', 'Discount', 'Total Amount', 'Order Date', 'Expected Delivery', 'Created At']
    const csvContent = [
      headers.join(','),
      ...orders.map(order => [
        `"${order.poNumber}"`,
        `"${order.vendor?.name || ''}"`,
        `"${order.status}"`,
        order.subtotal,
        order.tax || 0,
        order.discount || 0,
        order.totalAmount,
        new Date(order.orderDate).toLocaleDateString(),
        order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '',
        new Date(order.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `PurchaseOrders_Report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Report downloaded successfully')
  }

  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => 
      (order.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.vendor?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [orders, searchTerm])

  const stats = React.useMemo(() => {
    const pending = orders.filter(o => ['PENDING', 'DRAFT', 'ISSUED'].includes((o.status || '').toUpperCase())).length;
    const completed = orders.filter(o => ['COMPLETED', 'RECEIVED'].includes((o.status || '').toUpperCase())).length;
    const totalAmount = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    return { pending, completed, totalAmount };
  }, [orders])

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase()
    if (['COMPLETED', 'RECEIVED'].includes(s)) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
    if (['PENDING', 'DRAFT'].includes(s)) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
    if (['ISSUED', 'APPROVED'].includes(s)) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
    if (['CANCELLED', 'REJECTED'].includes(s)) return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
    return 'bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background dark:bg-[#121418]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="text-sm font-medium text-muted-foreground dark:text-slate-400">Loading purchase orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Purchase Orders
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Manage vendor purchase orders and delivery timelines.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={downloadReport} 
            className="h-10 rounded-xl border-border text-foreground hover:bg-muted font-semibold gap-2 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button 
            onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/add`)} 
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Orders
                </p>
                <div className="text-2xl font-black text-foreground">
                  {orders.length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">All-time purchase orders</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Completed
                </p>
                <div className="text-2xl font-black text-foreground">
                  {stats.completed}
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Orders fully received</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Pending
                </p>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-500">
                  {stats.pending}
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-500">Awaiting delivery</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Value
                </p>
                <div className="text-2xl font-black text-foreground truncate max-w-[170px]" title={formatCurrency(stats.totalAmount)}>
                  {formatCurrency(stats.totalAmount)}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Value of all POs</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col w-full min-w-0 max-w-full">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filteredOrders.length}</span> of {orders.length} total orders
              </CardDescription>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by PO # or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm"
              />
            </div>
          </div>
        </CardHeader>
        
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          <Table className="w-full min-w-[950px]">
            <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">PO #</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Vendor</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Expected Delivery</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <ReceiptText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground">No purchase orders found</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {searchTerm ? "We couldn't find any orders matching your search." : "You haven't created any purchase orders yet."}
                      </p>
                      {searchTerm && (
                        <Button
                          variant="outline"
                          onClick={() => setSearchTerm('')}
                          className="mt-4 rounded-xl border-border"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-muted/50 border-b border-border transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="font-bold text-sm text-blue-700 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/${order.id}`)}>
                        {order.poNumber}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-semibold text-foreground text-sm">{order.vendor?.name || '—'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-foreground text-sm">
                        {formatCurrency(order.totalAmount, order.currencyCode, order.currencySymbol)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cn("text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border", getStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span>{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '—'}</span>
                        {order.status !== 'FULLY_RECEIVED' && order.status !== 'CANCELLED' && order.status !== 'RECEIVED' && order.status !== 'COMPLETED' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            onClick={(e) => { e.stopPropagation(); handleMarkReceived(order) }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Received Order
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border bg-card">
                          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer font-medium text-foreground py-2.5" onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/${order.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-medium text-foreground py-2.5" onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/${order.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-medium text-blue-600 dark:text-blue-400 py-2.5" onClick={() => exportPurchaseOrderToPDF(order, business)}>
                            <FileDown className="mr-2 h-4 w-4" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer font-medium text-rose-600 dark:text-rose-400 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-500/10 py-2.5" onClick={() => handleDelete(order.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filteredOrders.length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} total orders
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
