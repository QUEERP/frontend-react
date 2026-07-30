import { CustomerContactsPageClient } from '@/components/contacts/customer-contacts-page-client'
import { useParams } from "react-router-dom";

export default function CustomerContactsPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const { customerId } = useParams()
  return <CustomerContactsPageClient businessId={businessId as string} customerId={customerId as string} />
}
