import { LeavesPageClient } from '@/components/dashboard/leaves-page-client'
import { useParams } from "react-router-dom";

export default function LeavesPage() {
  const { businessId } = useParams()
  return <LeavesPageClient businessId={businessId} />
}
