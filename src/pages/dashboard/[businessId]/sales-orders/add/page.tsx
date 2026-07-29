import React, { useEffect, useState } from 'react'
import {  useParams, useNavigate, useSearchParams  } from 'react-router-dom';
import { ArrowLeft, Loader2, ReceiptText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SalesOrderForm } from '@/components/dashboard/sales-order-form'
import { salesOrdersAPI } from '@/lib/api/sales-orders'
import { quotationsAPI } from '@/lib/api/quotations'

export default function AddSalesOrderPage() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  
  const quotationId = searchParams.get('quotationId')
  const dealId = searchParams.get('dealId')

  const [initialData, setInitialData] = useState<any>(undefined)
  const [loading, setLoading] = useState(!!quotationId)

  useEffect(() => {
    if (quotationId) {
      quotationsAPI.getQuotationById(businessId, quotationId)
        .then(res => {
          if (res.success && res.quotation) {
            setInitialData({
              customerId: res.quotation.customerId,
              quotationId: res.quotation.id,
              dealId: res.quotation.dealId || '',
              assignedToId: res.quotation.assignedToId || '',
              tax: res.quotation.tax || 0,
              discount: res.quotation.discount || 0,
              notes: res.quotation.notes || '',
              items: res.quotation.items?.map(i => ({
                productId: i.productId || '',
                description: i.description,
                itemType: i.itemType || 'GOODS',
                hsnSacCode: i.hsnSacCode || '',
                quantity: i.quantity,
                price: i.price,
                taxPercent: i.taxPercent || 0,
              })) || []
            })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [businessId, quotationId])

  const handleSubmit = async (data: any) => {
    const response = await salesOrdersAPI.createSalesOrder(businessId, data)
    if (response.success) {
      toast.success('Sales order created successfully')
      navigate(`/dashboard/${businessId}/sales-orders`)
    }
  }

  if (loading) {
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
          onClick={() => navigate(`/dashboard/${businessId}/sales-orders`)}
          className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-600 shrink-0 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
            <ReceiptText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create Sales Order</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Fill in the necessary details to generate a new sales order.</p>
          </div>
        </div>
      </div>

      <SalesOrderForm
        businessId={businessId}
        title="Sales Order Information"
        description="Provide comprehensive details for the sales order, including items, pricing, and scheduling."
        submitLabel="Create Sales Order"
        mode="create"
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
