import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { salesOrdersAPI, SalesOrder } from '@/lib/api/sales-orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSignature,
  FileText,
  Loader2,
  Package,
  RotateCcw,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { getCookie } from '@/lib/utils'

interface SalesOrderDetailsClientProps {
  businessId: string
  orderId: string
}

const STATUS_CONFIG: Record<string, { style: string; icon: React.ReactNode }> = {
  DRAFT: {
    style: 'bg-muted text-foreground border-border',
    icon: <Clock className="h-3 w-3" />,
  },
  Draft: {
    style: 'bg-muted text-foreground border-border',
    icon: <Clock className="h-3 w-3" />,
  },
  CONFIRMED: {
    style: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Sparkles className="h-3 w-3" />,
  },
  Confirmed: {
    style: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Sparkles className="h-3 w-3" />,
  },
  COMPLETED: {
    style: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  FULFILLED: {
    style: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  INVOICED: {
    style: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  Completed: {
    style: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELLED: {
    style: 'bg-rose-100 text-rose-700 border-rose-200',
    icon: <XCircle className="h-3 w-3" />,
  },
  Cancelled: {
    style: 'bg-rose-100 text-rose-700 border-rose-200',
    icon: <XCircle className="h-3 w-3" />,
  },
}

export function SalesOrderDetailsClient({ businessId, orderId }: SalesOrderDetailsClientProps) {
  const navigate = useNavigate()
  const [order, setOrder] = React.useState<SalesOrder | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)

  const loadOrder = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await salesOrdersAPI.getSalesOrderById(businessId, orderId)
      if (response.success) setOrder(response.order)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch sales order')
    } finally {
      setLoading(false)
    }
  }, [businessId, orderId])

  React.useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setActionLoading(true)
      await salesOrdersAPI.changeStatus(businessId, orderId, newStatus)
      toast.success(`Sales Order status updated to ${newStatus}`)
      loadOrder()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConvertToInvoice = () => {
    navigate(`/dashboard/${businessId}/invoices/add?salesOrderId=${orderId}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return <div className="p-6 text-muted-foreground">Sales order not found.</div>
  }

  const statusKey = order.status
  const statusConf = STATUS_CONFIG[statusKey] || {
    style: 'bg-muted text-foreground border-border',
    icon: <Clock className="h-3 w-3" />,
  }

  const formatCurrency = (v: number, curr?: string) => {
    const code = curr || order?.currency || 'INR'
    try {
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: (code && code.length === 3) ? code : 'INR' 
      }).format(Number(v || 0))
    } catch (e) {
      return `${code} ${Number(v || 0)}`
    }
  }

  const isDraft = ['DRAFT', 'Draft'].includes(statusKey)
  const isConfirmed = ['CONFIRMED', 'Confirmed'].includes(statusKey)
  const isCompleted = ['COMPLETED', 'Completed', 'FULFILLED', 'INVOICED'].includes(statusKey)
  const isCancelled = ['CANCELLED', 'Cancelled'].includes(statusKey)

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      {/* ── Action Header ── */}
      <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between border-b border-border bg-background/95 sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dashboard/${businessId}/sales-orders`)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{order.orderNumber}</h1>
              <Badge variant="outline" className={`flex items-center gap-1 text-xs font-semibold ${statusConf.style}`}>
                {statusConf.icon}
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sales Order for {order.customer?.company || order.customer?.name || '—'}
            </p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          {actionLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-1" />}
          {isDraft && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('CANCELLED')} disabled={actionLoading} className="text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50">
                Cancel
              </Button>
              <Button size="sm" onClick={() => handleUpdateStatus('Confirmed')} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                Confirm Order
              </Button>
            </>
          )}
          {isConfirmed && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('CANCELLED')} disabled={actionLoading} className="text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50">
                Cancel Order
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('Completed')} disabled={actionLoading} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                Complete Order
              </Button>
              <Button size="sm" onClick={handleConvertToInvoice} disabled={actionLoading} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <FileSignature className="h-4 w-4" />
                Convert to Invoice
              </Button>
            </>
          )}
          {isCompleted && (
            <Button size="sm" onClick={handleConvertToInvoice} disabled={actionLoading} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileSignature className="h-4 w-4" />
              Convert to Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ── Left Column: Summary & Items ── */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Order Details
              </CardTitle>
              <CardDescription>Line items and financial breakdown</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Items Table */}
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left font-medium text-muted-foreground uppercase text-[11px] tracking-wider">
                      <th className="p-3 w-[35%]">Item &amp; Description</th>
                      <th className="p-3 text-center">{order.items && order.items[0]?.itemType === 'SERVICE' ? 'SAC' : 'HSN'}</th>
                      <th className="p-3 text-center">{order.items && order.items[0]?.itemType === 'SERVICE' ? 'HRS' : 'QTY'}</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Tax %</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="p-3">
                          <p className="font-semibold text-foreground">{item.description}</p>
                          {item.itemType && <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">{item.itemType}</span>}
                        </td>
                        <td className="p-3 text-center font-mono text-muted-foreground">{item.hsnSacCode || '—'}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(item.price, order.currency || undefined)}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{item.taxPercent ? `${item.taxPercent}%` : '0%'}</td>
                        <td className="p-3 text-right font-mono font-semibold">{formatCurrency(item.total, order.currency || undefined)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Breakdown */}
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(order.subtotal, order.currency || undefined)}</span>
                  </div>
                  {order.tax !== undefined && order.tax !== null && order.tax > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax</span>
                      <span className="font-mono">{formatCurrency(order.tax, order.currency || undefined)}</span>
                    </div>
                  )}
                  {order.discount !== undefined && order.discount !== null && order.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount</span>
                      <span className="font-mono">-{formatCurrency(order.discount, order.currency || undefined)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-base font-bold text-foreground">
                    <span>Total Amount</span>
                    <span className="font-mono text-primary">{formatCurrency(order.totalAmount, order.currency || undefined)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Internal Notes / Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right Column: Workflow Steps & Meta ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Sales Cycle Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="relative pl-6 border-l-2 border-border space-y-5 text-sm">
                {/* Draft */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 bg-slate-200 rounded-full h-4 w-4 border-2 border-white flex items-center justify-center" />
                  <div>
                    <p className="font-semibold text-foreground">Sales Order Drafted</p>
                    <p className="text-xs text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
                {/* Confirmed */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 rounded-full h-4 w-4 border-2 border-white flex items-center justify-center ${isConfirmed || isCompleted ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  <div>
                    <p className={`font-semibold ${isConfirmed || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>Order Confirmed</p>
                    {(isConfirmed || isCompleted) && <p className="text-xs text-muted-foreground">Inventory Reserved</p>}
                  </div>
                </div>
                {/* Completed / Invoiced */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 rounded-full h-4 w-4 border-2 border-white flex items-center justify-center ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <div>
                    <p className={`font-semibold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>Billing &amp; Delivery</p>
                    {isCompleted && <p className="text-xs text-muted-foreground">Order completed successfully</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-semibold text-right">{order.customer?.company || order.customer?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
              </div>
              {order.deliveryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Delivery:</span>
                  <span className="text-blue-600 font-semibold">{new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {order.quotation && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source Quotation:</span>
                  <span className="text-primary font-medium">{(order.quotation as any).quoteNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
