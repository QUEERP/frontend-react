import { DealDetailsClient } from '@/components/dashboard/deal-details-client'
import { useParams } from "react-router-dom";

export default function DealDetailsPage() {
  const routerParams = useParams() as any;
  const { businessId, id } = routerParams;

  
  return <DealDetailsClient businessId={businessId as string} dealId={id as string} />
}