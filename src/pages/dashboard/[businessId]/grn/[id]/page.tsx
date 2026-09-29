import { GRNDetailsClient } from '@/components/dashboard/grn-details-client'
import { useParams } from "react-router-dom";

export default function GRNDetailsPage() {
  const { businessId, id } = useParams()
  return <GRNDetailsClient businessId={businessId as string} grnId={id as string} />
}
