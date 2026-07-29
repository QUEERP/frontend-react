import { CreditNotesPageClient } from '@/components/dashboard/credit-notes-page-client'
import { useParams } from "react-router-dom";

export default function CreditNotesPage() {
  const { businessId } = useParams()
  return <CreditNotesPageClient businessId={businessId} />
}
