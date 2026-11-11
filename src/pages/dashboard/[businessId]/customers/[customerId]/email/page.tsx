import { CustomerEmailPageClient } from '@/components/dashboard/customer-email-page-client'
import { useParams } from 'react-router-dom'

export default function CustomerEmailPage() {
  const routerParams = useParams() as any
  const { businessId, customerId } = routerParams

  return <CustomerEmailPageClient businessId={businessId as string} customerId={customerId as string} />
}

