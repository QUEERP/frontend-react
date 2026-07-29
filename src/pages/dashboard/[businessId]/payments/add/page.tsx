import { QuotationPaymentPageClient } from '@/components/dashboard/quotation-payment-page-client'
import { InvoicePaymentPageClient } from '@/components/dashboard/invoice-payment-page-client'
import {  redirect, useParams, useSearchParams } from 'react-router-dom';

export default function AddPaymentPage() {
  const { businessId } = useParams()
  const searchParams = useSearchParams()[0];
const quotationId = searchParams.get('quotationId');
const invoiceId = searchParams.get('invoiceId');
const projectId = searchParams.get('projectId');
const customerId = searchParams.get('customerId');

  if (invoiceId) {
    return <InvoicePaymentPageClient businessId={businessId as string} invoiceId={invoiceId as string} customerId={customerId as string} />
  }

  if (quotationId || projectId || customerId) {
    return <QuotationPaymentPageClient businessId={businessId as string} quotationId={quotationId as string} projectId={projectId as string} customerId={customerId as string} />
  }

  // fallback redirect if no query param provided
  redirect(`/dashboard/${businessId}/payments`)
}
