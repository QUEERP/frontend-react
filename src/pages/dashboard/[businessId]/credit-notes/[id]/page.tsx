import { CreditNoteDetailsClient } from '@/components/dashboard/credit-note-details-client'
import { useParams } from "react-router-dom";

export default function CreditNoteDetailsPage() {
  const { businessId, id } = useParams()
  return <CreditNoteDetailsClient businessId={businessId} creditNoteId={id} />
}
