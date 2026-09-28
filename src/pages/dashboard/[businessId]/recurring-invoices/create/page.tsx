import { useParams } from 'react-router-dom'
import { CreateRecurringInvoiceClient } from '@/components/dashboard/create-recurring-invoice-client'

export default function CreateRecurringInvoicePage() {
  const { businessId } = useParams<{ businessId: string }>()

  if (!businessId) {
    return <div>Business ID is missing</div>
  }

  return <CreateRecurringInvoiceClient businessId={businessId} />
}
