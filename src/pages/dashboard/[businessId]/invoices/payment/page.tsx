import { InvoicePaymentPageClient } from '@/components/dashboard/invoice-payment-page-client'
import { useParams, useSearchParams } from "react-router-dom";

export default function InvoicePaymentPage() {
  const { businessId } = useParams()
  const searchParams = useSearchParams()[0];
const invoiceId = searchParams.get('invoiceId');
const customerId = searchParams.get('customerId');

  return <InvoicePaymentPageClient businessId={businessId as string} invoiceId={invoiceId as string} customerId={customerId as string} />
}
