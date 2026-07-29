import * as React from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DealForm } from '@/components/dashboard/deal-form'
import { CreateDealData, dealsAPI } from '@/lib/api/deals'

export default function AddDealPage() {
  const navigate = useNavigate()
  const params = useParams()
  

  const handleSubmit = async (data: CreateDealData) => {
    const response = await dealsAPI.createDeal(businessId, data)
    if (response.success) {
      toast.success('Deal created successfully')
      navigate(`/dashboard/${businessId}/deals`)
      navigate(0)
    }
  }

  return (
    <div className="flex min-h-svh w-full flex-col gap-6 bg-[#f8fafc] px-4 pb-12 pt-0 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/dashboard/${businessId}/deals`)}
            className="h-10 w-10 cursor-pointer bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Deal</h1>
            <p className="text-sm text-slate-500 mt-0.5">Create a new deal to track in your pipeline</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <DealForm
          businessId={businessId}
          title="Deal Details"
          description="Enter the essential information to create a new opportunity in your pipeline."
          submitLabel="Create Deal"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}