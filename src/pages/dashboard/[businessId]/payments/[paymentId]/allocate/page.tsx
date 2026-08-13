import { PaymentAllocationPageClient } from '@/components/dashboard/payment-allocation-page-client'
import { useParams } from 'react-router-dom'

export default function PaymentAllocationPage() {
  const { businessId, paymentId } = useParams()
  return <PaymentAllocationPageClient businessId={businessId as string} paymentId={paymentId as string} />
}
