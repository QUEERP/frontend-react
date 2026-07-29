import { CustomerViewClient } from '@/components/dashboard/customer-view-client'
import { useParams } from "react-router-dom";

export default function CustomerViewPage() {
  const { businessId, customerId } = useParams()
  return <CustomerViewClient businessId={businessId} customerId={customerId} />
}
