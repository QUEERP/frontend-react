import { PurchaseOrdersPageClient } from '@/components/dashboard/purchase-orders-page-client'
import { useParams } from "react-router-dom";

export default function PurchaseOrdersPage() {
  const { businessId } = useParams()
  return <PurchaseOrdersPageClient businessId={businessId as string} />
}
