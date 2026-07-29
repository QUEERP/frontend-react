import { LoanPageClient } from '@/components/dashboard/loan-page-client'
import { useParams } from "react-router-dom";

export default function LoansPage() {
  const { businessId } = useParams()
  return <LoanPageClient businessId={businessId} />
}
