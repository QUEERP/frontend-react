import { InvoiceDetailsClient } from '@/components/dashboard/invoice-details-client'
import { useParams } from "react-router-dom";

export default function InvoiceDetailsPage() {
  const { businessId, id } = useParams()
  return <InvoiceDetailsClient businessId={businessId} invoiceId={id} />
}
