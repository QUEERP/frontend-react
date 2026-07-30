import { EmployeeEditClient } from '@/components/dashboard/employee-edit-client'
import { useParams } from "react-router-dom";

export default function EmployeeEditPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const { employeeId } = useParams()
  return <EmployeeEditClient businessId={businessId as string} employeeId={employeeId as string} />
}
