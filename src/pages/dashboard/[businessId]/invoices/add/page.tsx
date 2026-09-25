import { AddInvoiceClient } from '@/components/dashboard/add-invoice-client'
import { useParams, useSearchParams } from "react-router-dom";

export default function AddInvoicePage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const searchParams = useSearchParams()[0];
  const id = searchParams.get('id');
  const salesOrderId = searchParams.get('salesOrderId');
  const projectId = searchParams.get('projectId');
  const customerId = searchParams.get('customerId');

  return (
    <AddInvoiceClient 
      businessId={businessId as string} 
      invoiceId={id || undefined}
      salesOrderId={salesOrderId || undefined} 
      projectId={projectId || undefined}
      prefillCustomerId={customerId || undefined}
    />
  )
}
