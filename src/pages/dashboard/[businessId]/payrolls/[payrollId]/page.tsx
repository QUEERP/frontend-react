import { PayrollDetailPageClient } from '@/components/dashboard/payroll-detail-page-client'
import { useParams } from "react-router-dom";

export default function PayrollDetailPage() {
  const { businessId, payrollId } = useParams()
  return <PayrollDetailPageClient businessId={businessId} payrollId={payrollId} />
}
