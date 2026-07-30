import { RecurringInvoicesPageClient } from '@/components/dashboard/recurring-invoices-page-client'
import { useParams } from "react-router-dom";

export default function RecurringInvoicesPage() {
  const { businessId } = useParams()
  return <RecurringInvoicesPageClient businessId={businessId as string} />
}
