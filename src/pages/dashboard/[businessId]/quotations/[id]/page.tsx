import { QuotationDetailsClient } from '@/components/dashboard/quotation-details-client'
import { useParams } from "react-router-dom";

export default function QuotationDetailsPage() {
  const { businessId, id } = useParams()
  return <QuotationDetailsClient businessId={businessId} quotationId={id} />
}
