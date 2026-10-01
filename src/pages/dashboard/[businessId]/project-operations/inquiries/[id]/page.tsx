import { InquiryDetailsClient } from '@/components/dashboard/inquiry-details-client'
import { useParams } from "react-router-dom";

export default function InquiryDetailsPage() {
  const { businessId, id } = useParams()
  return <InquiryDetailsClient businessId={businessId as string} />
}
