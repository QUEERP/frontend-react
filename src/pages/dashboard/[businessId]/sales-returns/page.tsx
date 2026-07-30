import { SalesReturnsPageClient } from '@/components/dashboard/sales-returns-page-client'
import { useParams } from "react-router-dom";

export default function SalesReturnsPage() {
  const { businessId } = useParams()
  return <SalesReturnsPageClient businessId={businessId as string} />
}
