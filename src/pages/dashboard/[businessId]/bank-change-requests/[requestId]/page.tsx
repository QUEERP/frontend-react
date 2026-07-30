import { BankChangeDetailPageClient } from '@/components/dashboard/bank-change-detail-page-client'
import { useParams } from "react-router-dom";

export default function BankChangeDetailPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const { requestId } = useParams()
  return <BankChangeDetailPageClient businessId={businessId as string} requestId={requestId as string} />
}
