import { QuotationsPageClient } from '@/components/dashboard/quotations-page-client'
import { useParams } from "react-router-dom";

export default function QuotationsPage() {
  const { businessId } = useParams()
  return <QuotationsPageClient businessId={businessId} />
}
