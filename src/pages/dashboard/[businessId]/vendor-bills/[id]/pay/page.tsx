import { VendorBillPayClient } from '@/components/dashboard/vendor-bill-pay-client'
import { useParams } from "react-router-dom";

export default function VendorBillPayPage() {
  const { businessId, id } = useParams()
  return <VendorBillPayClient businessId={businessId as string} billId={id as string} />
}
