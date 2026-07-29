import { CustomerContactsPageClient } from '@/components/contacts/customer-contacts-page-client'
import { useParams } from "react-router-dom";

export default function CustomerContactsPage() {
  const { businessId, customerId } = useParams()
  return <CustomerContactsPageClient businessId={businessId} customerId={customerId} />
}
