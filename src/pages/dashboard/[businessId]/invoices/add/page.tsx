import { AddInvoiceClient } from '@/components/dashboard/add-invoice-client'
import { useParams, useSearchParams } from "react-router-dom";

export default function AddInvoicePage() {
  const { businessId } = useParams()
  const searchParams = useSearchParams()[0];
const id = searchParams.get('id');
const salesOrderId = searchParams.get('salesOrderId');
const projectId = searchParams.get('projectId');
  return <AddInvoiceClient businessId={businessId} invoiceId={id} salesOrderId={salesOrderId} projectId={projectId} />
}
