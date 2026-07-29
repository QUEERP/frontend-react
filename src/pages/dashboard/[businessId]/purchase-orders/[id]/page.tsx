import { PurchaseOrderDetailsClient } from '@/components/dashboard/purchase-order-details-client'
import { useParams } from "react-router-dom";

export default function PurchaseOrderDetailsPage() {
  const { businessId, id } = useParams()
  return <PurchaseOrderDetailsClient businessId={businessId} orderId={id} />
}
