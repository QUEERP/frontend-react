import { CustomersPageClient } from '@/components/dashboard/customers-page-client'
import { useParams } from "react-router-dom";

export default function CustomersPage() {
  const { businessId } = useParams()
  return <CustomersPageClient businessId={businessId} />
}
