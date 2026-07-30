import * as React from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PurchaseOrderForm } from '@/components/dashboard/purchase-order-form'
import { purchaseOrdersAPI, UpdatePurchaseOrderData } from '@/lib/api/purchase-orders'

export default function EditPurchaseOrderPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const navigate = useNavigate()
  const params = useParams()
  
  const { id } = useParams();
const orderId = id as string

  const [initialData, setInitialData] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await purchaseOrdersAPI.getPurchaseOrderById(businessId, orderId)
        if (response.success) {
          const order = response.order
          setInitialData({
            vendorId: order.vendorId,
            assignedToId: order.assignedToId || '',
            tax: order.tax || 0,
            discount: order.discount || 0,
            orderDate: order.orderDate ? order.orderDate.split('T')[0] : '',
            expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.split('T')[0] : '',
            notes: order.notes || '',
            status: order.status,
          })
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load purchase order')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [businessId, orderId])

  const handleSubmit = async (data: UpdatePurchaseOrderData) => {
    const response = await purchaseOrdersAPI.updatePurchaseOrder(businessId, orderId, data)
    if (response.success) {
      toast.success('Purchase order updated successfully')
      navigate(`/dashboard/${businessId}/purchase-orders/${orderId}`)
    }
  }

  if (loading || !initialData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/${orderId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Order
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Purchase Order</h1>
          <p className="text-muted-foreground">Update purchase order details</p>
        </div>
      </div>

      <PurchaseOrderForm
        businessId={businessId as string}
        title="Update Purchase Order"
        description="Update fields supported by backend update endpoint."
        submitLabel="Save Changes"
        initialData={initialData}
        mode="edit"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
