import { useParams } from 'react-router-dom'
import { EditRecurringInvoiceClient } from '@/components/dashboard/edit-recurring-invoice-client'

export default function EditRecurringInvoicePage() {
  const { businessId, id } = useParams<{ businessId: string; id: string }>()

  if (!businessId || !id) {
    return <div>Missing parameters</div>
  }

  return <EditRecurringInvoiceClient businessId={businessId} id={id} />
}
