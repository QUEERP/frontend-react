import { OvertimePageClient } from '@/components/dashboard/overtime-page-client'
import { useParams } from "react-router-dom";

export default function OvertimePage() {
  const { businessId } = useParams()
  return <OvertimePageClient businessId={businessId} />
}
