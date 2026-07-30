import JournalEntryDetailsClient from '@/components/dashboard/journal-entry-details-client'
import { useParams } from "react-router-dom";

type Props = {
  params: Promise<{
    businessId: string
    id: string
  }>
}

export default function JournalEntryDetailsPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const { id } = useParams()
  return <JournalEntryDetailsClient entryId={id as string} />
}
