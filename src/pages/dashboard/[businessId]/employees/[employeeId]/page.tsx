import { EmployeeDetailPageClient } from '@/components/dashboard/employee-detail-page-client'
import { useParams } from "react-router-dom";

export default function EmployeeDetailPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const { employeeId } = useParams()
  return <EmployeeDetailPageClient businessId={businessId as string} employeeId={employeeId as string} />
}
