import { AddInvoiceClient } from '@/components/dashboard/add-invoice-client'
import { useParams, useSearchParams } from "react-router-dom";

export default function AddInvoicePage() {
  const routerParams = useParams() as any;
  const { businessId, id, projectId } = routerParams;

  
  const searchParams = useSearchParams()[0];

const salesOrderId = searchParams.get('salesOrderId');

  return <AddInvoiceClient businessId={businessId as string} invoiceId={id as string} salesOrderId={salesOrderId || undefined} projectId={projectId as string} />
}
