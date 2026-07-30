import { PayrollDetailPageClient } from '@/components/dashboard/payroll-detail-page-client'
import { useParams } from "react-router-dom";

export default function PayrollDetailPage() {
  const routerParams = useParams() as any;
  const { businessId, payrollId } = routerParams;

  
  return <PayrollDetailPageClient businessId={businessId as string} payrollId={payrollId as string} />
}
