import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { purchaseOrdersAPI, PurchaseOrder } from '@/lib/api/purchase-orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const { currency: defaultCurrency, currencySymbol: defaultSymbol } = useBusinessData()
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
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-[#121418] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-[#181a20] p-6 rounded-2xl border border-border dark:border-[#23272c] shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hidden sm:flex items-center justify-center">
            <ReceiptText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Purchase Orders</h1>
            <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">
              Manage vendor purchase orders and delivery timelines.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={downloadReport} 
            className="flex-1 sm:flex-none h-10 rounded-xl border-border dark:border-[#23272c] text-muted-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-[#1c2128] gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline font-semibold">Export</span>
          </Button>
          <Button 
            onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/add`)} 
            className="flex-1 sm:flex-none h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="font-semibold">New Order</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Total Orders</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{orders.length}</div>
            <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-1">All-time purchase orders</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Completed</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{stats.completed}</div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">Orders fully received</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Pending</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{stats.pending}</div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-500 mt-1">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Total Value</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-1">Value of all POs</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="p-6 border-b border-border dark:border-[#23272c] bg-muted/50 dark:bg-[#181a20] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by PO # or Vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl border-border dark:border-[#23272c] bg-card dark:bg-[#121418] w-full focus-visible:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="p-0 border-t-0 flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/80 dark:bg-[#121418]/80 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-background border-b border-border dark:border-[#23272c]">
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">PO #</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Vendor</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Amount</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Order Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Expected Delivery</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted dark:bg-[#121418] flex items-center justify-center mb-2">
                        <ReceiptText className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground dark:text-slate-200">No purchase orders found</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 max-w-sm mx-auto">
                        {searchTerm ? 'We couldn\'t find any orders matching your search.' : 'You haven\'t created any purchase orders yet.'}
                      </p>
                      {searchTerm && (
                        <Button
                          variant="outline"
                          onClick={() => setSearchTerm('')}
                          className="mt-4 rounded-xl border-border dark:border-[#23272c]"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-muted/50 dark:hover:bg-[#1c2128]/50 border-b border-border dark:border-[#23272c] transition-colors">
                    <TableCell className="py-4">
                      <div className="font-bold text-sm text-blue-700 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/${order.id}`)}>
                        {order.poNumber}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-semibold text-foreground dark:text-slate-200 text-sm">{order.vendor?.name || '—'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-foreground dark:text-slate-200 text-sm">
                        {formatCurrency(order.totalAmount, order.currencyCode, order.currencySymbol)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cn("text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border", getStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                      {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer text-slate-400 hover:text-foreground hover:bg-muted dark:hover:bg-[#23272c] dark:hover:text-slate-200">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border dark:border-[#23272c] dark:bg-[#181a20]">
                          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer font-medium text-foreground dark:text-slate-300 py-2.5" onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/${order.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-medium text-foreground dark:text-slate-300 py-2.5" onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/${order.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="dark:bg-[#23272c]" />
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
      </Card>
    </div>
  )
}
