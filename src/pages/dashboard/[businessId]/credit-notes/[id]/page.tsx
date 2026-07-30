import { CreditNoteDetailsClient } from '@/components/dashboard/credit-note-details-client'
import { useParams } from "react-router-dom";

export default function CreditNoteDetailsPage() {
  const routerParams = useParams() as any;
  const { businessId, id } = routerParams;

  
  return <CreditNoteDetailsClient businessId={businessId as string} creditNoteId={id as string} />
}
