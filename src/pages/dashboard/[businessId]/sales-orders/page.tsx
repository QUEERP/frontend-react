import { SalesOrdersPageClient } from '@/components/dashboard/sales-orders-page-client'
import { useParams } from "react-router-dom";

export default function SalesOrdersPage() {
  const { businessId } = useParams()
  return <SalesOrdersPageClient businessId={businessId as string} />
}
