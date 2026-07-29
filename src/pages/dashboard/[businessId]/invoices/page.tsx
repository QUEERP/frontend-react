import { InvoicesPageClient } from '@/components/dashboard/invoices-page-client'
import { useParams } from "react-router-dom";

export default function InvoicesPage() {
  const { businessId } = useParams()
  return <InvoicesPageClient businessId={businessId} />
}
