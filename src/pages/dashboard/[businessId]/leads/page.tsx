import { LeadsPageClient } from '@/components/dashboard/leads-page-client'
import { useParams } from "react-router-dom";

export default function LeadsPage() {
  const { businessId } = useParams()
  return <LeadsPageClient businessId={businessId as string} />
}
