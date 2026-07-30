import { PaymentsPageClient } from '@/components/dashboard/payments-page-client'
import { useParams } from "react-router-dom";

export default function PaymentsPage() {
  const { businessId } = useParams()
  return <PaymentsPageClient businessId={businessId as string} />
}
