import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { purchaseOrdersAPI, PurchaseOrder } from '@/lib/api/purchase-orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PurchaseOrderDetailsClientProps {
  businessId: string
  orderId: string
}

export function PurchaseOrderDetailsClient({ businessId, orderId }: PurchaseOrderDetailsClientProps) {
  const navigate = useNavigate()
  const [order, setOrder] = React.useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await purchaseOrdersAPI.getPurchaseOrderById(businessId, orderId)
        if (response.success) setOrder(response.order)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch purchase order')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [businessId, orderId])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return <div className="p-6 text-muted-foreground">Purchase order not found.</div>
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${businessId}/purchase-orders`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Orders
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{order.poNumber}</h1>
          <p className="text-muted-foreground">Purchase order details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order Summary</span>
            <Badge>{order.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>Vendor: {order.vendor?.name || '—'}</div>
          <div>Assigned To: {order.assignedTo?.user?.name || 'Unassigned'}</div>
          <div>Order Date: {new Date(order.orderDate).toLocaleDateString()}</div>
          <div>
            Expected Delivery: {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '—'}
          </div>
          <div>
            Total: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}
          </div>
          <div>Notes: {order.notes || '—'}</div>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-2">Item</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="p-2">{(item as any).name}</td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">{item.price}</td>
                    <td className="p-2">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
