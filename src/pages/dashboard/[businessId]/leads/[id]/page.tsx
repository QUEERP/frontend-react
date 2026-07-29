import { LeadDetailsClient } from '@/components/dashboard/lead-details-client'
import { useParams } from "react-router-dom";

export default function LeadDetailsPage() {
  const { businessId, id } = useParams()
  return <LeadDetailsClient businessId={businessId} />
}
