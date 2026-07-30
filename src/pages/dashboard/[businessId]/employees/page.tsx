import { EmployeesPageClient } from '@/components/dashboard/employees-page-client'
import { useParams } from "react-router-dom";

export default function EmployeesPage() {
  const { businessId } = useParams()
  return <EmployeesPageClient businessId={businessId as string} />
}
