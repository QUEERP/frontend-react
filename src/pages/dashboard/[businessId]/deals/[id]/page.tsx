import { DealDetailsClient } from '@/components/dashboard/deal-details-client'
import { useParams } from "react-router-dom";

export default function DealDetailsPage() {
  const { businessId, id } = useParams()
  return <DealDetailsClient businessId={businessId} dealId={id} />
}