import { DashboardPageClient } from '@/components/dashboard/dashboard-page-client'
import { useParams } from "react-router-dom";

export default function DashboardPage() {
  const { businessId } = useParams()
  return <DashboardPageClient businessId={businessId as string} />
}

