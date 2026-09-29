import { VendorBillDetailsClient } from '@/components/dashboard/vendor-bill-details-client'
import { useParams } from "react-router-dom";

export default function VendorBillDetailsPage() {
  const { businessId, id } = useParams()
  return <VendorBillDetailsClient businessId={businessId as string} billId={id as string} />
}
