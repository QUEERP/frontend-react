import { SalesOrderDetailsClient } from '@/components/dashboard/sales-order-details-client'
import { useParams } from "react-router-dom";

export default function SalesOrderDetailsPage() {
  const { businessId, id } = useParams()
  return <SalesOrderDetailsClient businessId={businessId} orderId={id} />
}
