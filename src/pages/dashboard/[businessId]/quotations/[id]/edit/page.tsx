import * as React from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { QuotationForm } from '@/components/dashboard/quotation-form'
import { quotationsAPI, UpdateQuotationData } from '@/lib/api/quotations'

export default function EditQuotationPage() {
  const navigate = useNavigate()
  const params = useParams()
  const businessId = params.businessId || ''
  
  const { id } = useParams();
  const quotationId = id as string

  const [initialData, setInitialData] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await quotationsAPI.getQuotationById(businessId, quotationId)
        if (response.success) {
          const quotation = response.quotation
          setInitialData({
            title: quotation.title || '',
            customerId: quotation.customerId,
            dealId: quotation.dealId || '',
            assignedToId: quotation.assignedToId || '',
            tax: quotation.tax || 0,
            discount: quotation.discount || 0,
            issueDate: quotation.issueDate ? quotation.issueDate.split('T')[0] : '',
            expiryDate: quotation.expiryDate ? quotation.expiryDate.split('T')[0] : '',
            notes: quotation.notes || '',
            status: quotation.status,
            currency: quotation.currency || '',
            gstTreatment: quotation.gstTreatment || 'SAME_STATE',
            items: (quotation.items || []).map((item: any) => ({
              id: item.id,
              productId: item.productId || '',
              itemName: item.itemName || '',
              description: item.description || '',
              quantity: item.quantity || 1,
              price: item.rate || item.price || 0,
              taxPercent: item.taxPercent || 0,
              cgstPercent: item.cgstPercent || (item.taxPercent / 2) || 0,
              sgstPercent: item.sgstPercent || (item.taxPercent / 2) || 0,
              igstPercent: item.igstPercent || item.taxPercent || 0,
              itemType: item.itemType || 'GOODS',
              hsnSacCode: item.hsnSacCode || ''
            }))
          })
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load quotation')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [businessId, quotationId])

  const handleSubmit = async (data: UpdateQuotationData) => {
    const response = await quotationsAPI.updateQuotation(businessId, quotationId, data)
    if (response.success) {
      toast.success('Quotation updated successfully')
      navigate(`/dashboard/${businessId}/quotations`)
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <Edit3 className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            Edit Quotation
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
            Modify the existing quotation and update its line items or status.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/dashboard/${businessId}/quotations`)}
          className="h-11 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm font-semibold"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Cancel & Return
        </Button>
      </div>

      <div className="w-full flex justify-center">
        <div className="w-full max-w-5xl">
          <QuotationForm
            businessId={businessId}
            title="Update Quotation Details"
            description="Update the fields below. Any changes to pricing or items will be instantly calculated."
            submitLabel="Save Changes"
            initialData={initialData}
            mode="edit"
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}
