import { BankChangeRequestsPageClient } from '@/components/dashboard/bank-change-requests-page-client'
import { useParams } from "react-router-dom";

export default function BankChangeRequestsPage() {
  const { businessId } = useParams()
  return <BankChangeRequestsPageClient businessId={businessId} />
}
