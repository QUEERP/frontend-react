import { VendorPageClient } from '@/components/dashboard/vendor-page-client'
import { useParams } from "react-router-dom";

export default function VendorsPage() {
  const { businessId } = useParams()
  return <VendorPageClient businessId={businessId} />
}
