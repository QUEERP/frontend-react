import { DealsPageClient } from '@/components/dashboard/deals-page-client'
import { useParams } from "react-router-dom";

export default function DealsPage() {
  const { businessId } = useParams()
  return <DealsPageClient businessId={businessId as string} />
}