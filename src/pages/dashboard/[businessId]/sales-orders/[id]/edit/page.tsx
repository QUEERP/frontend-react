import * as React from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { ArrowLeft, Loader2, ReceiptText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SalesOrderForm } from '@/components/dashboard/sales-order-form'
import { salesOrdersAPI, UpdateSalesOrderData } from '@/lib/api/sales-orders'

export default function EditSalesOrderPage() {
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
        const response = await salesOrdersAPI.getSalesOrderById(businessId, orderId)
        if (response.success) {
          const order = response.order
          setInitialData({
            customerId: order.customerId,
            quotationId: order.quotationId || '',
            dealId: order.dealId || '',
            assignedToId: order.assignedToId || '',
            tax: order.tax || 0,
            discount: order.discount || 0,
            shippingCharges: order.shippingCharges || 0,
            orderDate: order.orderDate ? order.orderDate.split('T')[0] : '',
            deliveryDate: order.deliveryDate ? order.deliveryDate.split('T')[0] : '',
            notes: order.notes || '',
            termsConditions: order.termsConditions || '',
            status: order.status,
            currency: order.currency || '',
            customerReference: order.customerReference || '',
            shippingMethod: order.shippingMethod || '',
            paymentTerms: order.paymentTerms || '',
            deliveryInstructions: order.deliveryInstructions || '',
            placeOfSupply: order.placeOfSupply || '',
            cgst: order.cgst || 0,
            sgst: order.sgst || 0,
            igst: order.igst || 0,
            tds: order.tds || 0,
            ewayBillNo: order.ewayBillNo || '',
            reverseCharge: order.reverseCharge || false,
            transportDetails: order.transportDetails || '',
            vatPercentage: order.vatPercentage || 0,
            vatAmount: order.vatAmount || 0,
            vatType: order.vatType || 'exclusive',
            emirate: order.emirate || '',
            items: order.items?.map((i: any) => ({
              productId: i.productId || '',
              warehouseId: i.warehouseId || '',
              description: i.description || '',
              itemType: i.itemType || 'GOODS',
              hsnSacCode: i.hsnSacCode || '',
              quantity: i.quantity || 1,
              price: i.price || 0,
              taxPercent: i.taxPercent || 0,
              cgstPercent: i.cgstPercent || 0,
              sgstPercent: i.sgstPercent || 0,
              igstPercent: i.igstPercent || 0,
              unit: i.unit || 'pcs',
            })) || [],
          })
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load sales order')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [businessId, orderId])

  const handleSubmit = async (data: UpdateSalesOrderData) => {
    const response = await salesOrdersAPI.updateSalesOrder(businessId, orderId, data)
    if (response.success) {
      toast.success('Sales order updated successfully')
      navigate(`/dashboard/${businessId}/sales-orders/${orderId}`)
    }
  }

  if (loading || !initialData) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-[#f8fafc] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`/dashboard/${businessId}/sales-orders/${orderId}`)}
          className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-600 shrink-0 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
            <ReceiptText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Sales Order</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Update order details, line items, and fulfillment terms.</p>
          </div>
        </div>
      </div>

      <SalesOrderForm
        businessId={businessId}
        title="Update Sales Order"
        description="Modify fields supported by the backend update endpoint."
        submitLabel="Save Changes"
        initialData={initialData}
        mode="edit"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
