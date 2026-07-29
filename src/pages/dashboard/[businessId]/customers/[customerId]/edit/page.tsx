import { CustomerEditClient } from '@/components/dashboard/customer-edit-client'
import { useParams } from "react-router-dom";

export default function CustomerEditPage() {
  const { businessId, customerId } = useParams()
  return <CustomerEditClient businessId={businessId} customerId={customerId} />
}
