import { AddEmployeeClient } from '@/components/dashboard/add-employee-client'
import { useParams } from "react-router-dom";

export default function AddEmployeePage() {
  const { businessId } = useParams()
  return <AddEmployeeClient businessId={businessId} />
}
