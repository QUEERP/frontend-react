import { useParams } from 'react-router-dom';
import { PurchaseRequestDetailsClient } from '@/components/dashboard/purchase-request-details-client'

interface PageProps {
  params: {
    businessId: string
    id: string
  }
}

export default function PurchaseRequestDetailsPage() {
  const routerParams = useParams() as any;
  const { businessId, id } = routerParams;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <PurchaseRequestDetailsClient businessId={businessId as string} requestId={id as string} />
    </div>
  )
}
