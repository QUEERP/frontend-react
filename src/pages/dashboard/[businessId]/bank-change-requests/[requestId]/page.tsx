import { BankChangeDetailPageClient } from '@/components/dashboard/bank-change-detail-page-client'
import { useParams } from "react-router-dom";

export default function BankChangeDetailPage() {
  const { businessId, requestId } = useParams()
  return <BankChangeDetailPageClient businessId={businessId} requestId={requestId} />
}
