import { useParams } from 'react-router-dom'
import { ViewRecurringInvoiceClient } from '@/components/dashboard/view-recurring-invoice-client'

export default function ViewRecurringInvoicePage() {
  const { businessId, id } = useParams<{ businessId: string; id: string }>()

  if (!businessId || !id) {
    return <div>Missing parameters</div>
  }

  return <ViewRecurringInvoiceClient businessId={businessId} id={id} />
}
