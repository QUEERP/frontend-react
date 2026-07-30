import { InvoiceDetailsClient } from '@/components/dashboard/invoice-details-client'
import { useParams } from "react-router-dom";

export default function InvoiceDetailsPage() {
  const routerParams = useParams() as any;
  const { businessId, id } = routerParams;

  
  return <InvoiceDetailsClient businessId={businessId as string} invoiceId={id as string} />
}
