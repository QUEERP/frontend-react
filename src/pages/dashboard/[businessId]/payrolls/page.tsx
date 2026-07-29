import { PayrollsPageClient } from '@/components/dashboard/payrolls-page-client'
import { useParams } from "react-router-dom";

export default function PayrollsPage() {
  const { businessId } = useParams()
  return <PayrollsPageClient businessId={businessId} />
}
