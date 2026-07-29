import { EmployeeEditClient } from '@/components/dashboard/employee-edit-client'
import { useParams } from "react-router-dom";

export default function EmployeeEditPage() {
  const { businessId, employeeId } = useParams()
  return <EmployeeEditClient businessId={businessId} employeeId={employeeId} />
}
