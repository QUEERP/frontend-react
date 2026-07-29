import { EmployeeDetailPageClient } from '@/components/dashboard/employee-detail-page-client'
import { useParams } from "react-router-dom";

export default function EmployeeDetailPage() {
  const { businessId, employeeId } = useParams()
  return <EmployeeDetailPageClient businessId={businessId} employeeId={employeeId} />
}
