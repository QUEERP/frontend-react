import {  useParams, useNavigate, useSearchParams  } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { QuotationForm } from '@/components/dashboard/quotation-form'
import { CreateQuotationData, quotationsAPI } from '@/lib/api/quotations'
import { dealsAPI } from '@/lib/api/deals'
import React, { Suspense } from 'react'

function AddQuotationContent() {
  const navigate = useNavigate()
  const params = useParams()
  const businessId = params.businessId || ''
  
  const [searchParams] = useSearchParams()
  const customerId = searchParams.get('customerId') || ''
  const dealId = searchParams.get('dealId') || ''
  const dealTitle = searchParams.get('dealTitle') || ''
  const source = searchParams.get('source') || ''

  const handleSubmit = async (data: any) => {
    const response = await quotationsAPI.createQuotation(businessId, data)
    if (response.success) {
      toast.success('Quotation created successfully')
      if (dealId) {
        try {
          await dealsAPI.updateDeal(businessId, dealId, { stage: 'Won' })
          toast.success('Deal marked as Won')
        } catch (e) {
          console.error('Failed to update deal stage:', e)
        }
      }
      navigate(`/dashboard/${businessId}/quotations`)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-[#f8fafc] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            Create New Quotation
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
            Draft a new proposal and itemized quote for your customer.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (source === 'deals') {
              navigate(`/dashboard/${businessId}/deals`)
            } else {
              navigate(`/dashboard/${businessId}/quotations`)
            }
          }}
          className="h-11 px-6 rounded-xl cursor-pointer border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm font-semibold"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          {source === 'deals' ? 'Back to Deals' : 'Back to Directory'}
        </Button>
      </div>

      <div className="w-full flex justify-center">
        <div className="w-full max-w-5xl">
          <QuotationForm
            businessId={businessId as string}
            title="Quotation Details"
            description="Fill out the information below to create a comprehensive quotation."
            submitLabel="Save and Create Quotation"
            mode="create"
            initialData={{ customerId, title: dealTitle, dealId }}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}

export default function AddQuotationPage() {
  return (
    <Suspense>
      <AddQuotationContent />
    </Suspense>
  )
}
