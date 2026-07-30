import * as React from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DealForm } from '@/components/dashboard/deal-form'
import { CreateDealData, dealsAPI } from '@/lib/api/deals'

export default function EditDealPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const navigate = useNavigate()
  const params = useParams()
  
  const { id } = useParams();
const dealId = id as string
  const [initialData, setInitialData] = React.useState<Partial<CreateDealData> | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadDeal = async () => {
      try {
        setLoading(true)
        const response = await dealsAPI.getDealById(businessId, dealId)
        if (response.success) {
          const deal = response.deal
          setInitialData({
            name: deal.name,
            amount: Number(deal.amount),
            customerId: deal.customerId,
            contactId: deal.contactId || '',
            assignedToId: deal.assignedToId || '',
            stage: deal.stage as CreateDealData['stage'],
            expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split('T')[0] : '',
            probability: deal.probability ?? undefined,
            source: deal.source || '',
            description: deal.description || '',
          })
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load deal')
      } finally {
        setLoading(false)
      }
    }

    loadDeal()
  }, [businessId, dealId])

  const handleSubmit = async (data: CreateDealData) => {
    const response = await dealsAPI.updateDeal(businessId, dealId, data)
    if (response.success) {
      toast.success('Deal updated successfully')
      navigate(`/dashboard/${businessId}/deals/${dealId}`)
      navigate(0)
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
        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${businessId}/deals/${dealId}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Deal
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Deal</h1>
          <p className="text-muted-foreground">Update deal data using the same backend-supported fields</p>
        </div>
      </div>

      <DealForm
        businessId={businessId as string}
        title="Update Deal"
        description="Only fields supported by the backend are included here."
        submitLabel="Save Changes"
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  )
}